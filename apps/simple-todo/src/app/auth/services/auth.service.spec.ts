/**
 * Authentication service unit tests
 * @description Tests for Angular AuthService with signals
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, PasswordRecoveryRequest, AuthResponse } from '@simple-todo/shared';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthResponse: AuthResponse = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    session: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600000 // 1 hour from now
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Initialization', () => {
    test('should initialize with default state', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isLoading()).toBe(false);
      expect(service.user()).toBe(null);
      expect(service.error()).toBe(null);
    });

    test('should restore session from localStorage on initialization', () => {
      // Set up localStorage with mock session
      localStorage.setItem('simple-todo-auth', JSON.stringify({
        user: mockAuthResponse.user,
        session: mockAuthResponse.session
      }));

      // Create new service instance to trigger initialization
      const newService = TestBed.inject(AuthService);

      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.user()).toEqual(mockAuthResponse.user);
    });

    test('should not restore expired session from localStorage', () => {
      const expiredSession = {
        ...mockAuthResponse,
        session: {
          ...mockAuthResponse.session,
          expiresAt: Date.now() - 1000 // Expired 1 second ago
        }
      };

      localStorage.setItem('simple-todo-auth', JSON.stringify(expiredSession));

      const newService = TestBed.inject(AuthService);

      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.user()).toBe(null);
    });
  });

  describe('register', () => {
    const validRegisterData: RegisterRequest = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User'
    };

    test('should successfully register a new user', async () => {
      const registerPromise = service.register(validRegisterData);

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(validRegisterData);

      req.flush({
        message: 'User registered successfully',
        user: mockAuthResponse.user,
        session: mockAuthResponse.session
      });

      await registerPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.user()).toEqual(mockAuthResponse.user);
      expect(service.error()).toBe(null);

      // Check localStorage
      const storedAuth = JSON.parse(localStorage.getItem('simple-todo-auth') || '{}');
      expect(storedAuth.user).toEqual(mockAuthResponse.user);
      expect(storedAuth.session).toEqual(mockAuthResponse.session);
    });

    test('should handle registration failure with invalid email', async () => {
      const invalidData = { ...validRegisterData, email: 'invalid-email' };

      const registerPromise = service.register(invalidData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      req.flush(
        { message: 'Invalid email format', code: 'REGISTRATION_FAILED' },
        { status: 400, statusText: 'Bad Request' }
      );

      await expect(registerPromise).rejects.toThrow('Invalid email format');

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('Invalid email format');
    });

    test('should handle registration failure with existing email', async () => {
      const registerPromise = service.register(validRegisterData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      req.flush(
        { message: 'User already registered', code: 'REGISTRATION_FAILED' },
        { status: 409, statusText: 'Conflict' }
      );

      await expect(registerPromise).rejects.toThrow('User already registered');

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('User already registered');
    });

    test('should handle network errors during registration', async () => {
      const registerPromise = service.register(validRegisterData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      req.error(new ErrorEvent('Network error'));

      await expect(registerPromise).rejects.toThrow('Registration failed');

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('Registration failed');
    });
  });

  describe('login', () => {
    const validLoginData: LoginRequest = {
      email: 'test@example.com',
      password: 'SecurePassword123!'
    };

    test('should successfully login with valid credentials', async () => {
      const loginPromise = service.login(validLoginData);

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(validLoginData);

      req.flush({
        message: 'Login successful',
        user: mockAuthResponse.user,
        session: mockAuthResponse.session
      });

      await loginPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.user()).toEqual(mockAuthResponse.user);
      expect(service.error()).toBe(null);
    });

    test('should handle login failure with incorrect password', async () => {
      const invalidData = { ...validLoginData, password: 'wrongpassword' };

      const loginPromise = service.login(invalidData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(
        { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401, statusText: 'Unauthorized' }
      );

      await expect(loginPromise).rejects.toThrow('Invalid credentials');

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('Invalid credentials');
    });

    test('should handle login failure with unregistered email', async () => {
      const invalidData = { ...validLoginData, email: 'nonexistent@example.com' };

      const loginPromise = service.login(invalidData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(
        { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401, statusText: 'Unauthorized' }
      );

      await expect(loginPromise).rejects.toThrow('Invalid credentials');

      expect(service.isLoading()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('Invalid credentials');
    });

    test('should handle rate limiting errors', async () => {
      const loginPromise = service.login(validLoginData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(
        { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, statusText: 'Too Many Requests' }
      );

      await expect(loginPromise).rejects.toThrow('Too many requests. Please try again later.');

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('Too many requests. Please try again later.');
    });
  });

  describe('initiatePasswordRecovery', () => {
    const recoveryData: PasswordRecoveryRequest = {
      email: 'test@example.com'
    };

    test('should successfully initiate password recovery', async () => {
      const recoveryPromise = service.initiatePasswordRecovery(recoveryData);

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/recover');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(recoveryData);

      req.flush({
        message: 'Password recovery email sent successfully'
      });

      await recoveryPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(null);
    });

    test('should handle recovery for unregistered email gracefully', async () => {
      const unregisteredData = { email: 'nonexistent@example.com' };

      const recoveryPromise = service.initiatePasswordRecovery(unregisteredData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/recover');
      req.flush({
        message: 'Password recovery email sent successfully'
      });

      await recoveryPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(null);
    });

    test('should handle service errors during recovery', async () => {
      const recoveryPromise = service.initiatePasswordRecovery(recoveryData);

      const req = httpMock.expectOne('http://localhost:3000/api/auth/recover');
      req.flush(
        { message: 'Service temporarily unavailable', code: 'RECOVERY_FAILED' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      await expect(recoveryPromise).rejects.toThrow('Service temporarily unavailable');

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('Service temporarily unavailable');
    });
  });

  describe('logout', () => {
    test('should successfully logout and clear state', () => {
      // Set up authenticated state first
      localStorage.setItem('simple-todo-auth', JSON.stringify({
        user: mockAuthResponse.user,
        session: mockAuthResponse.session
      }));

      // Manually set authenticated state (simulating successful login)
      service['_user'].set(mockAuthResponse.user);
      service['_session'].set(mockAuthResponse.session);

      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.user()).toBe(null);
      expect(service.error()).toBe(null);
      expect(localStorage.getItem('simple-todo-auth')).toBe(null);
    });

    test('should handle logout when not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.user()).toBe(null);
    });
  });

  describe('clearError', () => {
    test('should clear error state', () => {
      // Set an error state first
      service['_error'].set('Some error message');
      expect(service.error()).toBe('Some error message');

      service.clearError();

      expect(service.error()).toBe(null);
    });
  });

  describe('Session Management', () => {
    test('should detect expired sessions', () => {
      const expiredSession = {
        ...mockAuthResponse.session,
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      // Set expired session
      service['_session'].set(expiredSession);
      service['_user'].set(mockAuthResponse.user);

      expect(service.isAuthenticated()).toBe(false);
    });

    test('should detect valid sessions', () => {
      const validSession = {
        ...mockAuthResponse.session,
        expiresAt: Date.now() + 3600000 // Valid for 1 hour
      };

      service['_session'].set(validSession);
      service['_user'].set(mockAuthResponse.user);

      expect(service.isAuthenticated()).toBe(true);
    });

    test('should handle localStorage corruption gracefully', () => {
      localStorage.setItem('simple-todo-auth', 'invalid-json');

      const newService = TestBed.inject(AuthService);

      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.user()).toBe(null);
      expect(localStorage.getItem('simple-todo-auth')).toBe(null);
    });
  });
});