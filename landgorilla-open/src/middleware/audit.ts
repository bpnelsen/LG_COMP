import { Response, NextFunction } from 'express';
import { query } from '../db';
import { AuthRequest } from './auth';
import logger from '../utils/logger';

const MUTABLE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const TABLE_MAP: Record<string, string> = {
  '/api/borrowers': 'borrowers',
  '/api/properties': 'properties',
  '/api/loans': 'loans',
  '/api/tasks': 'tasks',
};

function resolveTable(path: string): string | null {
  for (const [prefix, table] of Object.entries(TABLE_MAP)) {
    if (path.startsWith(prefix)) return table;
  }
  if (path.includes('/covenants')) return 'covenants';
  if (path.includes('/disbursements')) return 'disbursements';
  if (path.includes('/payments')) return 'payments';
  if (path.includes('/valuations')) return 'valuations';
  if (path.includes('/contacts')) return 'contacts';
  return null;
}

export function auditLog(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!MUTABLE_METHODS.has(req.method) || !req.user) { next(); return; }

  const tableName = resolveTable(req.path);
  if (!tableName) { next(); return; }

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode < 400 && req.user) {
      const b = body as { data?: { id?: string } };
      const recordId = b?.data?.id ?? null;
      const action = req.method === 'POST' ? 'INSERT'
        : req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE'
        : 'DELETE';

      query(
        `INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, new_values, ip_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          req.user!.organization_id,
          req.user!.user_id,
          action,
          tableName,
          recordId,
          req.method !== 'DELETE' ? JSON.stringify(req.body) : null,
          req.ip ?? null,
        ]
      ).catch((err) => logger.warn('Audit log write failed', { error: err.message }));
    }
    return originalJson(body);
  };

  next();
}
