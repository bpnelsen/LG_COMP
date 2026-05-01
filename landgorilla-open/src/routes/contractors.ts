import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Contractor } from '../types';

const router = Router();
router.use(authenticate);

const CONTRACTOR_TYPES = [
  'general','electrical','plumbing','framing','roofing',
  'hvac','concrete','masonry','painting','landscaping','other',
] as const;

const createSchema = z.object({
  company_name:          z.string().min(1).max(255),
  dba_name:              z.string().max(255).optional(),
  contractor_type:       z.enum(CONTRACTOR_TYPES),
  license_number:        z.string().max(100).optional(),
  license_state:         z.string().max(50).optional(),
  license_expiry:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insurance_carrier:     z.string().max(255).optional(),
  insurance_policy:      z.string().max(100).optional(),
  insurance_expiry:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insurance_amount:      z.number().min(0).optional(),
  bond_carrier:          z.string().max(255).optional(),
  bond_number:           z.string().max(100).optional(),
  bond_amount:           z.number().min(0).optional(),
  bond_expiry:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tax_id:                z.string().max(50).optional(),
  address_line1:         z.string().max(255).optional(),
  address_line2:         z.string().max(255).optional(),
  city:                  z.string().max(100).optional(),
  state:                 z.string().max(50).optional(),
  zip_code:              z.string().max(20).optional(),
  primary_contact_name:  z.string().max(200).optional(),
  primary_contact_email: z.string().email().optional(),
  primary_contact_phone: z.string().max(30).optional(),
  notes:                 z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(['active','inactive','suspended','pending_review']).optional(),
});

// GET /contractors
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const page    = parseInt((req.query.page    as string) || '1');
  const perPage = Math.min(parseInt((req.query.per_page as string) || '25'), 100);
  const offset  = (page - 1) * perPage;
  const search           = req.query.search            as string | undefined;
  const contractorType   = req.query.contractor_type   as string | undefined;
  const status           = req.query.status            as string | undefined;
  const approvedOnly     = req.query.approved_only     === 'true';

  const conditions: string[] = ['organization_id = $1', 'is_active = true'];
  const params: unknown[]    = [req.user!.organization_id];
  let idx = 2;

  if (search) {
    conditions.push(`(company_name ILIKE $${idx} OR primary_contact_name ILIKE $${idx})`);
    params.push(`%${search}%`); idx++;
  }
  if (contractorType) { conditions.push(`contractor_type = $${idx++}`); params.push(contractorType); }
  if (status)         { conditions.push(`status = $${idx++}`);          params.push(status); }
  if (approvedOnly)   { conditions.push(`is_approved_vendor = true`); }

  const where = conditions.join(' AND ');
  const [rows, countRows] = await Promise.all([
    query<Contractor>(
      `SELECT * FROM contractors WHERE ${where} ORDER BY company_name ASC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, perPage, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM contractors WHERE ${where}`, params),
  ]);

  const total = parseInt(countRows[0]?.count || '0');
  res.json({
    success: true,
    data: rows,
    pagination: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
  });
});

// GET /contractors/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query<Contractor>(
    'SELECT * FROM contractors WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Contractor not found' }); return; }
  res.json({ success: true, data: rows[0] });
});

// POST /contractors
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;
  const rows = await query<Contractor>(
    `INSERT INTO contractors (
       organization_id, company_name, dba_name, contractor_type,
       license_number, license_state, license_expiry,
       insurance_carrier, insurance_policy, insurance_expiry, insurance_amount,
       bond_carrier, bond_number, bond_amount, bond_expiry,
       tax_id, address_line1, address_line2, city, state, zip_code,
       primary_contact_name, primary_contact_email, primary_contact_phone, notes
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
     ) RETURNING *`,
    [
      req.user!.organization_id, d.company_name, d.dba_name ?? null, d.contractor_type,
      d.license_number ?? null, d.license_state ?? null, d.license_expiry ?? null,
      d.insurance_carrier ?? null, d.insurance_policy ?? null, d.insurance_expiry ?? null, d.insurance_amount ?? null,
      d.bond_carrier ?? null, d.bond_number ?? null, d.bond_amount ?? null, d.bond_expiry ?? null,
      d.tax_id ?? null, d.address_line1 ?? null, d.address_line2 ?? null,
      d.city ?? null, d.state ?? null, d.zip_code ?? null,
      d.primary_contact_name ?? null, d.primary_contact_email ?? null, d.primary_contact_phone ?? null,
      d.notes ?? null,
    ]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Contractor created' });
});

// PUT /contractors/:id
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query<Contractor>(
    'SELECT id FROM contractors WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Contractor not found' }); return; }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: unknown[]    = [];
  let idx = 1;

  const fields: Array<[string, unknown]> = [
    ['company_name',          d.company_name],
    ['dba_name',              d.dba_name],
    ['contractor_type',       d.contractor_type],
    ['license_number',        d.license_number],
    ['license_state',         d.license_state],
    ['license_expiry',        d.license_expiry],
    ['insurance_carrier',     d.insurance_carrier],
    ['insurance_policy',      d.insurance_policy],
    ['insurance_expiry',      d.insurance_expiry],
    ['insurance_amount',      d.insurance_amount],
    ['bond_carrier',          d.bond_carrier],
    ['bond_number',           d.bond_number],
    ['bond_amount',           d.bond_amount],
    ['bond_expiry',           d.bond_expiry],
    ['tax_id',                d.tax_id],
    ['address_line1',         d.address_line1],
    ['address_line2',         d.address_line2],
    ['city',                  d.city],
    ['state',                 d.state],
    ['zip_code',              d.zip_code],
    ['primary_contact_name',  d.primary_contact_name],
    ['primary_contact_email', d.primary_contact_email],
    ['primary_contact_phone', d.primary_contact_phone],
    ['status',                d.status],
    ['notes',                 d.notes],
  ];

  for (const [col, val] of fields) {
    if (val !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(val);
    }
  }

  params.push(req.params.id);
  const rows = await query<Contractor>(
    `UPDATE contractors SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  res.json({ success: true, data: rows[0], message: 'Contractor updated' });
});

// DELETE /contractors/:id  (soft delete)
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query<Contractor>(
    `UPDATE contractors SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND is_active = true RETURNING id`,
    [req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Contractor not found' }); return; }
  res.json({ success: true, message: 'Contractor deactivated' });
});

// POST /contractors/:id/approve  — mark as approved vendor
router.post('/:id/approve', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query<Contractor>(
    `UPDATE contractors
     SET is_approved_vendor = true, status = 'active',
         approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND organization_id = $3 AND is_active = true RETURNING *`,
    [req.user!.user_id, req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Contractor not found' }); return; }
  res.json({ success: true, data: rows[0], message: 'Contractor approved as vendor' });
});

// POST /contractors/:id/suspend
router.post('/:id/suspend', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query<Contractor>(
    `UPDATE contractors
     SET status = 'suspended', is_approved_vendor = false, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND is_active = true RETURNING *`,
    [req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Contractor not found' }); return; }
  res.json({ success: true, data: rows[0], message: 'Contractor suspended' });
});

export default router;
