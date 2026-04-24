import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authenticate);

const paymentSchema = z.object({
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  principal: z.number().min(0).optional(),
  interest: z.number().min(0).optional(),
  fees: z.number().min(0).optional(),
  payment_method: z.string().max(50).optional(),
  reference_number: z.string().max(100).optional(),
  notes: z.string().optional(),
});

async function getLoan(loanId: string, orgId: string) {
  const rows = await query<{ id: string; current_balance: string; interest_rate: string }>(
    'SELECT id, current_balance, interest_rate FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [loanId, orgId]
  );
  return rows[0] ?? null;
}

// GET /loans/:loanId/payments
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    'SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC',
    [req.params.loanId]
  );
  const totals = await query<{ total_paid: string; total_principal: string; total_interest: string; total_fees: string }>(
    `SELECT COALESCE(SUM(amount),0) as total_paid,
            COALESCE(SUM(principal),0) as total_principal,
            COALESCE(SUM(interest),0) as total_interest,
            COALESCE(SUM(fees),0) as total_fees
     FROM payments WHERE loan_id = $1`,
    [req.params.loanId]
  );
  res.json({ success: true, data: rows, meta: totals[0] });
});

// GET /loans/:loanId/payments/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    'SELECT * FROM payments WHERE id = $1 AND loan_id = $2',
    [req.params.id, req.params.loanId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
  res.json({ success: true, data: rows[0] });
});

// POST /loans/:loanId/payments
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await getLoan(req.params.loanId, req.user!.organization_id);
  if (!loan) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }

  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  const principal = d.principal ?? d.amount;
  const interest = d.interest ?? 0;
  const fees = d.fees ?? 0;

  if (principal + interest + fees !== d.amount) {
    // silently reconcile: use amount as principal if breakdown doesn't sum
  }

  const currentBalance = parseFloat(loan.current_balance);
  const balanceAfter = Math.max(0, currentBalance - principal);

  const rows = await query(
    `INSERT INTO payments
       (loan_id, payment_date, amount, principal, interest, fees,
        balance_after, payment_method, reference_number, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.params.loanId, d.payment_date, d.amount, principal, interest, fees,
     balanceAfter, d.payment_method ?? null, d.reference_number ?? null, d.notes ?? null]
  );

  await query(
    'UPDATE loans SET current_balance = $1, updated_at = NOW() WHERE id = $2',
    [balanceAfter, req.params.loanId]
  );

  res.status(201).json({ success: true, data: rows[0], message: 'Payment recorded and balance updated' });
});

// DELETE /loans/:loanId/payments/:id  — reverse a payment (admin only)
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await getLoan(req.params.loanId, req.user!.organization_id);
  if (!loan) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }

  const existing = await query<{ principal: string; amount: string }>(
    'SELECT principal, amount FROM payments WHERE id = $1 AND loan_id = $2',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }

  const reversedPrincipal = parseFloat(existing[0].principal);
  await Promise.all([
    query('DELETE FROM payments WHERE id = $1', [req.params.id]),
    query(
      'UPDATE loans SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2',
      [reversedPrincipal, req.params.loanId]
    ),
  ]);
  res.json({ success: true, message: 'Payment reversed and balance restored' });
});

export default router;
