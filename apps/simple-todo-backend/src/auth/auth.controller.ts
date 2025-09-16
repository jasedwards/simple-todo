/**
 * Authentication controller
 * @description Handles HTTP requests for authentication operations
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  validateRegistrationRequest,
  validateLoginRequest,
  validatePasswordRecoveryRequest,
  validatePasswordResetRequest
} from '../utils/validation';
import { getClientInfo } from '../utils/audit';

/**
 * Authentication controller class
 * @class AuthController
 * @description HTTP route handlers for authentication endpoints
 */
export class AuthController {
  /**
   * Handles user registration
   * @method register
   * @description POST /auth/register endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate and sanitize input
      const validation = validateRegistrationRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors }
        });
        return;
      }

      // Extract client information for audit logging
      const { ipAddress, userAgent } = getClientInfo(req);

      // Register user
      const authResponse = await AuthService.register(
        validation.data!,
        ipAddress,
        userAgent
      );

      console.log(`✅ User registered successfully: ${authResponse.user.email}`);

      // Return successful response
      res.status(201).json({
        message: 'User registered successfully',
        data: authResponse
      });

    } catch (error: any) {
      console.error('Registration controller error:', error);

      if (error.code) {
        res.status(error.statusCode || 400).json({
          message: error.message,
          code: error.code
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Handles user login
   * @method login
   * @description POST /auth/login endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate and sanitize input
      const validation = validateLoginRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors }
        });
        return;
      }

      // Extract client information for audit logging
      const { ipAddress, userAgent } = getClientInfo(req);

      // Authenticate user
      const authResponse = await AuthService.login(
        validation.data!,
        ipAddress,
        userAgent
      );

      console.log(`✅ User logged in successfully: ${authResponse.user.email}`);

      // Return successful response
      res.status(200).json({
        message: 'Login successful',
        data: authResponse
      });

    } catch (error: any) {
      console.error('Login controller error:', error);

      if (error.code) {
        res.status(error.statusCode || 401).json({
          message: error.message,
          code: error.code
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Handles password recovery initiation
   * @method initiatePasswordRecovery
   * @description POST /auth/recover endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  static async initiatePasswordRecovery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate and sanitize input
      const validation = validatePasswordRecoveryRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors }
        });
        return;
      }

      // Extract client information for audit logging
      const { ipAddress, userAgent } = getClientInfo(req);

      // Initiate password recovery
      await AuthService.initiatePasswordRecovery(
        validation.data!,
        ipAddress,
        userAgent
      );

      console.log(`✅ Password recovery initiated for: ${validation.data!.email}`);

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        message: 'If the email exists, a password recovery link has been sent'
      });

    } catch (error: any) {
      console.error('Password recovery controller error:', error);

      // Always return success for security, but log the error
      res.status(200).json({
        message: 'If the email exists, a password recovery link has been sent'
      });
    }
  }

  /**
   * Handles password reset
   * @method resetPassword
   * @description POST /auth/reset endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate and sanitize input
      const validation = validatePasswordResetRequest(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors }
        });
        return;
      }

      // Extract client information for audit logging
      const { ipAddress, userAgent } = getClientInfo(req);

      // Reset password
      await AuthService.resetPassword(
        validation.data!,
        ipAddress,
        userAgent
      );

      console.log(`✅ Password reset completed successfully`);

      res.status(200).json({
        message: 'Password reset successful'
      });

    } catch (error: any) {
      console.error('Password reset controller error:', error);

      if (error.code) {
        res.status(error.statusCode || 400).json({
          message: error.message,
          code: error.code
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Handles user logout
   * @method logout
   * @description POST /auth/logout endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract client information for audit logging
      const { ipAddress, userAgent } = getClientInfo(req);
      const user = (req as any).user;

      // Log the logout event
      if (user) {
        // In a real application, you might invalidate the token here
        console.log(`✅ User logged out: ${user.email}`);
      }

      res.status(200).json({
        message: 'Logout successful'
      });

    } catch (error: any) {
      console.error('Logout controller error:', error);
      next(error);
    }
  }

  /**
   * Handles user profile retrieval
   * @method getProfile
   * @description GET /auth/profile endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: { user }
      });

    } catch (error: any) {
      console.error('Profile controller error:', error);
      next(error);
    }
  }

  /**
   * Health check endpoint
   * @method healthCheck
   * @description GET /auth/health endpoint handler
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {void}
   */
  static healthCheck(req: Request, res: Response): void {
    res.status(200).json({
      message: 'Authentication service is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
}