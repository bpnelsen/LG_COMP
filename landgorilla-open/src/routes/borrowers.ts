import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { ApiResponse, Borrower } from '../types';

const router = Router();
router.use(authenticate);

const borrowerSchema = z.object({
  entity_type: z.enum(['individual', 'llc', 'corporation', 'partnership', 'trust']),
  legal_name: z.string().min(1).max(255),
  dba_name: z.string().max(255).optional(),
  tax_id: z.string().max(50).optional(),
  credit_score: z.number().int().min(300).max(850).optional(),
  annual_revenue: z.number().min(0).optional(),
  net_worth: z.number().optional(),
  total_debt: z.number().min(0).optional(),
  years_in_business: z.number().int().min(0).optional(),
  industry: z.string().max(100).optional(),
  naics_code: z.string().max(10).optional(),
  notes: z.string().optional(),
});

// GET /borrowers
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1');
  const perPage = Math.min(parseInt((req.query.per_page as string) || '25'), 100);
  const offset = (page - 1) * perPage;
  const search = req.query.search as string | undefined;
  const entityType = req.query.entity_type as string | undefined;

  const conditions = ['organization_id = $1', 'is_active = true'];
  const params: unknown[] = [req.user!.organization_id];
  let idx = 2;

  if (search) {
    conditions.push(`legal_name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }
  if (entityType) {
    conditions.push(`entity_type = $${idx++}`);
    params.push(entityType);
  }

  const where = conditions.join(' AND ');
  const [rows, countRows] = await Promise.all([
    query<Borrower>(
      `SELECT * FROM borrowers WHERE ${where} ORDER BY legal_name ASC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, perPage, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM borrowers WHERE ${where}`, params),
  ]);

  const total = parseInt(countRows[0]?.count || '0');
  res.json({
    success: true,
    data: rows,
    pagination: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
  });
});

// GET /borrowers/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query<Borrower>(
    'SELECT * FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Borrower not found' }); return; }

  const contacts = await query(
    'SELECT * FROM contacts WHERE borrower_id = $1 ORDER BY is_primary DESC, last_name',
    [req.params.id]
  );
  const loans = await query(
    `SELECT id, loan_number, status, loan_type, committed_amount, current_balance, origination_date, maturity_date
     FROM loans WHERE borrower_id = $1 AND organization_id = $2 AND is_active = true ORDER BY created_at DESC`,
    [req.params.id, req.user!.organization_id]
  );

  res.json({ success: true, data: { ...rows[0], contacts, loans } });
});

// POST /borrowers
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = borrowerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors });
    return;
  }
  const d = parsed.data;
  const rows = await query<Borrower>(
    `INSERT INTO borrowers
       (organization_id, entity_type, legal_name, dba_name, tax_id, credit_score,
        annual_revenue, net_worth, total_debt, years_in_business, industry, naics_code, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [req.user!.organization_id, d.entity_type, d.legal_name, d.dba_name ?? null,
     d.tax_id ?? null, d.credit_score ?? null, d.annual_revenue ?? null, d.net_worth ?? null,
     d.total_debt ?? null, d.years_in_business ?? null, d.industry ?? null, d.naics_code ?? null,
     d.notes ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Borrower created' });
});

// PUT /borrowers/:id
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = borrowerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors });
    return;
  }
  const existing = await query(
    'SELECT id FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Borrower not found' }); return; }

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) { setClauses.push(`${k} = $${idx++}`); params.push(v); }
  }
  if (!setClauses.length) { res.status(400).json({ success: false, error: 'No fields to update' }); return; }
  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.id, req.user!.organization_id);

  const rows = await query<Borrower>(
    `UPDATE borrowers SET ${setClauses.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++} RETURNING *`,
    params
  );
  res.json({ success: true, data: rows[0], message: 'Borrower updated' });
});

// DELETE /borrowers/:id
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query(
    'SELECT id FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Borrower not found' }); return; }
  await query('UPDATE borrowers SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Borrower deleted' });
});

// ── Contacts sub-resource ──────────────────────────────────────────────────

const contactSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  title: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  is_primary: z.boolean().optional(),
  contact_type: z.enum(['general', 'guarantor', 'authorized_signer', 'beneficial_owner']).optional(),
  ownership_pct: z.number().min(0).max(100).optional(),
});

// GET /borrowers/:id/contacts
router.get('/:id/contacts', async (req: AuthRequest, res: Response): Promise<void> => {
  const borrower = await query(
    'SELECT id FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!borrower[0]) { res.status(404).json({ success: false, error: 'Borrower not found' }); return; }

  const rows = await query(
    'SELECT * FROM contacts WHERE borrower_id = $1 ORDER BY is_primary DESC, last_name',
    [req.params.id]
  );
  res.json({ success: true, data: rows });
});

// POST /borrowers/:id/contacts
router.post('/:id/contacts', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const borrower = await query(
    'SELECT id FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!borrower[0]) { res.status(404).json({ success: false, error: 'Borrower not found' }); return; }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors });
    return;
  }
  const d = parsed.data;

  if (d.is_primary) {
    await query('UPDATE contacts SET is_primary = false WHERE borrower_id = $1', [req.params.id]);
  }

  const rows = await query(
    `INSERT INTO contacts (borrower_id, first_name, last_name, title, email, phone, is_primary, contact_type, ownership_pct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.params.id, d.first_name, d.last_name, d.title ?? null, d.email ?? null,
     d.phone ?? null, d.is_primary ?? false, d.contact_type ?? 'general', d.ownership_pct ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Contact created' });
});

// PUT /borrowers/:borrowerId/contacts/:contactId
router.put('/:id/contacts/:contactId', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const contact = await query(
    `SELECT c.id FROM contacts c
     JOIN borrowers b ON c.borrower_id = b.id
     WHERE c.id = $1 AND c.borrower_id = $2 AND b.organization_id = $3`,
    [req.params.contactId, req.params.id, req.user!.organization_id]
  );
  if (!contact[0]) { res.status(404).json({ success: false, error: 'Contact not found' }); return; }

  const parsed = contactSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors });
    return;
  }
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) { setClauses.push(`${k} = $${idx++}`); params.push(v); }
  }
  if (!setClauses.length) { res.status(400).json({ success: false, error: 'No fields to update' }); return; }

  if (parsed.data.is_primary) {
    await query('UPDATE contacts SET is_primary = false WHERE borrower_id = $1', [req.params.id]);
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.contactId);
  const rows = await query(`UPDATE contacts SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`, params);
  res.json({ success: true, data: rows[0], message: 'Contact updated' });
});

// DELETE /borrowers/:id/contacts/:contactId
router.delete('/:id/contacts/:contactId', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const contact = await query(
    `SELECT c.id FROM contacts c
     JOIN borrowers b ON c.borrower_id = b.id
     WHERE c.id = $1 AND c.borrower_id = $2 AND b.organization_id = $3`,
    [req.params.contactId, req.params.id, req.user!.organization_id]
  );
  if (!contact[0]) { res.status(404).json({ success: false, error: 'Contact not found' }); return; }
  await query('DELETE FROM contacts WHERE id = $1', [req.params.contactId]);
  res.json({ success: true, message: 'Contact deleted' });
});

export default router;
