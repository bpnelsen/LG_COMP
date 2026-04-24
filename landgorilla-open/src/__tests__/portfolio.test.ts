import request from 'supertest';
import app from '../index';
import pool from '../db';
import {
  truncateTables,
  seedOrg,
  seedUser,
  seedBorrower,
  seedProperty,
  seedLoan,
  getToken,
  TEST_ORG_ID,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from './helpers';

let adminToken: string;

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  const borrowerId = await seedBorrower(TEST_ORG_ID);
  const propertyId = await seedProperty(TEST_ORG_ID);
  await seedLoan(TEST_ORG_ID, borrowerId, propertyId, { status: 'performing', loanNumber: 'LN-PORT-001' });
  await seedLoan(TEST_ORG_ID, borrowerId, propertyId, { status: 'watchlist', loanNumber: 'LN-PORT-002' });
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/portfolio/summary', () => {
  it('returns summary with correct shape', async () => {
    const res = await request(app)
      .get('/api/portfolio/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d).toHaveProperty('total_loans');
    expect(d).toHaveProperty('total_committed');
    expect(d).toHaveProperty('total_outstanding');
    expect(d).toHaveProperty('avg_interest_rate');
    expect(d).toHaveProperty('loans_by_type');
    expect(d).toHaveProperty('loans_by_status');
    expect(d.total_loans).toBeGreaterThanOrEqual(2);
  });

  it('counts watchlist and performing loans', async () => {
    const res = await request(app)
      .get('/api/portfolio/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    const d = res.body.data;
    expect(d.watchlist_loans).toBeGreaterThanOrEqual(1);
    expect(d.performing_loans).toBeGreaterThanOrEqual(1);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/portfolio/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/portfolio/performance', () => {
  it('returns monthly originations and covenant compliance', async () => {
    const res = await request(app)
      .get('/api/portfolio/performance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('monthly_originations');
    expect(res.body.data).toHaveProperty('covenant_compliance');
    expect(res.body.data).toHaveProperty('overdue_covenants');
    expect(Array.isArray(res.body.data.monthly_originations)).toBe(true);
    expect(Array.isArray(res.body.data.overdue_covenants)).toBe(true);
  });

  it('respects months query parameter', async () => {
    const res = await request(app)
      .get('/api/portfolio/performance?months=6')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
