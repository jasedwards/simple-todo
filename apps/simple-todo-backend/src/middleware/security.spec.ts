/**
 * Security middleware unit tests
 * @description Tests for security middleware functions
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { enforceHTTPS, authMiddleware, sanitizeInput, errorHandler, rateLimitMiddleware } from './security';

// Mock config
vi.mock('../config/supabase', () => ({
  isDevelopment: true
}));

describe('Security Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: vi.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      secure: false,
      headers: {},
      url: '/test',
      ip: '127.0.0.1'
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('enforceHTTPS', () => {
    test('should skip HTTPS enforcement in development mode', () => {
      enforceHTTPS(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    test('should allow HTTPS requests through', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      mockRequest.secure = true;

      enforceHTTPS(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    test('should redirect HTTP to HTTPS in production', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      mockRequest.secure = false;
      mockRequest.headers = { host: 'example.com' };
      mockRequest.url = '/api/auth/login';

      enforceHTTPS(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith(301, 'https://example.com/api/auth/login');
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle x-forwarded-proto header for reverse proxies', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      mockRequest.secure = false;
      mockRequest.headers = { 'x-forwarded-proto': 'https' };

      enforceHTTPS(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe('authMiddleware', () => {
    test('should return 401 for missing authorization header', () => {
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid authorization format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should set mock user in development mode with valid token', () => {
      mockRequest.headers = { authorization: 'Bearer valid-token-123' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toEqual({
        id: 'mock-user-id',
        email: 'dev@example.com',
        name: 'Dev User'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should validate token in production mode', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      mockRequest.headers = { authorization: 'Bearer valid-token-123456' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toEqual({
        id: 'user-valid-to',
        email: 'user@example.com',
        name: 'Authenticated User'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 401 for invalid token format in production', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      mockRequest.headers = { authorization: 'Bearer short' }; // Too short

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid authorization token',
        code: 'INVALID_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize string inputs by trimming whitespace', () => {
      mockRequest.body = { email: '  test@example.com  ', name: '  John Doe  ' };
      mockRequest.query = { search: '  query  ' };
      mockRequest.params = { id: '  123  ' };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ email: 'test@example.com', name: 'John Doe' });
      expect(mockRequest.query).toEqual({ search: 'query' });
      expect(mockRequest.params).toEqual({ id: '123' });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should sanitize nested objects recursively', () => {
      mockRequest.body = {
        user: {
          profile: {
            name: '  John Doe  ',
            email: '  test@example.com  '
          }
        }
      };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        user: {
          profile: {
            name: 'John Doe',
            email: 'test@example.com'
          }
        }
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should sanitize arrays', () => {
      mockRequest.body = { tags: ['  tag1  ', '  tag2  '] };

      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ tags: ['tag1', 'tag2'] });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should preserve non-string values', () => {
      mockRequest.body = {
        count: 123,
        active: true,
        date: new Date('2023-01-01'),
        items: null
      };

      const originalBody = { ...mockRequest.body };
      sanitizeInput(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual(originalBody);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('rateLimitMiddleware', () => {
    test('should skip rate limiting in development mode', () => {
      const rateLimiter = rateLimitMiddleware(60000, 5); // 1 minute, 5 requests

      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should allow requests within rate limit in production', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      const rateLimiter = rateLimitMiddleware(60000, 5);

      // First request should pass
      rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should block requests exceeding rate limit in production', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      const rateLimiter = rateLimitMiddleware(60000, 2); // 1 minute, 2 requests max

      // Make 3 requests from same IP
      for (let i = 0; i < 3; i++) {
        rateLimiter(mockRequest as Request, mockResponse as Response, mockNext);
      }

      // Third request should be blocked
      expect(mockResponse.status).toHaveBeenLastCalledWith(429);
      expect(mockResponse.json).toHaveBeenLastCalledWith({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    });
  });

  describe('errorHandler', () => {
    const mockError = new Error('Test error');

    test('should handle ApiError with custom status and code', () => {
      const apiError = new Error('Validation failed');
      (apiError as any).name = 'ApiError';
      (apiError as any).statusCode = 400;
      (apiError as any).code = 'VALIDATION_ERROR';

      errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        stack: expect.any(String)
      });
    });

    test('should handle ValidationError', () => {
      const validationError = new Error('Invalid input');
      (validationError as any).name = 'ValidationError';

      errorHandler(validationError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
        stack: expect.any(String)
      });
    });

    test('should handle generic errors with 500 status', () => {
      const genericError = new Error('Something went wrong');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        stack: expect.any(String)
      });
    });

    test('should not include stack trace in production', () => {
      // Mock production mode
      vi.doMock('../config/supabase', () => ({
        isDevelopment: false
      }));

      const error = new Error('Test error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    });

    test('should handle already sent responses', () => {
      (mockResponse as any).headersSent = true;

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});