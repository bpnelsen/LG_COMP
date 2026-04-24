import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { ApiResponse, Loan, LoanFilters } from '../types';

const router = Router();

router.use(authenticate);

const createLoanSchema = z.object({
  loan_number: z.string().min(1).max(50),
  borrower_id: z.string().uuid(),
  property_id: z.string().uuid(),
  loan_type: z.enum(['construction', 'bridge', 'permanent', 'mezzanine', 'equity']),
  committed_amount: z.number().positive(),
  interest_rate: z.number().min(0).max(100),
  rate_type: z.enum(['fixed', 'variable']),
  origination_date: z.string().datetime({ offset: true }).optional(),
  maturity_date: z.string().datetime({ offset: true }).optional(),
  ltv_ratio: z.number().min(0).max(200).optional(),
  dscr: z.number().min(0).optional(),
});

const updateLoanSchema = createLoanSchema.partial().extend({
  status: z.enum(['application','underwriting','approved','funded','performing','watchlist','default','foreclosure','paid_off','charged_off']).optional(),
  current_balance: z.number().min(0).optional(),
});

// GET /loans
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const filters: LoanFilters = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    per_page: req.query.per_page ? Math.min(parseInt(req.query.per_page as string), 100) : 25,
    sort_by: (req.query.sort_by as string) || 'created_at',
    sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'DESC',
    status: req.query.status as LoanFilters['status'],
    loan_type: req.query.loan_type as string,
    borrower_id: req.query.borrower_id as string,
  };

  const offset = ((filters.page ?? 1) - 1) * (filters.per_page ?? 25);
  const conditions: string[] = ['l.organization_id = $1', 'l.is_active = true'];
  const params: unknown[] = [req.user!.organization_id];
  let idx = 2;

  if (filters.status) { conditions.push(`l.status = $${idx++}`); params.push(filters.status); }
  if (filters.loan_type) { conditions.push(`l.loan_type = $${idx++}`); params.push(filters.loan_type); }
  if (filters.borrower_id) { conditions.push(`l.borrower_id = $${idx++}`); params.push(filters.borrower_id); }

  const where = conditions.join(' AND ');
  const allowedSortCols = ['created_at', 'loan_number', 'current_balance', 'origination_date', 'maturity_date', 'interest_rate'];
  const sortCol = allowedSortCols.includes(filters.sort_by ?? '') ? filters.sort_by : 'created_at';
  const sortDir = filters.sort_order === 'ASC' ? 'ASC' : 'DESC';

  const [loans, countResult] = await Promise.all([
    query<Loan>(
      `SELECT l.*, b.legal_name as borrower_name, p.address_line1 as property_address
       FROM loans l
       LEFT JOIN borrowers b ON l.borrower_id = b.id
       LEFT JOIN properties p ON l.property_id = p.id
       WHERE ${where}
       ORDER BY l.${sortCol} ${sortDir}
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.per_page, offset]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM loans l WHERE ${where}`,
      params
    ),
  ]);

  const total = parseInt(countResult[0]?.count || '0');
  const response: ApiResponse<Loan[]> = {
    success: true,
    data: loans,
    pagination: {
      total,
      page: filters.page ?? 1,
      per_page: filters.per_page ?? 25,
      total_pages: Math.ceil(total / (filters.per_page ?? 25)),
    },
  };
  res.json(response);
});

// GET /loans/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const loans = await query<Loan>(
    `SELECT l.*, b.legal_name as borrower_name, p.address_line1 as property_address
     FROM loans l
     LEFT JOIN borrowers b ON l.borrower_id = b.id
     LEFT JOIN properties p ON l.property_id = p.id
     WHERE l.id = $1 AND l.organization_id = $2 AND l.is_active = true`,
    [req.params.id, req.user!.organization_id]
  );

  if (loans.length === 0) {
    const response: ApiResponse = { success: false, error: 'Loan not found' };
    res.status(404).json(response);
    return;
  }

  const covenants = await query(
    'SELECT * FROM covenants WHERE loan_id = $1 AND is_active = true ORDER BY next_due_date',
    [req.params.id]
  );

  const disbursements = await query(
    'SELECT * FROM disbursements WHERE loan_id = $1 ORDER BY disbursement_date DESC',
    [req.params.id]
  );

  const response: ApiResponse = {
    success: true,
    data: { ...loans[0], covenants, disbursements },
  };
  res.json(response);
});

// POST /loans
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createLoanSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: ApiResponse = { success: false, error: 'Validation failed', data: parsed.error.errors };
    res.status(400).json(response);
    return;
  }

  const d = parsed.data;

  const borrowerExists = await query(
    'SELECT id FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [d.borrower_id, req.user!.organization_id]
  );
  if (borrowerExists.length === 0) {
    const response: ApiResponse = { success: false, error: 'Borrower not found' };
    res.status(404).json(response);
    return;
  }

  const newLoans = await query<Loan>(
    `INSERT INTO loans
       (organization_id, loan_number, borrower_id, property_id, loan_officer_id,
        loan_type, committed_amount, current_balance, original_balance,
        interest_rate, rate_type, origination_date, maturity_date, ltv_ratio, dscr)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      req.user!.organization_id,
      d.loan_number,
      d.borrower_id,
      d.property_id,
      req.user!.user_id,
      d.loan_type,
      d.committed_amount,
      d.interest_rate,
      d.rate_type,
      d.origination_date || null,
      d.maturity_date || null,
      d.ltv_ratio || null,
      d.dscr || null,
    ]
  );

  const response: ApiResponse<Loan> = {
    success: true,
    data: newLoans[0],
    message: 'Loan created successfully',
  };
  res.status(201).json(response);
});

// PUT /loans/:id
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateLoanSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: ApiResponse = { success: false, error: 'Validation failed', data: parsed.error.errors };
    res.status(400).json(response);
    return;
  }

  const existing = await query(
    'SELECT id FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (existing.length === 0) {
    const response: ApiResponse = { success: false, error: 'Loan not found' };
    res.status(404).json(response);
    return;
  }

  const updates = parsed.data;
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      params.push(val);
    }
  }

  if (setClauses.length === 0) {
    const response: ApiResponse = { success: false, error: 'No fields to update' };
    res.status(400).json(response);
    return;
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.id, req.user!.organization_id);

  const updated = await query<Loan>(
    `UPDATE loans SET ${setClauses.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++} RETURNING *`,
    params
  );

  const response: ApiResponse<Loan> = { success: true, data: updated[0], message: 'Loan updated' };
  res.json(response);
});

// DELETE /loans/:id
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query(
    'SELECT id FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (existing.length === 0) {
    const response: ApiResponse = { success: false, error: 'Loan not found' };
    res.status(404).json(response);
    return;
  }

  await query(
    'UPDATE loans SET is_active = false, updated_at = NOW() WHERE id = $1',
    [req.params.id]
  );

  const response: ApiResponse = { success: true, message: 'Loan deleted' };
  res.json(response);
});

export default router;
