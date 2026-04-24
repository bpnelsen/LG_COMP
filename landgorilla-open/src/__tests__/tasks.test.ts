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
let taskId: string;

beforeAll(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  await seedUser(TEST_ORG_ID, VIEWER_EMAIL, VIEWER_PASSWORD, 'viewer');
  adminToken = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
  viewerToken = await getToken(VIEWER_EMAIL, VIEWER_PASSWORD);
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/tasks', () => {
  it('creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Review loan docs', priority: 'high', due_date: '2026-05-31' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Review loan docs');
    expect(res.body.data.priority).toBe('high');
    taskId = res.body.data.id;
  });

  it('creates a task with loan association', async () => {
    const borrowerId = await seedBorrower(TEST_ORG_ID);
    const propertyId = await seedProperty(TEST_ORG_ID);
    const loanId = await seedLoan(TEST_ORG_ID, borrowerId, propertyId, { loanNumber: 'LN-TASK-001' });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Inspect property', priority: 'urgent', loan_id: loanId });

    expect(res.status).toBe(201);
    expect(res.body.data.loan_id).toBe(loanId);
  });

  it('returns 400 on missing title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priority: 'low' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/tasks', () => {
  it('returns tasks sorted by priority', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters tasks by priority', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=high')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { priority: string }) => t.priority === 'high')).toBe(true);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('marks task completed and sets completed_at', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completed_at).not.toBeNull();
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task as admin', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'To be deleted' });

    const res = await request(app)
      .delete(`/api/tasks/${create.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 403 for viewer', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});
