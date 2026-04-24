import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authenticate);

const createSchema = z.object({
  amount: z.number().positive(),
  disbursement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  bank_account: z.string().max(50).optional(),
  wire_reference: z.string().max(100).optional(),
});

const approveSchema = z.object({
  wire_reference: z.string().max(100).optional(),
});

async function getLoan(loanId: string, orgId: string) {
  const rows = await query(
    'SELECT id, committed_amount, current_balance FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [loanId, orgId]
  );
  return (rows[0] as { id: string; committed_amount: number; current_balance: number } | undefined) ?? null;
}

// GET /loans/:loanId/disbursements
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    `SELECT d.*,
            u1.first_name || ' ' || u1.last_name as requested_by_name,
            u2.first_name || ' ' || u2.last_name as approved_by_name
     FROM disbursements d
     LEFT JOIN users u1 ON d.requested_by = u1.id
     LEFT JOIN users u2 ON d.approved_by = u2.id
     WHERE d.loan_id = $1 ORDER BY d.disbursement_date DESC`,
    [req.params.loanId]
  );
  const total = rows.reduce((sum, r) => {
    const row = r as { status: string; amount: string };
    return sum + (row.status === 'disbursed' ? parseFloat(row.amount) : 0);
  }, 0);
  res.json({ success: true, data: rows, meta: { total_disbursed: total } });
});

// GET /loans/:loanId/disbursements/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    `SELECT d.*,
            u1.first_name || ' ' || u1.last_name as requested_by_name,
            u2.first_name || ' ' || u2.last_name as approved_by_name
     FROM disbursements d
     LEFT JOIN users u1 ON d.requested_by = u1.id
     LEFT JOIN users u2 ON d.approved_by = u2.id
     WHERE d.id = $1 AND d.loan_id = $2`,
    [req.params.id, req.params.loanId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Disbursement not found' }); return; }
  res.json({ success: true, data: rows[0] });
});

// POST /loans/:loanId/disbursements
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await getLoan(req.params.loanId, req.user!.organization_id);
  if (!loan) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  const disbursed = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM disbursements WHERE loan_id = $1 AND status = 'disbursed'`,
    [req.params.loanId]
  );
  const alreadyDisbursed = parseFloat(disbursed[0]?.total || '0');
  if (alreadyDisbursed + d.amount > loan.committed_amount) {
    res.status(422).json({
      success: false,
      error: `Disbursement would exceed committed amount of ${loan.committed_amount}`,
    });
    return;
  }

  const rows = await query(
    `INSERT INTO disbursements (loan_id, requested_by, amount, disbursement_date, description, bank_account, wire_reference)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.loanId, req.user!.user_id, d.amount, d.disbursement_date,
     d.description ?? null, d.bank_account ?? null, d.wire_reference ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Disbursement request created' });
});

// POST /loans/:loanId/disbursements/:id/approve
router.post('/:id/approve', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await getLoan(req.params.loanId, req.user!.organization_id);
  if (!loan) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }

  const existing = await query<{ status: string; amount: string }>(
    'SELECT * FROM disbursements WHERE id = $1 AND loan_id = $2',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Disbursement not found' }); return; }
  if (existing[0].status !== 'pending') {
    res.status(422).json({ success: false, error: `Cannot approve a ${existing[0].status} disbursement` }); return;
  }

  const parsed = approveSchema.safeParse(req.body);
  const rows = await query(
    `UPDATE disbursements SET status = 'approved', approved_by = $1, approved_at = NOW(),
      wire_reference = COALESCE($2, wire_reference), updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [req.user!.user_id, parsed.success ? (parsed.data.wire_reference ?? null) : null, req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Disbursement approved' });
});

// POST /loans/:loanId/disbursements/:id/disburse  — mark as funds sent
router.post('/:id/disburse', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await getLoan(req.params.loanId, req.user!.organization_id);
  if (!loan) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }

  const existing = await query<{ status: string; amount: string }>(
    'SELECT * FROM disbursements WHERE id = $1 AND loan_id = $2',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Disbursement not found' }); return; }
  if (existing[0].status !== 'approved') {
    res.status(422).json({ success: false, error: `Disbursement must be approved first` }); return;
  }

  const amount = parseFloat(existing[0].amount);
  const [rows] = await Promise.all([
    query(
      `UPDATE disbursements SET status = 'disbursed', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    ),
    query(
      `UPDATE loans SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2`,
      [amount, req.params.loanId]
    ),
  ]);
  res.json({ success: true, data: rows[0], message: 'Funds disbursed and loan balance updated' });
});

// POST /loans/:loanId/disbursements/:id/cancel
router.post('/:id/cancel', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const existing = await query<{ status: string }>(
    'SELECT status FROM disbursements WHERE id = $1 AND loan_id = $2',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Disbursement not found' }); return; }
  if (existing[0].status === 'disbursed') {
    res.status(422).json({ success: false, error: 'Cannot cancel a disbursement that has already been sent' }); return;
  }
  const rows = await query(
    `UPDATE disbursements SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json({ success: true, data: rows[0], message: 'Disbursement cancelled' });
});

export default router;
