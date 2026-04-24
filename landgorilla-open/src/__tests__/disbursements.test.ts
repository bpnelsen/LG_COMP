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
let loanId: string;

const BASE = (id: string) => `/api/loans/${id}/disbursements`;

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  const borrowerId = await seedBorrower(TEST_ORG_ID);
  const propertyId = await seedProperty(TEST_ORG_ID);
  loanId = await seedLoan(TEST_ORG_ID, borrowerId, propertyId, { committed_amount: 500000 });
});

afterAll(async () => {
  await pool.end();
});

describe('Disbursement workflow', () => {
  let disbId: string;

  it('creates a disbursement request (pending)', async () => {
    const res = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100000, disbursement_date: '2026-05-01', description: 'First draw' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    disbId = res.body.data.id;
  });

  it('approves the disbursement', async () => {
    const res = await request(app)
      .post(`${BASE(loanId)}/${disbId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wire_reference: 'WIRE-001' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('cannot approve an already-approved disbursement', async () => {
    const res = await request(app)
      .post(`${BASE(loanId)}/${disbId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('marks disbursement as sent and updates loan balance', async () => {
    const loanBefore = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const balanceBefore = parseFloat(loanBefore.body.data.current_balance);

    const res = await request(app)
      .post(`${BASE(loanId)}/${disbId}/disburse`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('disbursed');

    const loanAfter = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const balanceAfter = parseFloat(loanAfter.body.data.current_balance);

    expect(balanceAfter).toBe(balanceBefore + 100000);
  });

  it('cannot cancel a disbursed disbursement', async () => {
    const res = await request(app)
      .post(`${BASE(loanId)}/${disbId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
  });

  it('rejects disbursement exceeding committed amount', async () => {
    const res = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 450000, disbursement_date: '2026-05-02' });

    expect(res.status).toBe(422);
  });

  it('cancels a pending disbursement', async () => {
    const create = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 50000, disbursement_date: '2026-06-01' });

    const newId = create.body.data.id;

    const res = await request(app)
      .post(`${BASE(loanId)}/${newId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });
});

describe('GET /api/loans/:loanId/disbursements', () => {
  it('returns disbursements with total_disbursed meta', async () => {
    const res = await request(app)
      .get(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total_disbursed).toBeGreaterThan(0);
  });
});
