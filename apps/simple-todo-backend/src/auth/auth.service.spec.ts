/**
 * Authentication service unit tests
 * @description Tests for AuthService with mocked Supabase integration
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, PasswordRecoveryRequest } from '@simple-todo/shared';

// Mock Supabase
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    getUser: vi.fn()
  }
};

// Mock audit service
vi.mock('../utils/audit', () => ({
  AuditService: {
    logUserRegistration: vi.fn(),
    logUserLogin: vi.fn(),
    logPasswordRecoveryInitiated: vi.fn(),
    logPasswordResetCompleted: vi.fn()
  }
}));

// Mock config
vi.mock('../config/supabase', () => ({
  supabase: mockSupabase,
  isDevelopment: true
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set development mode for consistent testing
    vi.doMock('../config/supabase', () => ({
      supabase: mockSupabase,
      isDevelopment: true
    }));
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

    test('should successfully register a new user in development mode', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user_metadata: { name: 'Test User' }
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: 1234567890
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await AuthService.register(validRegisterData, '127.0.0.1', 'test-agent');

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validRegisterData.email,
        password: validRegisterData.password,
        options: {
          data: {
            name: validRegisterData.name
          }
        }
      });

      expect(result).toMatchObject({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        },
        session: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: 1234567890
        }
      });
    });

    test('should handle registration with invalid email format', async () => {
      const invalidData = { ...validRegisterData, email: 'invalid-email' };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' }
      });

      await expect(AuthService.register(invalidData)).rejects.toThrow('Registration failed: Invalid email format');
    });

    test('should handle registration with existing email', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      });

      await expect(AuthService.register(validRegisterData)).rejects.toThrow('Registration failed: User already registered');
    });

    test('should handle registration with weak password', async () => {
      const weakPasswordData = { ...validRegisterData, password: '123' };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password should be at least 6 characters' }
      });

      await expect(AuthService.register(weakPasswordData)).rejects.toThrow('Registration failed: Password should be at least 6 characters');
    });

    test('should handle missing fields', async () => {
      const incompleteData = { email: 'test@example.com' } as RegisterRequest;

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Missing required fields' }
      });

      await expect(AuthService.register(incompleteData)).rejects.toThrow('Registration failed: Missing required fields');
    });
  });

  describe('login', () => {
    const validLoginData: LoginRequest = {
      email: 'test@example.com',
      password: 'SecurePassword123!'
    };

    test('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user_metadata: { name: 'Test User' }
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: 1234567890
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await AuthService.login(validLoginData, '127.0.0.1', 'test-agent');

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validLoginData.email,
        password: validLoginData.password
      });

      expect(result).toMatchObject({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        },
        session: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: 1234567890
        }
      });
    });

    test('should handle login with incorrect password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      await expect(AuthService.login(validLoginData)).rejects.toThrow('Invalid credentials');
    });

    test('should handle login with unregistered email', async () => {
      const unregisteredData = { ...validLoginData, email: 'nonexistent@example.com' };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      await expect(AuthService.login(unregisteredData)).rejects.toThrow('Invalid credentials');
    });

    test('should handle login with missing fields', async () => {
      const incompleteData = { email: 'test@example.com' } as LoginRequest;

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Missing required fields' }
      });

      await expect(AuthService.login(incompleteData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('initiatePasswordRecovery', () => {
    const recoveryData: PasswordRecoveryRequest = {
      email: 'test@example.com'
    };

    test('should successfully initiate password recovery for registered email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      await expect(AuthService.initiatePasswordRecovery(recoveryData, '127.0.0.1', 'test-agent')).resolves.toBeUndefined();

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        recoveryData.email,
        {
          redirectTo: 'http://localhost:4200/auth/reset-password'
        }
      );
    });

    test('should handle recovery initiation with unregistered email', async () => {
      const unregisteredData = { email: 'nonexistent@example.com' };

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      // Even for unregistered emails, Supabase typically doesn't reveal if email exists
      await expect(AuthService.initiatePasswordRecovery(unregisteredData)).resolves.toBeUndefined();
    });

    test('should handle recovery service errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Service temporarily unavailable' }
      });

      await expect(AuthService.initiatePasswordRecovery(recoveryData)).rejects.toThrow('Password recovery failed: Service temporarily unavailable');
    });
  });

  describe('validateSession', () => {
    test('should return mock user in development mode', async () => {
      const result = await AuthService.validateSession('mock-token');

      expect(result).toMatchObject({
        id: 'mock-user-id',
        email: 'dev@example.com',
        name: 'Dev User'
      });
    });

    test('should validate session in production mode', async () => {
      // Temporarily mock production mode
      vi.doMock('../config/supabase', () => ({
        supabase: mockSupabase,
        isDevelopment: false
      }));

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user_metadata: { name: 'Test User' }
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Re-import to get updated mock
      const { AuthService: ProdAuthService } = await import('./auth.service');

      const result = await ProdAuthService.validateSession('valid-token');

      expect(result).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    test('should handle invalid session token', async () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        supabase: mockSupabase,
        isDevelopment: false
      }));

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      // Re-import to get updated mock
      const { AuthService: ProdAuthService } = await import('./auth.service');

      await expect(ProdAuthService.validateSession('invalid-token')).rejects.toThrow('Invalid session');
    });
  });
});