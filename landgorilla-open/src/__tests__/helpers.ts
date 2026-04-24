import request from 'supertest';
import app from '../index';
import pool from '../db';

export const TEST_ORG_ID = '00000000-0000-0000-0000-000000000099';
export const ADMIN_EMAIL = 'admin@test.loanscope.io';
export const ADMIN_PASSWORD = 'Admin1234!';
export const VIEWER_EMAIL = 'viewer@test.loanscope.io';
export const VIEWER_PASSWORD = 'Viewer1234!';

export async function truncateTables(): Promise<void> {
  await pool.query(`
    TRUNCATE TABLE
      audit_logs, notifications, tasks, report_runs, report_definitions,
      portfolio_snapshots, insurance_policies, valuations, payments,
      disbursements, covenant_exceptions, covenants, loan_documents,
      loans, properties, contacts, borrowers, users, organizations
    RESTART IDENTITY CASCADE
  `);
}

export async function seedOrg(): Promise<string> {
  const rows = await pool.query<{ id: string }>(
    `INSERT INTO organizations (id, name, type)
     VALUES ($1, 'Test Org', 'private_lender')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [TEST_ORG_ID]
  );
  return rows.rows[0].id;
}

export async function seedUser(
  orgId: string,
  email: string,
  password: string,
  role: string = 'admin'
): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash(password, 4);
  const rows = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, 'Test', 'User', $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
     RETURNING id`,
    [orgId, email, hash, role]
  );
  return rows.rows[0].id;
}

export async function getToken(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data?.token as string;
}

export async function seedBorrower(orgId: string): Promise<string> {
  const rows = await pool.query<{ id: string }>(
    `INSERT INTO borrowers (organization_id, legal_name, entity_type)
     VALUES ($1, 'ACME Corp', 'corporation')
     RETURNING id`,
    [orgId]
  );
  return rows.rows[0].id;
}

export async function seedProperty(orgId: string, borrowerId?: string): Promise<string> {
  const bId = borrowerId ?? (await seedBorrower(orgId));
  const rows = await pool.query<{ id: string }>(
    `INSERT INTO properties (organization_id, borrower_id, address_line1, city, state, zip_code, property_type)
     VALUES ($1, $2, '123 Main St', 'Springfield', 'IL', '62701', 'commercial')
     RETURNING id`,
    [orgId, bId]
  );
  return rows.rows[0].id;
}

export async function seedLoan(
  orgId: string,
  borrowerId: string,
  propertyId: string | null = null,
  opts?: { status?: string; committed_amount?: number; loanNumber?: string }
): Promise<string> {
  const loanNumber = opts?.loanNumber ?? `LN-${Date.now()}`;
  const rows = await pool.query<{ id: string }>(
    `INSERT INTO loans (
       organization_id, borrower_id, property_id, loan_number, loan_type, status,
       committed_amount, current_balance, interest_rate, origination_date
     ) VALUES ($1, $2, $3, $4, 'construction', $5, $6, 0, 6.5, NOW())
     RETURNING id`,
    [orgId, borrowerId, propertyId, loanNumber, opts?.status ?? 'performing', opts?.committed_amount ?? 500000]
  );
  return rows.rows[0].id;
}
