/**
 * Authentication controller unit tests
 * @description Tests for AuthController HTTP endpoints
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, PasswordRecoveryRequest } from '@simple-todo/shared';

// Mock AuthService
vi.mock('./auth.service', () => ({
  AuthService: {
    register: vi.fn(),
    login: vi.fn(),
    initiatePasswordRecovery: vi.fn(),
    resetPassword: vi.fn(),
    validateSession: vi.fn()
  }
}));

// Mock validation
vi.mock('../utils/validation', () => ({
  validateRegistration: vi.fn(),
  validateLogin: vi.fn(),
  validatePasswordRecovery: vi.fn(),
  validatePasswordReset: vi.fn()
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: vi.MockedFunction<any>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('register', () => {
    const validRegisterData: RegisterRequest = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User'
    };

    test('should successfully register a new user', async () => {
      mockRequest.body = validRegisterData;

      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: 1234567890
        }
      };

      (AuthService.register as any).mockResolvedValue(mockAuthResponse);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(AuthService.register).toHaveBeenCalledWith(
        validRegisterData,
        '127.0.0.1',
        'test-agent'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: mockAuthResponse.user,
        session: mockAuthResponse.session
      });
    });

    test('should handle registration with invalid email format', async () => {
      mockRequest.body = { ...validRegisterData, email: 'invalid-email' };

      const mockError = new Error('Registration failed: Invalid email format');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'REGISTRATION_FAILED';
      (mockError as any).statusCode = 400;

      (AuthService.register as any).mockRejectedValue(mockError);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Registration failed: Invalid email format',
        code: 'REGISTRATION_FAILED'
      });
    });

    test('should handle registration with existing email', async () => {
      mockRequest.body = validRegisterData;

      const mockError = new Error('Registration failed: User already registered');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'REGISTRATION_FAILED';
      (mockError as any).statusCode = 409;

      (AuthService.register as any).mockRejectedValue(mockError);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Registration failed: User already registered',
        code: 'REGISTRATION_FAILED'
      });
    });

    test('should handle missing fields', async () => {
      mockRequest.body = { email: 'test@example.com' }; // Missing password and name

      const mockError = new Error('Registration failed: Missing required fields');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'REGISTRATION_FAILED';
      (mockError as any).statusCode = 400;

      (AuthService.register as any).mockRejectedValue(mockError);

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Registration failed: Missing required fields',
        code: 'REGISTRATION_FAILED'
      });
    });
  });

  describe('login', () => {
    const validLoginData: LoginRequest = {
      email: 'test@example.com',
      password: 'SecurePassword123!'
    };

    test('should successfully login with valid credentials', async () => {
      mockRequest.body = validLoginData;

      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: 1234567890
        }
      };

      (AuthService.login as any).mockResolvedValue(mockAuthResponse);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(AuthService.login).toHaveBeenCalledWith(
        validLoginData,
        '127.0.0.1',
        'test-agent'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: mockAuthResponse.user,
        session: mockAuthResponse.session
      });
    });

    test('should handle login with incorrect password', async () => {
      mockRequest.body = { ...validLoginData, password: 'wrongpassword' };

      const mockError = new Error('Invalid credentials');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'INVALID_CREDENTIALS';
      (mockError as any).statusCode = 401;

      (AuthService.login as any).mockRejectedValue(mockError);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    });

    test('should handle login with unregistered email', async () => {
      mockRequest.body = { ...validLoginData, email: 'nonexistent@example.com' };

      const mockError = new Error('Invalid credentials');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'INVALID_CREDENTIALS';
      (mockError as any).statusCode = 401;

      (AuthService.login as any).mockRejectedValue(mockError);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    });
  });

  describe('initiatePasswordRecovery', () => {
    const recoveryData: PasswordRecoveryRequest = {
      email: 'test@example.com'
    };

    test('should successfully initiate password recovery', async () => {
      mockRequest.body = recoveryData;

      (AuthService.initiatePasswordRecovery as any).mockResolvedValue(undefined);

      await AuthController.initiatePasswordRecovery(mockRequest as Request, mockResponse as Response);

      expect(AuthService.initiatePasswordRecovery).toHaveBeenCalledWith(
        recoveryData,
        '127.0.0.1',
        'test-agent'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password recovery email sent successfully'
      });
    });

    test('should handle recovery for unregistered email', async () => {
      mockRequest.body = { email: 'nonexistent@example.com' };

      (AuthService.initiatePasswordRecovery as any).mockResolvedValue(undefined);

      await AuthController.initiatePasswordRecovery(mockRequest as Request, mockResponse as Response);

      // Should still return success to not reveal if email exists
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password recovery email sent successfully'
      });
    });

    test('should handle service errors', async () => {
      mockRequest.body = recoveryData;

      const mockError = new Error('Password recovery failed: Service temporarily unavailable');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'RECOVERY_FAILED';
      (mockError as any).statusCode = 500;

      (AuthService.initiatePasswordRecovery as any).mockRejectedValue(mockError);

      await AuthController.initiatePasswordRecovery(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password recovery failed: Service temporarily unavailable',
        code: 'RECOVERY_FAILED'
      });
    });
  });

  describe('resetPassword', () => {
    const resetData = {
      token: 'valid-reset-token',
      password: 'NewSecurePassword123!'
    };

    test('should successfully reset password in development mode', async () => {
      mockRequest.body = resetData;

      (AuthService.resetPassword as any).mockResolvedValue(undefined);

      await AuthController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(AuthService.resetPassword).toHaveBeenCalledWith(
        resetData,
        '127.0.0.1',
        'test-agent'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password reset successfully'
      });
    });

    test('should handle invalid reset token', async () => {
      mockRequest.body = { ...resetData, token: 'invalid-token' };

      const mockError = new Error('Password reset failed');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'RESET_ERROR';
      (mockError as any).statusCode = 400;

      (AuthService.resetPassword as any).mockRejectedValue(mockError);

      await AuthController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password reset failed',
        code: 'RESET_ERROR'
      });
    });

    test('should handle expired reset token', async () => {
      mockRequest.body = { ...resetData, token: 'expired-token' };

      const mockError = new Error('Password reset failed');
      (mockError as any).name = 'ApiError';
      (mockError as any).code = 'RESET_ERROR';
      (mockError as any).statusCode = 400;

      (AuthService.resetPassword as any).mockRejectedValue(mockError);

      await AuthController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password reset failed',
        code: 'RESET_ERROR'
      });
    });
  });
});