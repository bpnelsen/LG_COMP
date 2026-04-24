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
let covenantId: string;

const BASE = (id: string) => `/api/loans/${id}/covenants`;

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  const borrowerId = await seedBorrower(TEST_ORG_ID);
  const propertyId = await seedProperty(TEST_ORG_ID);
  loanId = await seedLoan(TEST_ORG_ID, borrowerId, propertyId);
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/loans/:loanId/covenants', () => {
  it('creates a covenant', async () => {
    const res = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        covenant_type: 'financial',
        description: 'DSCR >= 1.25',
        threshold_value: 1.25,
        threshold_operator: '>=',
        frequency: 'quarterly',
        next_due_date: '2026-06-30',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('DSCR >= 1.25');
    covenantId = res.body.data.id;
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ covenant_type: 'financial' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent loan', async () => {
    const res = await request(app)
      .post(BASE('00000000-0000-0000-0000-000000000000'))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ covenant_type: 'financial', description: 'Test', frequency: 'annual' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/loans/:loanId/covenants', () => {
  it('returns covenants array', async () => {
    const res = await request(app)
      .get(BASE(loanId))
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/loans/:loanId/covenants/:id/test', () => {
  it('marks covenant compliant when test passes', async () => {
    const res = await request(app)
      .post(`${BASE(loanId)}/${covenantId}/test`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tested_value: 1.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('compliant');
  });

  it('marks covenant breach when test fails and creates exception', async () => {
    const res = await request(app)
      .post(`${BASE(loanId)}/${covenantId}/test`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tested_value: 1.0, notes: 'Below threshold' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('breach');

    const exceptRes = await request(app)
      .get(`${BASE(loanId)}/${covenantId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(exceptRes.body.data.exceptions.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/loans/:loanId/covenants/:id/exceptions', () => {
  it('records a manual exception', async () => {
    const res = await request(app)
      .post(`${BASE(loanId)}/${covenantId}/exceptions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Temporary waiver approved by committee', actual_value: 1.1 });

    expect(res.status).toBe(201);
    expect(res.body.data.description).toContain('waiver');
  });
});

describe('DELETE /api/loans/:loanId/covenants/:id', () => {
  it('removes a covenant', async () => {
    const res = await request(app)
      .delete(`${BASE(loanId)}/${covenantId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
