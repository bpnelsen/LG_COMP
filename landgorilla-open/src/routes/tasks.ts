import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const taskSchema = z.object({
  loan_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  task_type: z.string().max(50).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateSchema = taskSchema.partial().extend({
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
});

// GET /tasks
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt((req.query.page as string) || '1');
  const perPage = Math.min(parseInt((req.query.per_page as string) || '25'), 100);
  const offset = (page - 1) * perPage;

  const conditions = ['t.organization_id = $1'];
  const params: unknown[] = [req.user!.organization_id];
  let idx = 2;

  if (req.query.status) { conditions.push(`t.status = $${idx++}`); params.push(req.query.status); }
  if (req.query.priority) { conditions.push(`t.priority = $${idx++}`); params.push(req.query.priority); }
  if (req.query.loan_id) { conditions.push(`t.loan_id = $${idx++}`); params.push(req.query.loan_id); }
  if (req.query.assigned_to) { conditions.push(`t.assigned_to = $${idx++}`); params.push(req.query.assigned_to); }
  if (req.query.mine === 'true') { conditions.push(`t.assigned_to = $${idx++}`); params.push(req.user!.user_id); }

  const where = conditions.join(' AND ');
  const [rows, countRows] = await Promise.all([
    query(
      `SELECT t.*,
              l.loan_number,
              u1.first_name || ' ' || u1.last_name as assigned_to_name,
              u2.first_name || ' ' || u2.last_name as created_by_name
       FROM tasks t
       LEFT JOIN loans l ON t.loan_id = l.id
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE ${where}
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         t.due_date NULLS LAST
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, perPage, offset]
    ),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM tasks t WHERE ${where}`, params),
  ]);

  const total = parseInt(countRows[0]?.count || '0');
  res.json({
    success: true,
    data: rows,
    pagination: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
  });
});

// GET /tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await query(
    `SELECT t.*, l.loan_number,
            u1.first_name || ' ' || u1.last_name as assigned_to_name,
            u2.first_name || ' ' || u2.last_name as created_by_name
     FROM tasks t
     LEFT JOIN loans l ON t.loan_id = l.id
     LEFT JOIN users u1 ON t.assigned_to = u1.id
     LEFT JOIN users u2 ON t.created_by = u2.id
     WHERE t.id = $1 AND t.organization_id = $2`,
    [req.params.id, req.user!.organization_id]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: 'Task not found' }); return; }
  res.json({ success: true, data: rows[0] });
});

// POST /tasks
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Validation failed', data: parsed.error.errors }); return;
  }
  const d = parsed.data;

  if (d.loan_id) {
    const loan = await query(
      'SELECT id FROM loans WHERE id = $1 AND organization_id = $2 AND is_active = true',
      [d.loan_id, req.user!.organization_id]
    );
    if (!loan[0]) { res.status(404).json({ success: false, error: 'Loan not found' }); return; }
  }

  if (d.assigned_to) {
    const user = await query(
      'SELECT id FROM users WHERE id = $1 AND organization_id = $2 AND is_active = true',
      [d.assigned_to, req.user!.organization_id]
    );
    if (!user[0]) { res.status(404).json({ success: false, error: 'Assigned user not found' }); return; }
  }

  const rows = await query(
    `INSERT INTO tasks (organization_id, loan_id, assigned_to, created_by, title, description, task_type, priority, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user!.organization_id, d.loan_id ?? null, d.assigned_to ?? null, req.user!.user_id,
     d.title, d.description ?? null, d.task_type ?? 'general', d.priority, d.due_date ?? null]
  );
  res.status(201).json({ success: true, data: rows[0], message: 'Task created' });
});

// PUT /tasks/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query<{ created_by: string; assigned_to: string | null }>(
    'SELECT created_by, assigned_to FROM tasks WHERE id = $1 AND organization_id = $2',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

  const canEdit =
    req.user!.role === 'admin' ||
    existing[0].created_by === req.user!.user_id ||
    existing[0].assigned_to === req.user!.user_id;
  if (!canEdit) { res.status(403).json({ success: false, error: 'Insufficient permissions' }); return; }

  const parsed = updateSchema.safeParse(req.body);
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

  if (parsed.data.status === 'completed') {
    setClauses.push(`completed_at = NOW()`);
  }
  setClauses.push(`updated_at = NOW()`);
  params.push(req.params.id);
  const rows = await query(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`, params
  );
  res.json({ success: true, data: rows[0], message: 'Task updated' });
});

// DELETE /tasks/:id
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await query(
    'SELECT id FROM tasks WHERE id = $1 AND organization_id = $2',
    [req.params.id, req.user!.organization_id]
  );
  if (!existing[0]) { res.status(404).json({ success: false, error: 'Task not found' }); return; }
  await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Task deleted' });
});

export default router;
