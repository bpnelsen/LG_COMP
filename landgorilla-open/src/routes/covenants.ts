import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authenticate);

const covenantSchema = z.object({
  covenant_type: z.enum(['financial', 'reporting', 'operational', 'insurance']),
  description: z.string().min(1),
  threshold_value: z.number().optional(),
  threshold_operator: z.enum(['<', '<=', '>', '>=', '=']).optional(),
  frequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual', 'one_time']),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

const testSchema = z.object({
  tested_value: z.number(),
  notes: z.string().optional(),
});

const exceptionSchema = z.object({
  exception_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actual_value: z.number().optional(),
  description: z.string().min(1),
});

async function getLoan(loanId: string, orgId: string) {
  const rows = await query(
    'SELECT id FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [loanId, orgId]
  );
  return rows[0] ?? null;
}

// GET /loans/:loanId/covenants
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    `SELECT c.*,
       (SELECT json_agg(e ORDER BY e.exception_date DESC) FROM covenant_exceptions e WHERE e.covenant_id = c.id) as exceptions
     FROM covenants c WHERE c.loan_id = $1 AND c.is_active = true ORDER BY c.next_due_date NULLS LAST`,
    [req.params.loanId]
  );
  res.json({ success: true, data: rows });
});

// GET /loans/:loanId/covenants/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    'SELECT * FROM covenants WHERE id = $1 AND loan_id = $2 AND is_active = true',
    [req.params.id, req.params.loanId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Covenant not found' }); return; }
  const exceptions = await query(
    'SELECT * FROM covenant_exceptions WHERE covenant_id = $1 ORDER BY exception_date DESC',
    [req.params.id]
  );
  res.json({ success: true, data: { ...rows[0], exceptions } });
});

// POST /loans/:loanId/covenants
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const parsed = covenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;
  const rows = await query(
    `INSERT INTO covenants
       (loan_id, covenant_type, description, threshold_value, threshold_operator,
        frequency, next_due_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.params.loanId, d.covenant_type, d.description, d.threshold_value ?? null,
     d.threshold_operator ?? null, d.frequency, d.next_due_date ?? null, d.notes ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Covenant created' });
});

// PUT /loans/:loanId/covenants/:id
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const existing = await query(
    'SELECT id FROM covenants WHERE id = $1 AND loan_id = $2 AND is_active = true',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Covenant not found' }); return; }

  const parsed = covenantSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) { setClauses.push(`${k} = $${idx++}`); params.push(v); }
  }
  if (!setClauses.length) { res.status(400).json({ success: false, error: 'No fields to update' }); return; }
  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.id);
  const rows = await query(
    `UPDATE covenants SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`, params
  );
  res.json({ success: true, data: rows[0], message: 'Covenant updated' });
});

// DELETE /loans/:loanId/covenants/:id
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const existing = await query(
    'SELECT id FROM covenants WHERE id = $1 AND loan_id = $2 AND is_active = true',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Covenant not found' }); return; }
  await query('UPDATE covenants SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Covenant removed' });
});

// POST /loans/:loanId/covenants/:id/test  — record a compliance test result
router.post('/:id/test', requireRole('admin', 'loan_officer', 'analyst'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const cov = await query(
    'SELECT * FROM covenants WHERE id = $1 AND loan_id = $2 AND is_active = true',
    [req.params.id, req.params.loanId]
  );
  if (!cov[0]) { res.status(404).json({ success: false, error: 'Covenant not found' }); return; }

  const parsed = testSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }

  const c = cov[0] as { threshold_value: number | null; threshold_operator: string | null };
  const { tested_value, notes } = parsed.data;
  let status = 'compliant';

  if (c.threshold_value !== null && c.threshold_operator) {
    const ops: Record<string, boolean> = {
      '<': tested_value < c.threshold_value,
      '<=': tested_value <= c.threshold_value,
      '>': tested_value > c.threshold_value,
      '>=': tested_value >= c.threshold_value,
      '=': tested_value === c.threshold_value,
    };
    if (!ops[c.threshold_operator]) status = 'breach';
  }

  const rows = await query(
    `UPDATE covenants SET status = $1, last_tested_at = NOW(), last_tested_value = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, tested_value, req.params.id]
  );

  if (status === 'breach') {
    await query(
      `INSERT INTO covenant_exceptions (covenant_id, reported_by, actual_value, description)
       VALUES ($1,$2,$3,$4)`,
      [req.params.id, req.user!.user_id, tested_value, notes ?? `Breach detected: value ${tested_value}`]
    );
  }

  res.json({ success: true, data: rows[0], message: `Covenant tested: ${status}` });
});

// POST /loans/:loanId/covenants/:id/exceptions
router.post('/:id/exceptions', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const cov = await query(
    'SELECT id FROM covenants WHERE id = $1 AND loan_id = $2 AND is_active = true',
    [req.params.id, req.params.loanId]
  );
  if (!cov[0]) { res.status(404).json({ success: false, error: 'Covenant not found' }); return; }

  const parsed = exceptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;
  const rows = await query(
    `INSERT INTO covenant_exceptions (covenant_id, reported_by, exception_date, actual_value, description)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, req.user!.user_id, d.exception_date ?? new Date().toISOString().slice(0, 10),
     d.actual_value ?? null, d.description]
  );
  await query(
    `UPDATE covenants SET status = 'exception', updated_at = NOW() WHERE id = $1`,
    [req.params.id]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Exception recorded' });
});

export default router;
