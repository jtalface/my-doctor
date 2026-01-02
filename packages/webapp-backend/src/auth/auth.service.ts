/**
 * Auth Service
 * 
 * Main authentication business logic.
 * Handles registration, login, logout, and token refresh.
 */

import { User, IUser } from '../models/user.model.js';
import { PatientProfile } from '../models/patient-profile.model.js';
import { passwordService } from './password.service.js';
import { tokenService } from './token.service.js';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  RefreshResponse,
  AuthError, 
  AuthErrorCode 
} from './auth.types.js';

class AuthService {
  /**
   * Register a new user
   */
  async register(
    data: RegisterRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse & { refreshToken: string; refreshExpiresAt: Date }> {
    const { email, password, name, language } = data;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AuthError(
        AuthErrorCode.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists',
        409
      );
    }

    // Validate password
    const validation = passwordService.validate(password);
    if (!validation.isValid) {
      throw new AuthError(
        AuthErrorCode.WEAK_PASSWORD,
        validation.errors.join('. '),
        400
      );
    }

    // Hash password
    const passwordHash = await passwordService.hash(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      name,
      passwordHash,
      isGuest: false,
      preferences: {
        notifications: true,
        dataSharing: false,
        language: language || 'en',
      },
      lastLoginAt: new Date(),
    });
    await user.save();

    // Create empty patient profile
    const profile = new PatientProfile({
      userId: user._id,
    });
    await profile.save();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id.toString(), user.email);
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await tokenService.generateRefreshToken(
      user._id.toString(),
      userAgent,
      ipAddress
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        preferences: user.preferences,
      },
      accessToken,
      expiresIn: tokenService.getAccessTokenExpiry(),
      refreshToken,
      refreshExpiresAt,
    };
  }

  /**
   * Login with email and password
   */
  async login(
    data: LoginRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse & { refreshToken: string; refreshExpiresAt: Date }> {
    const { email, password } = data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new AuthError(
        AuthErrorCode.ACCOUNT_LOCKED,
        `Account is locked. Try again in ${minutesLeft} minutes.`,
        423
      );
    }

    // Check if user has a password (not a guest)
    if (!user.passwordHash) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'This account was created without a password. Please use password reset.',
        401
      );
    }

    // Verify password
    const isValidPassword = await passwordService.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Increment failed attempts
      await (user as any).incrementLoginAttempts();
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Reset failed attempts on successful login
    await (user as any).resetLoginAttempts();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id.toString(), user.email);
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await tokenService.generateRefreshToken(
      user._id.toString(),
      userAgent,
      ipAddress
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        preferences: user.preferences,
      },
      accessToken,
      expiresIn: tokenService.getAccessTokenExpiry(),
      refreshToken,
      refreshExpiresAt,
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await tokenService.verifyRefreshToken(refreshToken);
      await tokenService.revokeRefreshToken(payload.tokenId);
    } catch (error) {
      // Ignore errors during logout - token may already be invalid
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await tokenService.revokeAllUserTokens(userId);
  }

  /**
   * Refresh access token
   */
  async refresh(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<RefreshResponse & { refreshToken: string; refreshExpiresAt: Date }> {
    // Verify current refresh token
    const payload = await tokenService.verifyRefreshToken(refreshToken);

    // Get user to ensure they still exist and are valid
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        'User no longer exists',
        401
      );
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new AuthError(
        AuthErrorCode.ACCOUNT_LOCKED,
        'Account is locked',
        423
      );
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken(user._id.toString(), user.email);

    // Rotate refresh token (mark old as used, generate new)
    const { token: newRefreshToken, expiresAt: refreshExpiresAt } = await tokenService.rotateRefreshToken(
      payload.tokenId,
      user._id.toString(),
      userAgent,
      ipAddress
    );

    return {
      accessToken,
      expiresIn: tokenService.getAccessTokenExpiry(),
      refreshToken: newRefreshToken,
      refreshExpiresAt,
    };
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    isGuest: boolean;
    preferences: IUser['preferences'];
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isGuest: user.isGuest,
      preferences: user.preferences,
    };
  }

  /**
   * Check if a user exists by email (for registration check)
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  /**
   * Get password requirements for display
   */
  getPasswordRequirements(): string[] {
    return passwordService.getRequirements();
  }
}

export const authService = new AuthService();

