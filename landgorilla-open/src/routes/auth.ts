import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiResponse, User, JwtPayload } from '../types';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  organization_id: z.string().uuid(),
  role: z.enum(['admin', 'loan_officer', 'analyst', 'viewer']).default('viewer'),
});

// POST /auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: ApiResponse = { success: false, error: 'Invalid credentials format' };
    res.status(400).json(response);
    return;
  }

  const { email, password } = parsed.data;

  const users = await query<User>(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email.toLowerCase()]
  );

  const user = users[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const response: ApiResponse = { success: false, error: 'Invalid email or password' };
    res.status(401).json(response);
    return;
  }

  const secret = process.env.JWT_SECRET!;
  const payload: JwtPayload = {
    user_id: user.id,
    organization_id: user.organization_id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as jwt.SignOptions);

  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const { password_hash: _, ...safeUser } = user;
  const response: ApiResponse = {
    success: true,
    data: { token, user: safeUser },
    message: 'Login successful',
  };
  res.json(response);
});

// POST /auth/register
router.post('/register', async (req, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: ApiResponse = { success: false, error: 'Validation failed', data: parsed.error.errors };
    res.status(400).json(response);
    return;
  }

  const { email, password, first_name, last_name, organization_id, role } = parsed.data;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.length > 0) {
    const response: ApiResponse = { success: false, error: 'Email already registered' };
    res.status(409).json(response);
    return;
  }

  const orgExists = await query('SELECT id FROM organizations WHERE id = $1 AND is_active = true', [organization_id]);
  if (orgExists.length === 0) {
    const response: ApiResponse = { success: false, error: 'Organization not found' };
    res.status(404).json(response);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const newUsers = await query<User>(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, organization_id, email, first_name, last_name, role, is_active, created_at`,
    [organization_id, email.toLowerCase(), password_hash, first_name, last_name, role]
  );

  const response: ApiResponse = {
    success: true,
    data: newUsers[0],
    message: 'User registered successfully',
  };
  res.status(201).json(response);
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await query<User>(
    'SELECT id, organization_id, email, first_name, last_name, role, is_active, last_login, created_at FROM users WHERE id = $1',
    [req.user!.user_id]
  );

  if (users.length === 0) {
    const response: ApiResponse = { success: false, error: 'User not found' };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = { success: true, data: users[0] };
  res.json(response);
});

export default router;
