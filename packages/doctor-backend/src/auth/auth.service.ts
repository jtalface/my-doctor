/**
 * Auth Service
 * 
 * Main authentication business logic for doctors.
 */

import { Provider, IProvider } from '../models/provider.model.js';
import { passwordService } from './password.service.js';
import { tokenService } from './token.service.js';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  RefreshResponse,
  DoctorResponse,
  AuthError, 
  AuthErrorCode 
} from './auth.types.js';

class AuthService {
  /**
   * Register a new doctor
   */
  async register(
    data: RegisterRequest,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponse & { refreshToken: string; refreshExpiresAt: Date }> {
    const { email, password, firstName, lastName, specialty, title, licenseNumber, phone } = data;

    // Check if email already exists
    const existingProvider = await Provider.findOne({ email: email.toLowerCase() });
    if (existingProvider) {
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

    // Create provider/doctor
    const provider = new Provider({
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      specialty,
      title: title || 'Dr.',
      licenseNumber,
      phone,
      languages: ['pt', 'en'], // Default languages
      isActive: true,
      isAvailable: true,
      isVerified: false, // Needs admin verification
      lastLoginAt: new Date(),
      preferences: {
        notifications: true,
        emailAlerts: true,
        language: 'en',
      },
    });
    await provider.save();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      provider._id.toString(), 
      provider.email
    );
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await tokenService.generateRefreshToken(
      provider._id.toString(),
      userAgent,
      ipAddress
    );

    return {
      doctor: this.formatDoctorResponse(provider),
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

    // Find provider
    const provider = await Provider.findOne({ email: email.toLowerCase() });
    if (!provider || !provider.passwordHash) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Check if active
    if (!provider.isActive) {
      throw new AuthError(
        AuthErrorCode.ACCOUNT_DISABLED,
        'This account has been disabled',
        403
      );
    }

    // Verify password
    const isValid = await passwordService.compare(password, provider.passwordHash);
    if (!isValid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Update last login
    provider.lastLoginAt = new Date();
    provider.lastActiveAt = new Date();
    await provider.save();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(
      provider._id.toString(),
      provider.email
    );
    const { token: refreshToken, expiresAt: refreshExpiresAt } = await tokenService.generateRefreshToken(
      provider._id.toString(),
      userAgent,
      ipAddress
    );

    return {
      doctor: this.formatDoctorResponse(provider),
      accessToken,
      expiresIn: tokenService.getAccessTokenExpiry(),
      refreshToken,
      refreshExpiresAt,
    };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const providerId = await tokenService.validateRefreshToken(refreshToken);
    if (!providerId) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid or expired refresh token',
        401
      );
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      throw new AuthError(
        AuthErrorCode.NOT_FOUND,
        'Doctor not found',
        404
      );
    }

    if (!provider.isActive) {
      throw new AuthError(
        AuthErrorCode.ACCOUNT_DISABLED,
        'This account has been disabled',
        403
      );
    }

    const accessToken = tokenService.generateAccessToken(
      provider._id.toString(),
      provider.email
    );

    return {
      accessToken,
      expiresIn: tokenService.getAccessTokenExpiry(),
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(providerId: string): Promise<void> {
    await tokenService.revokeAllDoctorTokens(providerId);
  }

  /**
   * Get current doctor profile
   */
  async getProfile(providerId: string): Promise<DoctorResponse> {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      throw new AuthError(
        AuthErrorCode.NOT_FOUND,
        'Doctor not found',
        404
      );
    }
    return this.formatDoctorResponse(provider);
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(providerId: string): Promise<void> {
    await Provider.findByIdAndUpdate(providerId, {
      lastActiveAt: new Date(),
    });
  }

  /**
   * Format provider to doctor response
   */
  private formatDoctorResponse(provider: IProvider): DoctorResponse {
    return {
      id: provider._id.toString(),
      email: provider.email,
      firstName: provider.firstName,
      lastName: provider.lastName,
      name: provider.name, // Virtual
      specialty: provider.specialty,
      title: provider.title,
      avatarUrl: provider.avatarUrl,
      isVerified: provider.isVerified,
      preferences: provider.preferences,
    };
  }
}

export const authService = new AuthService();

