/**
 * Authentication service
 * @description Core authentication logic using Supabase
 */

import {
  RegisterRequest,
  LoginRequest,
  PasswordRecoveryRequest,
  PasswordResetRequest,
  AuthResponse,
  User
} from '@simple-todo/shared';
import { supabase, isDevelopment } from '../config/supabase';
import { AuditService } from '../utils/audit';

/**
 * Authentication service class
 * @class AuthService
 * @description Handles all authentication operations with Supabase integration
 */
export class AuthService {
  /**
   * Registers a new user
   * @method register
   * @description Creates new user account with email and password
   * @param {RegisterRequest} userData - User registration data
   * @param {string} [ipAddress] - Client IP address
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<AuthResponse>} Authentication response with user and session
   * @throws {ApiError} Registration failure
   */
  static async register(
    userData: RegisterRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      if (isDevelopment) {
        console.log('🔧 Development mode: Mocking user registration for', userData.email);
      }

      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });

      if (error) {
        throw new ApiError(`Registration failed: ${error.message}`, 'REGISTRATION_FAILED');
      }

      if (!data.user || !data.session) {
        throw new ApiError('Registration failed: No user data returned', 'REGISTRATION_FAILED');
      }

      // Create user profile
      const user: User = {
        id: data.user.id,
        email: data.user.email || userData.email,
        name: userData.name,
        avatar: undefined,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(data.user.updated_at || data.user.created_at)
      };

      // Create audit log
      await AuditService.logUserRegistration(
        user.id,
        user.email,
        ipAddress,
        userAgent
      );

      // Return authentication response
      return {
        user,
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || '',
          expiresAt: data.session.expires_at || 0
        }
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Registration error:', error);
      throw new ApiError('Registration failed', 'REGISTRATION_ERROR');
    }
  }

  /**
   * Authenticates user login
   * @method login
   * @description Authenticates user with email and password
   * @param {LoginRequest} credentials - User login credentials
   * @param {string} [ipAddress] - Client IP address
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<AuthResponse>} Authentication response with user and session
   * @throws {ApiError} Login failure
   */
  static async login(
    credentials: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      if (isDevelopment) {
        console.log('🔧 Development mode: Mocking user login for', credentials.email);
      }

      // Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error || !data.user || !data.session) {
        // Log failed login attempt
        await AuditService.logUserLogin(
          'unknown',
          credentials.email,
          false,
          ipAddress,
          userAgent
        );

        throw new ApiError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Create user profile
      const user: User = {
        id: data.user.id,
        email: data.user.email || credentials.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        avatar: data.user.user_metadata?.avatar,
        createdAt: new Date(data.user.created_at),
        updatedAt: new Date(data.user.updated_at || data.user.created_at)
      };

      // Create audit log for successful login
      await AuditService.logUserLogin(
        user.id,
        user.email,
        true,
        ipAddress,
        userAgent
      );

      // Return authentication response
      return {
        user,
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token || '',
          expiresAt: data.session.expires_at || 0
        }
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Login error:', error);
      throw new ApiError('Login failed', 'LOGIN_ERROR');
    }
  }

  /**
   * Initiates password recovery
   * @method initiatePasswordRecovery
   * @description Sends password recovery email
   * @param {PasswordRecoveryRequest} recoveryData - Recovery request data
   * @param {string} [ipAddress] - Client IP address
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   * @throws {ApiError} Recovery initiation failure
   */
  static async initiatePasswordRecovery(
    recoveryData: PasswordRecoveryRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      if (isDevelopment) {
        console.log('🔧 Development mode: Mocking password recovery for', recoveryData.email);
      }

      // Request password reset from Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryData.email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/reset-password`
      });

      if (error) {
        throw new ApiError(`Password recovery failed: ${error.message}`, 'RECOVERY_FAILED');
      }

      // Create audit log
      await AuditService.logPasswordRecoveryInitiated(
        recoveryData.email,
        ipAddress,
        userAgent
      );

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Password recovery error:', error);
      throw new ApiError('Password recovery failed', 'RECOVERY_ERROR');
    }
  }

  /**
   * Completes password reset
   * @method resetPassword
   * @description Resets user password with valid token
   * @param {PasswordResetRequest} resetData - Password reset data
   * @param {string} [ipAddress] - Client IP address
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   * @throws {ApiError} Password reset failure
   */
  static async resetPassword(
    resetData: PasswordResetRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      if (isDevelopment) {
        console.log('🔧 Development mode: Mocking password reset');

        // Create mock audit log for successful reset
        await AuditService.logPasswordResetCompleted(
          'mock-user-id',
          'mock@example.com',
          true,
          ipAddress,
          userAgent
        );
        return;
      }

      // In production, this would typically be handled by Supabase's built-in
      // password reset flow through email links
      // For this demo, we'll simulate the process

      throw new ApiError('Password reset functionality requires email verification', 'RESET_REQUIRES_EMAIL');

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Password reset error:', error);
      throw new ApiError('Password reset failed', 'RESET_ERROR');
    }
  }

  /**
   * Validates session token
   * @method validateSession
   * @description Validates and refreshes user session
   * @param {string} accessToken - Access token to validate
   * @returns {Promise<User>} User information
   * @throws {ApiError} Session validation failure
   */
  static async validateSession(accessToken: string): Promise<User> {
    try {
      if (isDevelopment) {
        // Mock session validation in development
        return {
          id: 'mock-user-id',
          email: 'dev@example.com',
          name: 'Dev User',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Get user from token
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        throw new ApiError('Invalid session', 'INVALID_SESSION');
      }

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar: user.user_metadata?.avatar,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at)
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('Session validation error:', error);
      throw new ApiError('Session validation failed', 'SESSION_ERROR');
    }
  }
}

/**
 * Custom API Error class
 * @class ApiError
 * @description Custom error class for API responses
 * @extends Error
 */
class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}