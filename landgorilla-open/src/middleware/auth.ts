import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, ApiResponse } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    const response: ApiResponse = { success: false, error: 'Authorization token required' };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const response: ApiResponse = { success: false, error: 'Server configuration error' };
    res.status(500).json(response);
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    const response: ApiResponse = { success: false, error: 'Invalid or expired token' };
    res.status(401).json(response);
  }
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      const response: ApiResponse = { success: false, error: 'Insufficient permissions' };
      res.status(403).json(response);
      return;
    }
    next();
  };
}
