import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authenticate);

const assignSchema = z.object({
  contractor_id:            z.string().uuid(),
  role:                     z.enum(['general_contractor','sub_contractor','architect','engineer','inspector']),
  contract_amount:          z.number().positive().optional(),
  scope_of_work:            z.string().optional(),
  start_date:               z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expected_completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateSchema = assignSchema.omit({ contractor_id: true, role: true }).extend({
  actual_completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active','completed','terminated']).optional(),
});

async function getLoan(loanId: string, orgId: string) {
  const rows = await query<{ id: string }>(
    'SELECT id FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [loanId, orgId]
  );
  return rows[0] ?? null;
}

// GET /loans/:loanId/contractors
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    `SELECT lc.*,
            c.company_name, c.dba_name, c.contractor_type, c.status as contractor_status,
            c.is_approved_vendor, c.primary_contact_name, c.primary_contact_email,
            c.primary_contact_phone, c.license_number, c.license_expiry,
            c.insurance_expiry, c.bond_expiry
     FROM loan_contractors lc
     JOIN contractors c ON lc.contractor_id = c.id
     WHERE lc.loan_id = $1
     ORDER BY lc.created_at ASC`,
    [req.params.loanId]
  );
  res.json({ success: true, data: rows });
});

// GET /loans/:loanId/contractors/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    `SELECT lc.*,
            c.company_name, c.dba_name, c.contractor_type, c.status as contractor_status,
            c.is_approved_vendor, c.primary_contact_name, c.primary_contact_email,
            c.primary_contact_phone, c.license_number, c.license_state,
            c.license_expiry, c.insurance_carrier, c.insurance_expiry, c.insurance_amount,
            c.bond_carrier, c.bond_expiry, c.address_line1, c.city, c.state, c.zip_code
     FROM loan_contractors lc
     JOIN contractors c ON lc.contractor_id = c.id
     WHERE lc.id = $1 AND lc.loan_id = $2`,
    [req.params.id, req.params.loanId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Loan contractor not found' }); return; }
  res.json({ success: true, data: rows[0] });
});

// POST /loans/:loanId/contractors  — assign contractor to loan
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }

  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  // Verify contractor belongs to this org
  const contractor = await query<{ id: string; is_approved_vendor: boolean; status: string }>(
    'SELECT id, is_approved_vendor, status FROM contractors WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [d.contractor_id, req.user!.organization_id]
  );
  if (!contractor[0]) {
    res.status(404).json({ success: false, error: 'Contractor not found in your organization' }); return;
  }

  try {
    const rows = await query(
      `INSERT INTO loan_contractors (
         loan_id, contractor_id, role, contract_amount, scope_of_work,
         start_date, expected_completion_date
       ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.params.loanId, d.contractor_id, d.role,
        d.contract_amount ?? null, d.scope_of_work ?? null,
        d.start_date ?? null, d.expected_completion_date ?? null,
      ]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Contractor assigned to loan' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, error: 'Contractor already assigned with this role on the loan' }); return;
    }
    throw err;
  }
});

// PUT /loans/:loanId/contractors/:id
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }

  const existing = await query<{ id: string }>(
    'SELECT id FROM loan_contractors WHERE id = $1 AND loan_id = $2',
    [req.params.id, req.params.loanId]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Loan contractor not found' }); return; }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: unknown[]    = [];
  let idx = 1;

  const fields: Array<[string, unknown]> = [
    ['contract_amount',          d.contract_amount],
    ['scope_of_work',            d.scope_of_work],
    ['start_date',               d.start_date],
    ['expected_completion_date', d.expected_completion_date],
    ['actual_completion_date',   d.actual_completion_date],
    ['status',                   d.status],
  ];
  for (const [col, val] of fields) {
    if (val !== undefined) { setClauses.push(`${col} = $${idx++}`); params.push(val); }
  }

  params.push(req.params.id);
  const rows = await query(
    `UPDATE loan_contractors SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  res.json({ success: true, data: rows[0], message: 'Loan contractor updated' });
});

// DELETE /loans/:loanId/contractors/:id  — remove assignment
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!await getLoan(req.params.loanId, req.user!.organization_id)) {
    res.status(404).json({ success: false, error: 'Loan not found' }); return;
  }
  const rows = await query(
    'DELETE FROM loan_contractors WHERE id = $1 AND loan_id = $2 RETURNING id',
    [req.params.id, req.params.loanId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Loan contractor not found' }); return; }
  res.json({ success: true, message: 'Contractor removed from loan' });
});

export default router;
