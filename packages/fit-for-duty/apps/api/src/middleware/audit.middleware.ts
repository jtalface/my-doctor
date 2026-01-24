import { Response, NextFunction } from 'express';
import { AuditLog } from '../models/index.js';
import { AuthRequest } from './auth.middleware.js';

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  req: AuthRequest,
  diff?: Record<string, unknown>
): Promise<void> {
  try {
    await AuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      diff,
    });
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error);
  }
}

/**
 * Middleware to log request for audit purposes
 */
export function auditRequest(action: string, entityType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send to capture response
    res.send = function (body: any): Response {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = req.params.id || (typeof body === 'string' ? JSON.parse(body)?._id : body?._id) || 'unknown';
        createAuditLog(req.user.userId, action, entityType, String(entityId), req);
      }
      return originalSend.call(this, body);
    };
    
    next();
  };
}
