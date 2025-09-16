/**
 * Authentication service for Angular frontend
 * @description Handles authentication state and API communications using signals
 */

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  RegisterRequest,
  LoginRequest,
  PasswordRecoveryRequest,
  AuthResponse,
  User,
  ApiError
} from '@simple-todo/shared';
import { firstValueFrom } from 'rxjs';

/**
 * Authentication service interface for dependency injection
 * @interface AuthServiceInterface
 */
interface AuthServiceInterface {
  user: () => User | null;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  error: () => string | null;
}

/**
 * Authentication service
 * @service AuthService
 * @injectable
 * @description Centralized authentication management with signals-based reactive state
 * @implements {AuthServiceInterface}
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService implements AuthServiceInterface {
  /**
   * HTTP client for API communication
   * @private
   * @readonly
   */
  private readonly http = inject(HttpClient);

  /**
   * Router for navigation
   * @private
   * @readonly
   */
  private readonly router = inject(Router);

  /**
   * API base URL
   * @private
   * @readonly
   */
  private readonly API_URL = 'http://localhost:3000/api/auth';

  /**
   * Private user state signal
   * @private
   * @signal
   */
  private readonly _user = signal<User | null>(null);

  /**
   * Private loading state signal
   * @private
   * @signal
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Private error state signal
   * @private
   * @signal
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Private session token signal
   * @private
   * @signal
   */
  private readonly _token = signal<string | null>(null);

  /**
   * Public readonly user signal
   * @readonly
   * @signal
   * @description Current authenticated user
   */
  readonly user = this._user.asReadonly();

  /**
   * Public readonly loading signal
   * @readonly
   * @signal
   * @description Loading state for async operations
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Public readonly error signal
   * @readonly
   * @signal
   * @description Latest error message
   */
  readonly error = this._error.asReadonly();

  /**
   * Computed signal for authentication status
   * @computed
   * @readonly
   * @description True if user is authenticated
   */
  readonly isAuthenticated = computed(() =>
    this._user() !== null && this._token() !== null
  );

  /**
   * Computed signal for user display name
   * @computed
   * @readonly
   * @description Safe user display name with fallback
   */
  readonly userDisplayName = computed(() => {
    const user = this._user();
    if (!user) return null;
    return user.name || user.email.split('@')[0] || 'User';
  });

  /**
   * Constructor initializes the service
   * @constructor
   */
  constructor() {
    // Initialize from localStorage
    this.initializeFromStorage();

    // Set up token expiration checking
    this.setupTokenValidation();
  }

  /**
   * Initializes authentication state from localStorage
   * @private
   * @method initializeFromStorage
   * @description Restores user session from localStorage on service initialization
   */
  private initializeFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');

      if (storedUser && storedToken) {
        this._user.set(JSON.parse(storedUser));
        this._token.set(storedToken);
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Sets up token validation and expiration handling
   * @private
   * @method setupTokenValidation
   * @description Configures automatic token validation
   */
  private setupTokenValidation(): void {
    effect(() => {
      const token = this._token();
      if (token) {
        // In a real application, you would validate the token expiration
        // For this demo, we'll assume tokens are valid
        console.log('🔐 Auth token available');
      }
    });
  }

  /**
   * Stores authentication data in localStorage
   * @private
   * @method storeAuth
   * @description Persists user and token data
   * @param {User} user - User data to store
   * @param {string} token - Access token to store
   */
  private storeAuth(user: User, token: string): void {
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  /**
   * Clears stored authentication data
   * @private
   * @method clearStoredAuth
   * @description Removes all stored authentication data
   */
  private clearStoredAuth(): void {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  }

  /**
   * Handles HTTP errors and extracts user-friendly messages
   * @private
   * @method handleError
   * @description Processes HTTP errors and sets error state
   * @param {HttpErrorResponse} error - HTTP error response
   * @returns {string} User-friendly error message
   */
  private handleError(error: HttpErrorResponse): string {
    let message = 'An unexpected error occurred';

    if (error.error && typeof error.error === 'object') {
      message = error.error.message || message;
    } else if (error.message) {
      message = error.message;
    }

    this._error.set(message);
    return message;
  }

  /**
   * Registers a new user
   * @method register
   * @description Creates a new user account
   * @async
   * @param {RegisterRequest} userData - User registration data
   * @returns {Promise<User>} Promise resolving to user data
   * @throws {Error} Registration failure
   */
  async register(userData: RegisterRequest): Promise<User> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<{ data: AuthResponse }>(`${this.API_URL}/register`, userData)
      );

      const { user, session } = response.data;

      // Update signals
      this._user.set(user);
      this._token.set(session.accessToken);

      // Store in localStorage
      this.storeAuth(user, session.accessToken);

      console.log('✅ User registered successfully:', user.email);
      return user;

    } catch (error: any) {
      const errorMessage = this.handleError(error);
      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Authenticates user login
   * @method login
   * @description Logs in user with email and password
   * @async
   * @param {LoginRequest} credentials - Login credentials
   * @returns {Promise<User>} Promise resolving to user data
   * @throws {Error} Login failure
   */
  async login(credentials: LoginRequest): Promise<User> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<{ data: AuthResponse }>(`${this.API_URL}/login`, credentials)
      );

      const { user, session } = response.data;

      // Update signals
      this._user.set(user);
      this._token.set(session.accessToken);

      // Store in localStorage
      this.storeAuth(user, session.accessToken);

      console.log('✅ User logged in successfully:', user.email);
      return user;

    } catch (error: any) {
      const errorMessage = this.handleError(error);
      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Initiates password recovery
   * @method initiatePasswordRecovery
   * @description Sends password recovery email
   * @async
   * @param {PasswordRecoveryRequest} recoveryData - Recovery request data
   * @returns {Promise<void>}
   * @throws {Error} Recovery initiation failure
   */
  async initiatePasswordRecovery(recoveryData: PasswordRecoveryRequest): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/recover`, recoveryData)
      );

      console.log('✅ Password recovery initiated for:', recoveryData.email);

    } catch (error: any) {
      const errorMessage = this.handleError(error);
      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Logs out current user
   * @method logout
   * @description Clears user session and redirects to login
   * @async
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);

    try {
      const token = this._token();
      if (token) {
        // Call logout endpoint
        await firstValueFrom(
          this.http.post(`${this.API_URL}/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear state regardless of API success
      this._user.set(null);
      this._token.set(null);
      this._error.set(null);

      // Clear storage
      this.clearStoredAuth();

      this._isLoading.set(false);

      // Redirect to login
      await this.router.navigate(['/auth/login']);

      console.log('✅ User logged out successfully');
    }
  }

  /**
   * Gets current user profile
   * @method getProfile
   * @description Fetches current user profile from server
   * @async
   * @returns {Promise<User>} Promise resolving to user data
   * @throws {Error} Profile fetch failure
   */
  async getProfile(): Promise<User> {
    const token = this._token();
    if (!token) {
      throw new Error('No authentication token available');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<{ data: { user: User } }>(`${this.API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      const user = response.data.user;
      this._user.set(user);

      // Update stored user data
      this.storeAuth(user, token);

      return user;

    } catch (error: any) {
      const errorMessage = this.handleError(error);

      // If token is invalid, clear auth state
      if (error.status === 401) {
        this.clearAuth();
      }

      throw new Error(errorMessage);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clears authentication state
   * @method clearAuth
   * @description Clears all authentication state without API call
   */
  clearAuth(): void {
    this._user.set(null);
    this._token.set(null);
    this._error.set(null);
    this.clearStoredAuth();
  }

  /**
   * Clears error state
   * @method clearError
   * @description Clears current error message
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Checks if user has specific role or permission
   * @method hasPermission
   * @description Checks user permissions (placeholder for future implementation)
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this._user();
    if (!user) return false;

    // Placeholder for permission checking logic
    // In a real application, you would check user.roles or user.permissions
    return true;
  }
}