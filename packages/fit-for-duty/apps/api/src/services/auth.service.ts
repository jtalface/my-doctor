import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/index.js';
import type { AuthResponse, UserPublic } from '@ffd/shared';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { _id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export async function login(email: string, password: string): Promise<AuthResponse | null> {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    return null;
  }
  
  const token = generateToken(user);
  
  // Parse expiresIn to seconds
  const expiresIn = parseExpiresIn(config.jwt.expiresIn);
  
  const userPublic: UserPublic = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    locationIds: user.locationIds.map((id) => id.toString()),
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  
  return {
    accessToken: token,
    expiresIn,
    user: userPublic,
  };
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // Default 1 hour
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 3600;
  }
}
