import request from 'supertest';
import app from '../index';
import pool from '../db';
import {
  truncateTables,
  seedOrg,
  seedUser,
  getToken,
  TEST_ORG_ID,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from './helpers';

beforeEach(async () => {
  await truncateTables();
  await seedOrg();
  await seedUser(TEST_ORG_ID, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/login', () => {
  it('returns 200 and token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(ADMIN_EMAIL);
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: ADMIN_PASSWORD });

    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: ADMIN_PASSWORD });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@loanscope.io',
        password: 'NewPass123!',
        first_name: 'New',
        last_name: 'User',
        organization_id: TEST_ORG_ID,
        role: 'viewer',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('newuser@loanscope.io');
    expect(res.body.data.password_hash).toBeUndefined();
  });

  it('returns 409 if email already exists', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: ADMIN_EMAIL,
        password: 'AnotherPass1!',
        first_name: 'Dup',
        last_name: 'User',
        organization_id: TEST_ORG_ID,
      });

    expect(res.status).toBe(409);
  });

  it('returns 404 if organization does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'xyz@loanscope.io',
        password: 'SomePass1!',
        first_name: 'X',
        last_name: 'Y',
        organization_id: '00000000-0000-0000-0000-000000000000',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const token = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(ADMIN_EMAIL);
    expect(res.body.data.role).toBe('admin');
  });

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 on invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
