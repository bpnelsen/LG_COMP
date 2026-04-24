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
  VIEWER_EMAIL,
  VIEWER_PASSWORD,
} from './helpers';

let adminToken: string;
let viewerToken: string;
let borrowerId: string;
let propertyId: string;
let loanId: string;

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  await seedUser(TEST_ORG_ID, VIEWER_EMAIL, VIEWER_PASSWORD, 'viewer');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  viewerToken = await getToken(VIEWER_EMAIL, VIEWER_PASSWORD);
  borrowerId = await seedBorrower(TEST_ORG_ID);
  propertyId = await seedProperty(TEST_ORG_ID);
  loanId = await seedLoan(TEST_ORG_ID, borrowerId, propertyId);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/loans', () => {
  it('returns list of loans with pagination', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/loans?status=performing')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((l: { status: string }) => l.status === 'performing')).toBe(true);
  });

  it('filters by borrower_id', async () => {
    const res = await request(app)
      .get(`/api/loans?borrower_id=${borrowerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/loans');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/loans/:id', () => {
  it('returns loan with covenants and disbursements', async () => {
    const res = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(loanId);
    expect(Array.isArray(res.body.data.covenants)).toBe(true);
    expect(Array.isArray(res.body.data.disbursements)).toBe(true);
  });

  it('returns 404 for unknown loan', async () => {
    const res = await request(app)
      .get('/api/loans/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/loans', () => {
  it('creates a loan as admin', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        loan_number: 'LN-CREATE-001',
        borrower_id: borrowerId,
        property_id: propertyId,
        loan_type: 'bridge',
        committed_amount: 750000,
        interest_rate: 7.5,
        rate_type: 'fixed',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.loan_number).toBe('LN-CREATE-001');
    expect(res.body.data.committed_amount).toBe('750000.00');
  });

  it('returns 403 for viewer', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        loan_number: 'LN-VIEWER-001',
        borrower_id: borrowerId,
        loan_type: 'bridge',
        committed_amount: 100000,
        interest_rate: 5,
        rate_type: 'fixed',
      });

    expect(res.status).toBe(403);
  });

  it('returns 400 when borrower_id is missing', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        loan_number: 'LN-BAD',
        loan_type: 'bridge',
        committed_amount: 100000,
        interest_rate: 5,
        rate_type: 'fixed',
      });

    expect(res.status).toBe(400);
  });

  it('returns 404 when borrower does not belong to org', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        loan_number: 'LN-NOBORROWER',
        borrower_id: '00000000-0000-0000-0000-000000000000',
        property_id: propertyId,
        loan_type: 'bridge',
        committed_amount: 100000,
        interest_rate: 5,
        rate_type: 'fixed',
      });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/loans/:id', () => {
  it('updates loan status', async () => {
    const res = await request(app)
      .put(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'watchlist' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('watchlist');
  });
});

describe('DELETE /api/loans/:id', () => {
  it('soft-deletes a loan as admin', async () => {
    const toDelete = await seedLoan(TEST_ORG_ID, borrowerId, propertyId, { loanNumber: 'LN-DEL-001' });
    const res = await request(app)
      .delete(`/api/loans/${toDelete}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for viewer', async () => {
    const res = await request(app)
      .delete(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});
