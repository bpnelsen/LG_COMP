import request from 'supertest';
import app from '../index';
import pool from '../db';
import {
  truncateTables,
  seedOrg,
  seedUser,
  seedBorrower,
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

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  await seedUser(TEST_ORG_ID, VIEWER_EMAIL, VIEWER_PASSWORD, 'viewer');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  viewerToken = await getToken(VIEWER_EMAIL, VIEWER_PASSWORD);
  borrowerId = await seedBorrower(TEST_ORG_ID);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/borrowers', () => {
  it('returns list of borrowers', async () => {
    const res = await request(app)
      .get('/api/borrowers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/borrowers');
    expect(res.status).toBe(401);
  });

  it('filters by search term', async () => {
    const res = await request(app)
      .get('/api/borrowers?search=ACME')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((b: { legal_name: string }) => b.legal_name.includes('ACME'))).toBe(true);
  });
});

describe('GET /api/borrowers/:id', () => {
  it('returns borrower with contacts and loans', async () => {
    const res = await request(app)
      .get(`/api/borrowers/${borrowerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(borrowerId);
    expect(Array.isArray(res.body.data.contacts)).toBe(true);
    expect(Array.isArray(res.body.data.loans)).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/borrowers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/borrowers', () => {
  it('creates a borrower as admin', async () => {
    const res = await request(app)
      .post('/api/borrowers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ entity_type: 'llc', legal_name: 'New LLC' });

    expect(res.status).toBe(201);
    expect(res.body.data.legal_name).toBe('New LLC');
  });

  it('returns 403 for viewer role', async () => {
    const res = await request(app)
      .post('/api/borrowers')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ entity_type: 'llc', legal_name: 'Viewer LLC' });

    expect(res.status).toBe(403);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/borrowers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ entity_type: 'llc' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/borrowers/:id', () => {
  it('updates a borrower', async () => {
    const res = await request(app)
      .put(`/api/borrowers/${borrowerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ legal_name: 'Updated ACME', entity_type: 'corporation' });

    expect(res.status).toBe(200);
    expect(res.body.data.legal_name).toBe('Updated ACME');
  });
});

describe('DELETE /api/borrowers/:id', () => {
  it('soft-deletes a borrower as admin', async () => {
    const toDelete = await seedBorrower(TEST_ORG_ID);
    const res = await request(app)
      .delete(`/api/borrowers/${toDelete}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for viewer', async () => {
    const res = await request(app)
      .delete(`/api/borrowers/${borrowerId}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/borrowers/:id/contacts', () => {
  it('creates a contact for a borrower', async () => {
    const res = await request(app)
      .post(`/api/borrowers/${borrowerId}/contacts`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        is_primary: true,
        contact_type: 'guarantor',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.first_name).toBe('Jane');
  });
});
