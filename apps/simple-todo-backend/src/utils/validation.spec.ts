/**
 * Validation utility unit tests
 * @description Tests for input validation functions
 */

import { describe, test, expect } from 'vitest';
import {
  validateRegistrationRequest,
  validateLoginRequest,
  validatePasswordRecoveryRequest,
  validatePasswordResetRequest
} from './validation';

describe('Validation Utilities', () => {
  describe('validateRegistration', () => {
    test('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'John Doe'
      };

      expect(() => validateRegistration(validData)).not.toThrow();
    });

    test('should throw error for invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'John Doe'
      };

      expect(() => validateRegistration(invalidData)).toThrow('Invalid email format');
    });

    test('should throw error for empty email', () => {
      const invalidData = {
        email: '',
        password: 'SecurePassword123!',
        name: 'John Doe'
      };

      expect(() => validateRegistration(invalidData)).toThrow('Email is required');
    });

    test('should throw error for missing email', () => {
      const invalidData = {
        password: 'SecurePassword123!',
        name: 'John Doe'
      } as any;

      expect(() => validateRegistration(invalidData)).toThrow('Email is required');
    });

    test('should throw error for weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        name: 'John Doe'
      };

      expect(() => validateRegistration(invalidData)).toThrow('Password must be at least 8 characters long');
    });

    test('should throw error for empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
        name: 'John Doe'
      };

      expect(() => validateRegistration(invalidData)).toThrow('Password is required');
    });

    test('should throw error for missing password', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe'
      } as any;

      expect(() => validateRegistration(invalidData)).toThrow('Password is required');
    });

    test('should throw error for empty name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: ''
      };

      expect(() => validateRegistration(invalidData)).toThrow('Name is required');
    });

    test('should throw error for missing name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      } as any;

      expect(() => validateRegistration(invalidData)).toThrow('Name is required');
    });

    test('should throw error for name that is too short', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'J'
      };

      expect(() => validateRegistration(invalidData)).toThrow('Name must be at least 2 characters long');
    });

    test('should throw error for name that is too long', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'A'.repeat(101) // 101 characters
      };

      expect(() => validateRegistration(invalidData)).toThrow('Name must be less than 100 characters');
    });

    test('should handle script injection attempts in name', () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: '<script>alert("hack")</script>'
      };

      expect(() => validateRegistration(maliciousData)).toThrow('Name contains invalid characters');
    });

    test('should handle SQL injection attempts in email', () => {
      const maliciousData = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'SecurePassword123!',
        name: 'John Doe'
      };

      expect(() => validateRegistration(maliciousData)).toThrow('Invalid email format');
    });

    test('should allow international characters in name', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'José María González'
      };

      expect(() => validateRegistration(validData)).not.toThrow();
    });
  });

  describe('validateLogin', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };

      expect(() => validateLogin(validData)).not.toThrow();
    });

    test('should throw error for invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePassword123!'
      };

      expect(() => validateLogin(invalidData)).toThrow('Invalid email format');
    });

    test('should throw error for empty email', () => {
      const invalidData = {
        email: '',
        password: 'SecurePassword123!'
      };

      expect(() => validateLogin(invalidData)).toThrow('Email is required');
    });

    test('should throw error for missing email', () => {
      const invalidData = {
        password: 'SecurePassword123!'
      } as any;

      expect(() => validateLogin(invalidData)).toThrow('Email is required');
    });

    test('should throw error for empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };

      expect(() => validateLogin(invalidData)).toThrow('Password is required');
    });

    test('should throw error for missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      } as any;

      expect(() => validateLogin(invalidData)).toThrow('Password is required');
    });

    test('should handle excessive length inputs', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'A'.repeat(1001) // 1001 characters
      };

      expect(() => validateLogin(invalidData)).toThrow('Password is too long');
    });

    test('should handle SQL injection attempts', () => {
      const maliciousData = {
        email: "admin@example.com' OR '1'='1",
        password: 'password'
      };

      expect(() => validateLogin(maliciousData)).toThrow('Invalid email format');
    });
  });

  describe('validatePasswordRecovery', () => {
    test('should validate correct recovery data', () => {
      const validData = {
        email: 'test@example.com'
      };

      expect(() => validatePasswordRecovery(validData)).not.toThrow();
    });

    test('should throw error for invalid email format', () => {
      const invalidData = {
        email: 'invalid-email'
      };

      expect(() => validatePasswordRecovery(invalidData)).toThrow('Invalid email format');
    });

    test('should throw error for empty email', () => {
      const invalidData = {
        email: ''
      };

      expect(() => validatePasswordRecovery(invalidData)).toThrow('Email is required');
    });

    test('should throw error for missing email', () => {
      const invalidData = {} as any;

      expect(() => validatePasswordRecovery(invalidData)).toThrow('Email is required');
    });

    test('should handle script injection attempts', () => {
      const maliciousData = {
        email: '<script>alert("hack")</script>@example.com'
      };

      expect(() => validatePasswordRecovery(maliciousData)).toThrow('Invalid email format');
    });

    test('should accept long but valid email addresses', () => {
      const validData = {
        email: 'verylongemailaddressthatisactuallystillvalid@reallylongdomainnamethatexists.com'
      };

      expect(() => validatePasswordRecovery(validData)).not.toThrow();
    });
  });

  describe('validatePasswordReset', () => {
    test('should validate correct reset data', () => {
      const validData = {
        token: 'valid-reset-token-1234567890',
        password: 'NewSecurePassword123!'
      };

      expect(() => validatePasswordReset(validData)).not.toThrow();
    });

    test('should throw error for empty token', () => {
      const invalidData = {
        token: '',
        password: 'NewSecurePassword123!'
      };

      expect(() => validatePasswordReset(invalidData)).toThrow('Reset token is required');
    });

    test('should throw error for missing token', () => {
      const invalidData = {
        password: 'NewSecurePassword123!'
      } as any;

      expect(() => validatePasswordReset(invalidData)).toThrow('Reset token is required');
    });

    test('should throw error for short token', () => {
      const invalidData = {
        token: 'short',
        password: 'NewSecurePassword123!'
      };

      expect(() => validatePasswordReset(invalidData)).toThrow('Invalid reset token format');
    });

    test('should throw error for weak password', () => {
      const invalidData = {
        token: 'valid-reset-token-1234567890',
        password: '123'
      };

      expect(() => validatePasswordReset(invalidData)).toThrow('Password must be at least 8 characters long');
    });

    test('should throw error for empty password', () => {
      const invalidData = {
        token: 'valid-reset-token-1234567890',
        password: ''
      };

      expect(() => validatePasswordReset(invalidData)).toThrow('Password is required');
    });

    test('should throw error for missing password', () => {
      const invalidData = {
        token: 'valid-reset-token-1234567890'
      } as any;

      expect(() => validatePasswordReset(invalidData)).toThrow('Password is required');
    });

    test('should handle malicious token content', () => {
      const maliciousData = {
        token: '<script>alert("hack")</script>',
        password: 'NewSecurePassword123!'
      };

      expect(() => validatePasswordReset(maliciousData)).toThrow('Invalid reset token format');
    });

    test('should handle excessively long token', () => {
      const invalidData = {
        token: 'A'.repeat(1001), // 1001 characters
        password: 'NewSecurePassword123!'
      };

      expect(() => validatePasswordReset(invalidData)).toThrow('Reset token is too long');
    });

    test('should handle excessive length password', () => {
      const invalidData = {
        token: 'valid-reset-token-1234567890',
        password: 'A'.repeat(1001) // 1001 characters
      };

      expect(() => validatePasswordReset(invalidData)).toThrow('Password is too long');
    });
  });
});