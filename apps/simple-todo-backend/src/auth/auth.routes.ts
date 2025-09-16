/**
 * Authentication routes
 * @description Express router configuration for authentication endpoints
 */

import { Router } from 'express';
import { AuthController } from './auth.controller';
import { rateLimitMiddleware, authMiddleware } from '../middleware/security';

/**
 * Creates and configures authentication routes
 * @function createAuthRoutes
 * @description Sets up all authentication routes with appropriate middleware
 * @returns {Router} Configured Express router
 */
export function createAuthRoutes(): Router {
  const router = Router();

  // Apply rate limiting to all auth routes
  const authRateLimit = rateLimitMiddleware(15 * 60 * 1000, 10); // 10 requests per 15 minutes
  const loginRateLimit = rateLimitMiddleware(15 * 60 * 1000, 5); // 5 login attempts per 15 minutes

  /**
   * Health check endpoint
   * GET /auth/health
   * @description Check if the authentication service is running
   * @access Public
   */
  router.get('/health', AuthController.healthCheck);

  /**
   * User registration endpoint
   * POST /auth/register
   * @description Register a new user account
   * @access Public
   * @rateLimit 10 requests per 15 minutes
   * @body {RegisterRequest} User registration data
   * @returns {AuthResponse} User data and session token
   */
  router.post('/register', authRateLimit, AuthController.register);

  /**
   * User login endpoint
   * POST /auth/login
   * @description Authenticate user and create session
   * @access Public
   * @rateLimit 5 requests per 15 minutes
   * @body {LoginRequest} User credentials
   * @returns {AuthResponse} User data and session token
   */
  router.post('/login', loginRateLimit, AuthController.login);

  /**
   * Password recovery initiation endpoint
   * POST /auth/recover
   * @description Initiate password recovery process
   * @access Public
   * @rateLimit 10 requests per 15 minutes
   * @body {PasswordRecoveryRequest} Email for recovery
   * @returns {void} Always returns success for security
   */
  router.post('/recover', authRateLimit, AuthController.initiatePasswordRecovery);

  /**
   * Password reset endpoint
   * POST /auth/reset
   * @description Complete password reset with valid token
   * @access Public
   * @rateLimit 10 requests per 15 minutes
   * @body {PasswordResetRequest} Reset token and new password
   * @returns {void} Success message
   */
  router.post('/reset', authRateLimit, AuthController.resetPassword);

  /**
   * User logout endpoint
   * POST /auth/logout
   * @description Invalidate user session
   * @access Private (requires authentication)
   * @header {string} Authorization Bearer token
   * @returns {void} Success message
   */
  router.post('/logout', authMiddleware, AuthController.logout);

  /**
   * User profile endpoint
   * GET /auth/profile
   * @description Get current user profile information
   * @access Private (requires authentication)
   * @header {string} Authorization Bearer token
   * @returns {User} Current user data
   */
  router.get('/profile', authMiddleware, AuthController.getProfile);

  return router;
}

/**
 * Authentication routes instance
 * @constant authRoutes
 * @description Pre-configured authentication routes
 */
export const authRoutes = createAuthRoutes();