import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Property } from '../types';

const router = Router();
router.use(authenticate);

const propertySchema = z.object({
  borrower_id: z.string().uuid(),
  property_type: z.enum(['residential', 'commercial', 'industrial', 'land', 'mixed_use']),
  address_line1: z.string().min(1).max(255),
  address_line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zip_code: z.string().min(1).max(20),
  country: z.string().max(50).optional(),
  parcel_number: z.string().max(100).optional(),
  square_footage: z.number().min(0).optional(),
  lot_size: z.number().min(0).optional(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  units: z.number().int().min(1).optional(),
  zoning: z.string().max(100).optional(),
  occupancy_rate: z.number().min(0).max(100).optional(),
  noi: z.number().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// GET /properties
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1');
  const perPage = Math.min(parseInt((req.query.per_page as string) || '25'), 100);
  const offset = (page - 1) * perPage;
  const search = req.query.search as string | undefined;
  const propertyType = req.query.property_type as string | undefined;
  const state = req.query.state as string | undefined;
  const borrowerId = req.query.borrower_id as string | undefined;

  const conditions = ['p.organization_id = $1', 'p.is_active = true'];
  const params: unknown[] = [req.user!.organization_id];
  let idx = 2;

  if (search) { conditions.push(`(p.address_line1 ILIKE $${idx++} OR p.city ILIKE $${idx - 1})`); params.push(`%${search}%`); }
  if (propertyType) { conditions.push(`p.property_type = $${idx++}`); params.push(propertyType); }
  if (state) { conditions.push(`p.state = $${idx++}`); params.push(state); }
  if (borrowerId) { conditions.push(`p.borrower_id = $${idx++}`); params.push(borrowerId); }

  const where = conditions.join(' AND ');
  const [rows, countRows] = await Promise.all([
    query<Property>(
      `SELECT p.*, b.legal_name as borrower_name,
              (SELECT COUNT(*) FROM loans l WHERE l.property_id = p.id AND l.is_active = true) as loan_count
       FROM properties p
       LEFT JOIN borrowers b ON p.borrower_id = b.id
       WHERE ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, perPage, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM properties p WHERE ${where}`, params),
  ]);

  const total = parseInt(countRows[0]?.count || '0');
  res.json({
    success: true,
    data: rows,
    pagination: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
  });
});

// GET /properties/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query<Property>(
    `SELECT p.*, b.legal_name as borrower_name
     FROM properties p
     LEFT JOIN borrowers b ON p.borrower_id = b.id
     WHERE p.id = $1 AND p.organization_id = $2 AND p.is_active = true`,
    [req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Property not found' }); return; }

  const [valuations, loans] = await Promise.all([
    query(
      'SELECT * FROM valuations WHERE property_id = $1 ORDER BY valuation_date DESC',
      [req.params.id]
    ),
    query(
      `SELECT id, loan_number, status, loan_type, committed_amount, current_balance, origination_date, maturity_date
       FROM loans WHERE property_id = $1 AND organization_id = $2 AND is_active = true ORDER BY created_at DESC`,
      [req.params.id, req.user!.organization_id]
    ),
  ]);

  res.json({ success: true, data: { ...rows[0], valuations, loans } });
});

// POST /properties
router.post('/', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = propertySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors });
    return;
  }
  const d = parsed.data;

  const borrower = await query(
    'SELECT id FROM borrowers WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [d.borrower_id, req.user!.organization_id]
  );
  if (!borrower[0]) { res.status(404).json({ success: false, error: 'Borrower not found' }); return; }

  const rows = await query<Property>(
    `INSERT INTO properties
       (organization_id, borrower_id, property_type, address_line1, address_line2, city, state,
        zip_code, country, parcel_number, square_footage, lot_size, year_built, units, zoning,
        occupancy_rate, noi, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [req.user!.organization_id, d.borrower_id, d.property_type, d.address_line1,
     d.address_line2 ?? null, d.city, d.state, d.zip_code, d.country ?? 'US',
     d.parcel_number ?? null, d.square_footage ?? null, d.lot_size ?? null,
     d.year_built ?? null, d.units ?? null, d.zoning ?? null, d.occupancy_rate ?? null,
     d.noi ?? null, d.latitude ?? null, d.longitude ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Property created' });
});

// PUT /properties/:id
router.put('/:id', requireRole('admin', 'loan_officer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query(
    'SELECT id FROM properties WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Property not found' }); return; }

  const parsed = propertySchema.omit({ borrower_id: true }).partial().safeParse(req.body);
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
  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.id, req.user!.organization_id);

  const rows = await query<Property>(
    `UPDATE properties SET ${setClauses.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++} RETURNING *`,
    params
  );
  res.json({ success: true, data: rows[0], message: 'Property updated' });
});

// DELETE /properties/:id
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query(
    'SELECT id FROM properties WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Property not found' }); return; }
  await query('UPDATE properties SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Property deleted' });
});

// ── Valuations sub-resource ───────────────────────────────────────────────

const valuationSchema = z.object({
  loan_id: z.string().uuid().optional(),
  valuation_type: z.enum(['appraisal', 'bpo', 'avm', 'inspection', 'tax_assessed']),
  appraiser_name: z.string().max(255).optional(),
  appraiser_license: z.string().max(100).optional(),
  value: z.number().positive(),
  valuation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  report_url: z.string().url().optional(),
  notes: z.string().optional(),
});

// GET /properties/:id/valuations
router.get('/:id/valuations', async (req: AuthRequest, res: Response): Promise<void> => {
  const prop = await query(
    'SELECT id FROM properties WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!prop[0]) { res.status(404).json({ success: false, error: 'Property not found' }); return; }
  const rows = await query(
    'SELECT * FROM valuations WHERE property_id = $1 ORDER BY valuation_date DESC',
    [req.params.id]
  );
  res.json({ success: true, data: rows });
});

// POST /properties/:id/valuations
router.post('/:id/valuations', requireRole('admin', 'loan_officer', 'analyst'), async (req: AuthRequest, res: Response): Promise<void> => {
  const prop = await query(
    'SELECT id FROM properties WHERE id = $1 AND organization_id = $2 AND is_active = true',
    [req.params.id, req.user!.organization_id]
  );
  if (!prop[0]) { res.status(404).json({ success: false, error: 'Property not found' }); return; }

  const parsed = valuationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors });
    return;
  }
  const d = parsed.data;
  const rows = await query(
    `INSERT INTO valuations
       (property_id, loan_id, valuation_type, appraiser_name, appraiser_license,
        value, valuation_date, effective_date, report_url, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.params.id, d.loan_id ?? null, d.valuation_type, d.appraiser_name ?? null,
     d.appraiser_license ?? null, d.value, d.valuation_date, d.effective_date ?? null,
     d.report_url ?? null, d.notes ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Valuation recorded' });
});

export default router;
