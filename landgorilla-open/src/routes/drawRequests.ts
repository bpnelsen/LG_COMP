import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authenticate);

const createSchema = z.object({
  contractor_id:    z.string().uuid().optional(),
  requested_amount: z.number().positive(),
  requested_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description:      z.string().optional(),
  line_items:       z.record(z.unknown()).optional(),
  percent_complete: z.number().min(0).max(100).optional(),
});

const updateSchema = createSchema.partial();

const scheduleInspectionSchema = z.object({
  inspector_name:  z.string().min(1).max(200),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const completeInspectionSchema = z.object({
  inspection_notes: z.string().optional(),
  percent_complete: z.number().min(0).max(100),
});

const approveSchema = z.object({
  approved_amount: z.number().positive(),
});

const rejectSchema = z.object({
  rejection_reason: z.string().min(1),
});

async function getLoan(loanId: string, orgId: string) {
  const rows = await query<{ id: string; committed_amount: string }>(
    'SELECT id, committed_amount FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [loanId, orgId]
  );
  return rows[0] ?? null;
}

async function getDrawRequest(id: string, loanId: string) {
  const rows = await query<{ id: string; status: string; requested_amount: string; approved_amount: string | null }>(
    'SELECT id, status, requested_amount, approved_amount FROM draw_requests WHERE id = $1 AND loan_id = $2 AND is_active = true',
    [id, loanId]
  );
  return rows[0] ?? null;
}

// GET /loans/:loanId/draw-requests
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const statusFilter = req.query.status as string | undefined;

  const conditions = ['dr.loan_id = $1', 'dr.is_active = true'];
  const params: unknown[] = [req.params.loanId];
  let idx = 2;

  if (statusFilter) { conditions.push(`dr.status = $${idx++}`); params.push(statusFilter); }

  const rows = await query(
    `SELECT dr.*,
            c.company_name  as contractor_name,
            u1.first_name || ' ' || u1.last_name as submitted_by_name,
            u2.first_name || ' ' || u2.last_name as approved_by_name
     FROM draw_requests dr
     LEFT JOIN contractors c  ON dr.contractor_id = c.id
     LEFT JOIN users u1        ON dr.submitted_by  = u1.id
     LEFT JOIN users u2        ON dr.approved_by   = u2.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY dr.draw_number ASC`,
    params
  );

  const totalFunded = rows.reduce((sum, r) => {
    const row = r as { status: string; approved_amount: string | null };
    return sum + (row.status === 'funded' ? parseFloat(row.approved_amount ?? '0') : 0);
  }, 0);

  res.json({ success: true, data: rows, meta: { total_funded: totalFunded } });
});

// GET /loans/:loanId/draw-requests/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    `SELECT dr.*,
            c.company_name  as contractor_name,
            u1.first_name || ' ' || u1.last_name as submitted_by_name,
            u2.first_name || ' ' || u2.last_name as approved_by_name
     FROM draw_requests dr
     LEFT JOIN contractors c  ON dr.contractor_id = c.id
     LEFT JOIN users u1        ON dr.submitted_by  = u1.id
     LEFT JOIN users u2        ON dr.approved_by   = u2.id
     WHERE dr.id = $1 AND dr.loan_id = $2 AND dr.is_active = true`,
    [req.params.id, req.params.loanId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  res.json({ success: true, data: rows[0] });
});

// POST /loans/:loanId/draw-requests  — create draft
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  // Verify contractor if provided
  if (d.contractor_id) {
    const c = await query<{ id: string }>(
      'SELECT id FROM contractors WHERE id = $1 AND organization_id = $2 AND is_active = true',
      [d.contractor_id, req.user!.organization_id]
    );
    if (!c[0]) { res.status(404).json({ success: false, error: 'Contractor not found' }); return; }
  }

  // Auto-increment draw_number
  const numRows = await query<{ max: string | null }>(
    'SELECT MAX(draw_number) as max FROM draw_requests WHERE loan_id = $1',
    [req.params.loanId]
  );
  const drawNumber = (parseInt(numRows[0]?.max ?? '0') || 0) + 1;

  const rows = await query(
    `INSERT INTO draw_requests (
       loan_id, contractor_id, draw_number, requested_amount, requested_date,
       description, line_items, percent_complete
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      req.params.loanId, d.contractor_id ?? null, drawNumber, d.requested_amount,
      d.requested_date ?? new Date().toISOString().slice(0,10),
      d.description ?? null,
      d.line_items ? JSON.stringify(d.line_items) : null,
      d.percent_complete ?? null,
    ]
  );
  res.status(201).json({ success: true, data: rows[0], message: `Draw request #${drawNumber} created` });
});

// PUT /loans/:loanId/draw-requests/:id  — update draft
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr)               { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (dr.status !== 'draft') {
    res.status(422).json({ success: false, error: 'Only draft draw requests can be edited' }); return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: unknown[]    = [];
  let idx = 1;

  const fields: Array<[string, unknown]> = [
    ['contractor_id',    d.contractor_id],
    ['requested_amount', d.requested_amount],
    ['requested_date',   d.requested_date],
    ['description',      d.description],
    ['line_items',       d.line_items ? JSON.stringify(d.line_items) : undefined],
    ['percent_complete', d.percent_complete],
  ];
  for (const [col, val] of fields) {
    if (val !== undefined) { setClauses.push(`${col} = $${idx++}`); params.push(val); }
  }

  params.push(req.params.id);
  const rows = await query(
    `UPDATE draw_requests SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  res.json({ success: true, data: rows[0], message: 'Draw request updated' });
});

// POST /loans/:loanId/draw-requests/:id/submit
router.post('/:id/submit', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (dr.status !== 'draft') {
    res.status(422).json({ success: false, error: `Cannot submit a ${dr.status} draw request` }); return;
  }

  const rows = await query(
    `UPDATE draw_requests
     SET status = 'submitted', submitted_by = $1, submitted_at = NOW(), updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [req.user!.user_id, req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Draw request submitted' });
});

// POST /loans/:loanId/draw-requests/:id/schedule-inspection
router.post('/:id/schedule-inspection', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (dr.status !== 'submitted') {
    res.status(422).json({ success: false, error: `Draw request must be submitted before scheduling inspection` }); return;
  }

  const parsed = scheduleInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }

  const rows = await query(
    `UPDATE draw_requests
     SET status = 'inspection_scheduled', inspector_name = $1, inspection_date = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [parsed.data.inspector_name, parsed.data.inspection_date, req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Inspection scheduled' });
});

// POST /loans/:loanId/draw-requests/:id/complete-inspection
router.post('/:id/complete-inspection', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (dr.status !== 'inspection_scheduled') {
    res.status(422).json({ success: false, error: `Inspection must be scheduled first` }); return;
  }

  const parsed = completeInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }

  const rows = await query(
    `UPDATE draw_requests
     SET status = 'inspection_complete', inspection_notes = $1, percent_complete = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [parsed.data.inspection_notes ?? null, parsed.data.percent_complete, req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Inspection completed' });
});

// POST /loans/:loanId/draw-requests/:id/approve
router.post('/:id/approve', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (!['submitted','inspection_complete'].includes(dr.status)) {
    res.status(422).json({ success: false, error: `Cannot approve a ${dr.status} draw request` }); return;
  }

  const parsed = approveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }

  const rows = await query(
    `UPDATE draw_requests
     SET status = 'approved', approved_amount = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [parsed.data.approved_amount, req.user!.user_id, req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Draw request approved' });
});

// POST /loans/:loanId/draw-requests/:id/reject
router.post('/:id/reject', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (['funded','rejected'].includes(dr.status)) {
    res.status(422).json({ success: false, error: `Cannot reject a ${dr.status} draw request` }); return;
  }

  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }

  const rows = await query(
    `UPDATE draw_requests
     SET status = 'rejected', rejection_reason = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [parsed.data.rejection_reason, req.user!.user_id, req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Draw request rejected' });
});

// POST /loans/:loanId/draw-requests/:id/fund  — mark funds disbursed
router.post('/:id/fund', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await getLoan(req.params.loanId, req.user!.organization_id);
  if (!loan) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (dr.status !== 'approved') {
    res.status(422).json({ success: false, error: 'Draw request must be approved before funding' }); return;
  }

  const amount = parseFloat(dr.approved_amount ?? dr.requested_amount);
  const [rows] = await Promise.all([
    query(
      `UPDATE draw_requests SET status = 'funded', funded_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    ),
    query(
      `UPDATE loans SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2`,
      [amount, req.params.loanId]
    ),
  ]);
  res.json({ success: true, data: rows[0], message: 'Draw request funded and loan balance updated' });
});

// DELETE /loans/:loanId/draw-requests/:id  — soft delete draft only
router.delete('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const dr = await getDrawRequest(req.params.id, req.params.loanId);
  if (!dr) { res.status(404).json({ success: false, error: 'Draw request not found' }); return; }
  if (dr.status !== 'draft') {
    res.status(422).json({ success: false, error: 'Only draft draw requests can be deleted' }); return;
  }
  await query(
    'UPDATE draw_requests SET is_active = false, updated_at = NOW() WHERE id = $1',
    [req.params.id]
  );
  res.json({ success: true, message: 'Draw request deleted' });
});

export default router;
