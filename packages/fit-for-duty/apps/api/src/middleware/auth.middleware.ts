import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User, type IUser } from '../models/index.js';
import { UserRole } from '@ffd/shared';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  fullUser?: IUser;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Authenticate JWT token
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Load full user document (for routes that need it)
 */
export async function loadFullUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    
    req.fullUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user' });
  }
}

/**
 * Require specific roles
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

/**
 * Admin only middleware
 */
export const requireAdmin = requireRoles(UserRole.ADMIN);

/**
 * Assessor or Admin middleware
 */
export const requireAssessor = requireRoles(UserRole.ADMIN, UserRole.ASSESSOR);

/**
 * Any authenticated user with read access
 */
export const requireViewer = requireRoles(
  UserRole.ADMIN,
  UserRole.ASSESSOR,
  UserRole.VIEWER,
  UserRole.EMPLOYEE
);
