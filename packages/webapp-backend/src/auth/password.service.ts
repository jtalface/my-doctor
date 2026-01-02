/**
 * Password Service
 * 
 * Handles password hashing, comparison, and validation.
 * Uses bcrypt for secure password hashing.
 */

import bcrypt from 'bcrypt';
import { authConfig } from './auth.config.js';
import { PasswordValidationResult } from './auth.types.js';

class PasswordService {
  private readonly saltRounds = authConfig.password.saltRounds;
  private readonly config = authConfig.password;

  /**
   * Hash a password using bcrypt
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a password with a hash
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters long`);
    }

    if (password.length > this.config.maxLength) {
      errors.push(`Password must be at most ${this.config.maxLength} characters long`);
    }

    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.config.requireNumber && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.config.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get password requirements as a human-readable string
   */
  getRequirements(): string[] {
    const requirements: string[] = [];
    
    requirements.push(`At least ${this.config.minLength} characters`);
    
    if (this.config.requireUppercase) {
      requirements.push('At least one uppercase letter');
    }
    
    if (this.config.requireLowercase) {
      requirements.push('At least one lowercase letter');
    }
    
    if (this.config.requireNumber) {
      requirements.push('At least one number');
    }
    
    if (this.config.requireSpecial) {
      requirements.push('At least one special character');
    }

    return requirements;
  }
}

export const passwordService = new PasswordService();

