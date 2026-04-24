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

const BASE = (id: string) => `/api/loans/${id}/payments`;

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  const borrowerId = await seedBorrower(TEST_ORG_ID);
  const propertyId = await seedProperty(TEST_ORG_ID);
  loanId = await seedLoan(TEST_ORG_ID, borrowerId, propertyId, { committed_amount: 300000 });
  // Set initial balance by injecting directly
  await pool.query('UPDATE loans SET current_balance = 200000 WHERE id = $1', [loanId]);
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/loans/:loanId/payments', () => {
  let paymentId: string;

  it('records a payment and reduces loan balance', async () => {
    const res = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        payment_date: '2026-05-01',
        amount: 10000,
        principal: 8000,
        interest: 2000,
        payment_method: 'wire',
        reference_number: 'REF-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe('10000.00');
    expect(res.body.data.balance_after).toBe('192000.00');
    paymentId = res.body.data.id;

    const loan = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(parseFloat(loan.body.data.current_balance)).toBe(192000);
  });

  it('returns 400 on missing payment_date', async () => {
    const res = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 5000 });

    expect(res.status).toBe(400);
  });

  it('reverses a payment and restores balance', async () => {
    const res = await request(app)
      .delete(`${BASE(loanId)}/${paymentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const loan = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(parseFloat(loan.body.data.current_balance)).toBe(200000);
  });
});

describe('GET /api/loans/:loanId/payments', () => {
  it('returns payments with totals meta', async () => {
    const res = await request(app)
      .get(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total_paid');
    expect(res.body.meta).toHaveProperty('total_principal');
    expect(res.body.meta).toHaveProperty('total_interest');
  });
});
