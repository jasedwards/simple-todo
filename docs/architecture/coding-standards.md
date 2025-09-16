# Angular Coding Standards

## Overview

This document defines the coding standards for our Angular application, emphasizing modern Angular patterns with signals-based architecture, zoneless operation, and comprehensive documentation practices.

## Core Architectural Principles

### 1. Signals-Based Architecture

**MANDATORY**: All state management must use Angular Signals.

#### Component State
```typescript
/**
 * User profile component managing user data and preferences
 * @component UserProfileComponent
 * @description Displays and manages user profile information with real-time updates
 * @example
 * ```html
 * <app-user-profile
 *   [userId]="currentUserId()"
 *   (profileUpdate)="onProfileUpdate($event)">
 * </app-user-profile>
 * ```
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="user-profile" [class.loading]="isLoading()">
      @if (user(); as currentUser) {
        <div class="profile-content">
          <h2>{{ displayName() }}</h2>
          <p class="email">{{ currentUser.email }}</p>
          <div class="stats">
            <span>Tasks completed: {{ completedTasksCount() }}</span>
            <span>Member since: {{ currentUser.createdAt | date }}</span>
          </div>
          <button
            type="button"
            (click)="updateProfile()"
            [disabled]="isLoading()">
            {{ isLoading() ? 'Updating...' : 'Update Profile' }}
          </button>
        </div>
      } @else {
        <div class="no-user">
          <p>No user profile available</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  /**
   * Input signal for user ID
   * @input
   * @signal
   * @description User ID to load profile for
   */
  userId = input.required<string>();

  /**
   * Output event for profile updates
   * @output
   * @description Emitted when profile is successfully updated
   */
  profileUpdate = output<User>();

  /**
   * User data signal containing profile information
   * @signal
   * @readonly
   */
  user = signal<User | null>(null);

  /**
   * Loading state signal for async operations
   * @signal
   * @readonly
   */
  isLoading = signal<boolean>(false);

  /**
   * User's completed tasks count signal
   * @signal
   * @readonly
   */
  completedTasksCount = signal<number>(0);

  /**
   * Computed signal for user display name with fallback
   * @computed
   * @readonly
   * @returns {string} Formatted display name or default
   */
  displayName = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return 'Loading...';
    return currentUser.displayName || currentUser.name || 'Anonymous User';
  });

  /**
   * Computed signal for profile completeness percentage
   * @computed
   * @readonly
   * @returns {number} Profile completion percentage (0-100)
   */
  profileCompleteness = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return 0;

    let completedFields = 0;
    const totalFields = 5;

    if (currentUser.name) completedFields++;
    if (currentUser.email) completedFields++;
    if (currentUser.avatar) completedFields++;
    if (currentUser.bio) completedFields++;
    if (currentUser.preferences) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  });

  /**
   * User service for data management
   * @private
   * @readonly
   */
  private readonly userService = inject(UserService);

  /**
   * Task service for statistics
   * @private
   * @readonly
   */
  private readonly taskService = inject(TaskService);

  /**
   * Component initialization
   * @lifecycle OnInit
   */
  ngOnInit(): void {
    // React to userId changes and load profile
    effect(() => {
      const id = this.userId();
      if (id) {
        this.loadUserProfile(id);
      }
    });
  }

  /**
   * Loads user profile data
   * @method loadUserProfile
   * @description Fetches user profile and related statistics
   * @param {string} userId - User ID to load
   * @returns {Promise<void>}
   */
  private async loadUserProfile(userId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const [user, taskStats] = await Promise.all([
        this.userService.getUserById(userId),
        this.taskService.getUserTaskStats(userId)
      ]);

      this.user.set(user);
      this.completedTasksCount.set(taskStats.completed);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.user.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Updates user profile
   * @method updateProfile
   * @description Initiates profile update workflow
   * @returns {Promise<void>}
   */
  async updateProfile(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser || this.isLoading()) return;

    this.isLoading.set(true);
    try {
      const updatedUser = await this.userService.updateUser(currentUser.id, {
        lastLoginAt: new Date()
      });

      this.user.set(updatedUser);
      this.profileUpdate.emit(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

#### Service State Management
```typescript
/**
 * User service managing user data and authentication state
 * @service UserService
 * @injectable
 * @description Centralized user data management with signals-based reactive state
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * Private user state signal
   * @private
   * @signal
   * @type {WritableSignal<User | null>}
   */
  private readonly _user = signal<User | null>(null);

  /**
   * Private loading state signal
   * @private
   * @signal
   * @type {WritableSignal<boolean>}
   */
  private readonly _loading = signal<boolean>(false);

  /**
   * Private error state signal
   * @private
   * @signal
   * @type {WritableSignal<string | null>}
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Private users cache signal for performance
   * @private
   * @signal
   * @type {WritableSignal<Map<string, User>>}
   */
  private readonly _usersCache = signal<Map<string, User>>(new Map());

  /**
   * Public readonly user signal
   * @readonly
   * @signal
   * @description Current authenticated user
   * @returns {Signal<User | null>} Current user or null if not authenticated
   */
  readonly user = this._user.asReadonly();

  /**
   * Public readonly loading signal
   * @readonly
   * @signal
   * @description Loading state for async operations
   * @returns {Signal<boolean>} Current loading state
   */
  readonly loading = this._loading.asReadonly();

  /**
   * Public readonly error signal
   * @readonly
   * @signal
   * @description Latest error message
   * @returns {Signal<string | null>} Current error or null
   */
  readonly error = this._error.asReadonly();

  /**
   * Computed signal for authentication status
   * @computed
   * @readonly
   * @description Determines if user is authenticated
   * @returns {Signal<boolean>} True if user is authenticated
   */
  readonly isAuthenticated = computed(() => this._user() !== null);

  /**
   * Computed signal for user display information
   * @computed
   * @readonly
   * @description Safe user display data
   * @returns {Signal<{name: string, email: string, avatar?: string} | null>}
   */
  readonly userDisplay = computed(() => {
    const user = this._user();
    if (!user) return null;

    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      initials: this.getInitials(user.name)
    };
  });

  /**
   * Computed signal for user permissions
   * @computed
   * @readonly
   * @description User's current permissions set
   * @returns {Signal<Set<string>>} Set of user permissions
   */
  readonly userPermissions = computed(() => {
    const user = this._user();
    return new Set(user?.permissions || []);
  });

  /**
   * HTTP client for API communication
   * @private
   * @readonly
   * @type {HttpClient}
   */
  private readonly http = inject(HttpClient);

  /**
   * Router for navigation
   * @private
   * @readonly
   * @type {Router}
   */
  private readonly router = inject(Router);

  /**
   * Local storage service for persistence
   * @private
   * @readonly
   * @type {LocalStorageService}
   */
  private readonly storage = inject(LocalStorageService);

  constructor() {
    // Initialize user from stored session
    this.initializeFromStorage();

    // Set up automatic token refresh
    this.setupTokenRefresh();
  }

  /**
   * Initializes user state from local storage
   * @private
   * @method initializeFromStorage
   * @description Restores user session from storage on service initialization
   * @returns {void}
   */
  private initializeFromStorage(): void {
    const storedUser = this.storage.getItem('user');
    const token = this.storage.getItem('auth_token');

    if (storedUser && token) {
      this._user.set(JSON.parse(storedUser));
    }
  }

  /**
   * Sets up automatic token refresh mechanism
   * @private
   * @method setupTokenRefresh
   * @description Configures periodic token refresh for authenticated users
   * @returns {void}
   */
  private setupTokenRefresh(): void {
    effect(() => {
      const user = this._user();
      if (user) {
        // Set up token refresh timer
        this.scheduleTokenRefresh();
      }
    });
  }

  /**
   * Gets user initials for display
   * @private
   * @method getInitials
   * @description Generates user initials from full name
   * @param {string} name - User's full name
   * @returns {string} User initials (max 2 characters)
   */
  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Authenticates user with credentials
   * @method login
   * @description Authenticates user and stores session
   * @async
   * @param {LoginCredentials} credentials - User login credentials
   * @returns {Promise<User>} Promise resolving to authenticated user
   * @throws {Error} Authentication failure
   */
  async login(credentials: LoginCredentials): Promise<User> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>('/api/auth/login', credentials)
      );

      const { user, token } = response;

      // Update signals
      this._user.set(user);

      // Store in localStorage
      this.storage.setItem('user', JSON.stringify(user));
      this.storage.setItem('auth_token', token);

      // Add to cache
      this._usersCache.update(cache => new Map(cache.set(user.id, user)));

      return user;
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Login failed';
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
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
    this._loading.set(true);

    try {
      await firstValueFrom(
        this.http.post('/api/auth/logout', {})
      );
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear state regardless of API success
      this._user.set(null);
      this._error.set(null);

      // Clear storage
      this.storage.removeItem('user');
      this.storage.removeItem('auth_token');

      // Clear cache
      this._usersCache.set(new Map());

      this._loading.set(false);

      // Redirect to login
      await this.router.navigate(['/login']);
    }
  }

  /**
   * Gets user by ID with caching
   * @method getUserById
   * @description Retrieves user by ID with intelligent caching
   * @async
   * @param {string} userId - User ID to retrieve
   * @returns {Promise<User>} Promise resolving to user data
   * @throws {Error} User not found or fetch failed
   */
  async getUserById(userId: string): Promise<User> {
    // Check cache first
    const cachedUser = this._usersCache().get(userId);
    if (cachedUser) {
      return cachedUser;
    }

    this._loading.set(true);
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`/api/users/${userId}`)
      );

      // Update cache
      this._usersCache.update(cache => new Map(cache.set(userId, user)));

      return user;
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Failed to load user';
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Updates current user data
   * @method updateUser
   * @description Updates user profile information
   * @async
   * @param {string} userId - User ID to update
   * @param {Partial<User>} updates - User data updates
   * @returns {Promise<User>} Promise resolving to updated user
   * @throws {Error} Update failed
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const updatedUser = await firstValueFrom(
        this.http.patch<User>(`/api/users/${userId}`, updates)
      );

      // Update current user if it's the same
      const currentUser = this._user();
      if (currentUser && currentUser.id === userId) {
        this._user.set(updatedUser);
        this.storage.setItem('user', JSON.stringify(updatedUser));
      }

      // Update cache
      this._usersCache.update(cache => new Map(cache.set(userId, updatedUser)));

      return updatedUser;
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Failed to update user';
      this._error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Checks if user has specific permission
   * @method hasPermission
   * @description Checks if current user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission: string): boolean {
    return this.userPermissions().has(permission);
  }

  /**
   * Refreshes current user data
   * @method refreshUser
   * @description Fetches latest user data from server
   * @async
   * @returns {Promise<void>}
   */
  async refreshUser(): Promise<void> {
    const currentUser = this._user();
    if (!currentUser) return;

    try {
      const refreshedUser = await this.getUserById(currentUser.id);
      this._user.set(refreshedUser);
      this.storage.setItem('user', JSON.stringify(refreshedUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }

  /**
   * Schedules token refresh
   * @private
   * @method scheduleTokenRefresh
   * @description Sets up automatic token refresh timer
   * @returns {void}
   */
  private scheduleTokenRefresh(): void {
    // Implementation would include JWT token expiry checking
    // and automatic refresh logic
  }
}
```

### 2. Zoneless Angular Configuration

**MANDATORY**: The application must run in zoneless mode for optimal performance.

#### Bootstrap Configuration
```typescript
/**
 * Application bootstrap configuration with zoneless setup
 * @description Main application entry point with zoneless Angular configuration
 * @file main.ts
 * @since 1.0.0
 */
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideExperimentalZonelessChangeDetection,
  provideEnvironment,
  ChangeDetectionStrategy
} from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';
import { environment } from './environments/environment';

/**
 * Application configuration interface
 * @interface AppConfig
 * @description Configuration object for application providers
 */
interface AppConfig {
  providers: Array<any>;
  enableProfiling?: boolean;
  enableDevtools?: boolean;
}

/**
 * Creates application configuration for zoneless mode
 * @function createAppConfig
 * @description Builds comprehensive application configuration optimized for zoneless operation
 * @returns {AppConfig} Complete application configuration
 */
function createAppConfig(): AppConfig {
  const config: AppConfig = {
    providers: [
      // CRITICAL: Enable zoneless change detection first
      provideExperimentalZonelessChangeDetection(),

      // Router configuration optimized for zoneless
      provideRouter(
        routes,
        withHashLocation(), // Better performance for SPAs
        withInMemoryScrolling({
          anchorScrolling: 'enabled',
          scrollPositionRestoration: 'enabled'
        })
      ),

      // HTTP client with optimized interceptors
      provideHttpClient(
        withFetch(), // Use fetch API for better performance
        withInterceptors([
          authInterceptor,
          errorInterceptor
        ])
      ),

      // Animations with reduced motion support
      provideAnimations(),

      // Environment-specific providers
      provideEnvironment(environment),
    ],
    enableProfiling: !environment.production,
    enableDevtools: !environment.production
  };

  // Add service worker in production
  if (environment.production) {
    config.providers.push(
      provideServiceWorker('ngsw-worker.js', {
        enabled: true,
        registrationStrategy: 'registerWhenStable:30000'
      })
    );
  }

  // Add development tools in dev mode
  if (!environment.production && config.enableDevtools) {
    // Add any development-specific providers
    console.log('🔧 Development mode: Enhanced debugging enabled');
  }

  return config;
}

/**
 * Bootstrap the Angular application with zoneless change detection
 * @function main
 * @description Application entry point with comprehensive error handling
 * @async
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  try {
    const config = createAppConfig();

    console.log('🚀 Starting Angular application in zoneless mode');

    const appRef = await bootstrapApplication(AppComponent, config);

    // Configure global error handling for zoneless mode
    setupGlobalErrorHandling(appRef);

    // Log successful startup
    console.log('✅ Application started successfully');
    console.log('📊 Zoneless change detection active');

    if (!environment.production) {
      console.log('🔍 Development tools available');
      // Make app reference available for debugging
      (window as any).ngApp = appRef;
    }

  } catch (error) {
    console.error('❌ Failed to start application:', error);

    // Show user-friendly error page
    showStartupError(error);
  }
}

/**
 * Sets up global error handling optimized for zoneless mode
 * @function setupGlobalErrorHandling
 * @description Configures comprehensive error handling without Zone.js
 * @param {ApplicationRef} appRef - Application reference
 * @returns {void}
 */
function setupGlobalErrorHandling(appRef: any): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    // In zoneless mode, we need to manually trigger change detection if needed
    // However, with signals, this is typically not necessary
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error);
  });

  // Angular error handler integration
  const injector = appRef.injector;
  const errorHandler = injector.get(ErrorHandler);

  // Override default error handler behavior for zoneless mode
  const originalHandleError = errorHandler.handleError;
  errorHandler.handleError = function(error: any): void {
    originalHandleError.call(this, error);

    // Custom error reporting logic here
    if (environment.production) {
      // Send to error reporting service
      // reportErrorToService(error);
    }
  };
}

/**
 * Shows startup error to user
 * @function showStartupError
 * @description Displays user-friendly startup error
 * @param {Error} error - Startup error
 * @returns {void}
 */
function showStartupError(error: any): void {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #333;
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
    ">
      <h1 style="color: #dc3545; margin-bottom: 16px;">Application Failed to Start</h1>
      <p style="margin-bottom: 20px; max-width: 600px;">We apologize for the inconvenience. Please refresh the page or try again later.</p>
      <button
        onclick="window.location.reload()"
        style="
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        "
      >
        Refresh Page
      </button>
      ${!environment.production ? `<details style="margin-top: 20px; text-align: left;"><summary>Error Details (Development)</summary><pre style="color: #dc3545; white-space: pre-wrap;">${error.stack || error.message}</pre></details>` : ''}
    </div>
  `;
}

// Start the application
main();
```

#### Component Change Detection
```typescript
/**
 * Component optimized for zoneless operation
 * @component OptimizedComponent
 * @description Example component demonstrating zoneless patterns with comprehensive signal usage
 */
@Component({
  selector: 'app-optimized',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="optimized-component">
      <!-- Signal-based data display -->
      <div class="data-section">
        <h3>Current Data</h3>
        <p>{{ data() }}</p>
        <p class="update-count">Updates: {{ updateCount() }}</p>
        <p class="last-updated">Last updated: {{ lastUpdated() | date:'medium' }}</p>
      </div>

      <!-- Controls section -->
      <div class="controls">
        <input
          type="text"
          [(ngModel)]="inputValue"
          (input)="onInputChange($event)"
          placeholder="Enter new data"
          [disabled]="isProcessing()">

        <button
          type="button"
          (click)="updateData()"
          [disabled]="isProcessing() || !inputValue().trim()">
          {{ isProcessing() ? 'Processing...' : 'Update Data' }}
        </button>

        <button
          type="button"
          (click)="resetData()"
          [disabled]="isProcessing()">
          Reset
        </button>
      </div>

      <!-- Status indicators -->
      <div class="status" [class.processing]="isProcessing()">
        @if (isProcessing()) {
          <div class="spinner">Processing...</div>
        }

        @if (hasError(); as error) {
          <div class="error">{{ error }}</div>
        }

        @if (successMessage(); as message) {
          <div class="success">{{ message }}</div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./optimized.component.scss']
})
export class OptimizedComponent implements OnInit, OnDestroy {
  /**
   * Component data signal
   * @signal
   * @readonly
   */
  data = signal<string>('Initial data');

  /**
   * Input value signal for two-way binding
   * @signal
   * @readonly
   */
  inputValue = signal<string>('');

  /**
   * Update counter signal
   * @signal
   * @readonly
   */
  updateCount = signal<number>(0);

  /**
   * Last updated timestamp signal
   * @signal
   * @readonly
   */
  lastUpdated = signal<Date>(new Date());

  /**
   * Processing state signal
   * @signal
   * @readonly
   */
  isProcessing = signal<boolean>(false);

  /**
   * Error state signal
   * @signal
   * @readonly
   */
  hasError = signal<string | null>(null);

  /**
   * Success message signal
   * @signal
   * @readonly
   */
  successMessage = signal<string | null>(null);

  /**
   * Computed signal for data validation
   * @computed
   * @readonly
   * @returns {boolean} True if current data is valid
   */
  isDataValid = computed(() => {
    const currentData = this.data();
    return currentData.length > 0 && currentData.trim().length > 3;
  });

  /**
   * Computed signal for input validation
   * @computed
   * @readonly
   * @returns {boolean} True if input value is valid
   */
  isInputValid = computed(() => {
    const input = this.inputValue().trim();
    return input.length >= 3 && input.length <= 100;
  });

  /**
   * Computed signal for component state summary
   * @computed
   * @readonly
   * @returns {ComponentState} Current component state
   */
  componentState = computed((): ComponentState => {
    return {
      hasData: this.data().length > 0,
      isValid: this.isDataValid(),
      canUpdate: this.isInputValid() && !this.isProcessing(),
      hasChanges: this.inputValue() !== this.data(),
      errorCount: this.hasError() ? 1 : 0
    };
  });

  /**
   * Effect cleanup function
   * @private
   */
  private cleanupEffects?: () => void;

  /**
   * Component initialization
   * @lifecycle OnInit
   */
  ngOnInit(): void {
    // Set up reactive effects
    this.setupEffects();

    // Initialize with default input value
    this.inputValue.set(this.data());
  }

  /**
   * Component cleanup
   * @lifecycle OnDestroy
   */
  ngOnDestroy(): void {
    this.cleanupEffects?.();
  }

  /**
   * Sets up reactive effects for the component
   * @private
   * @method setupEffects
   * @description Configures reactive behaviors using Angular effects
   * @returns {void}
   */
  private setupEffects(): void {
    // Auto-clear success messages after 3 seconds
    const successEffect = effect(() => {
      const message = this.successMessage();
      if (message) {
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      }
    });

    // Auto-clear error messages after 5 seconds
    const errorEffect = effect(() => {
      const error = this.hasError();
      if (error) {
        setTimeout(() => {
          this.hasError.set(null);
        }, 5000);
      }
    });

    // Log state changes in development
    const debugEffect = effect(() => {
      if (!environment.production) {
        console.log('Component state changed:', this.componentState());
      }
    });

    // Cleanup function
    this.cleanupEffects = () => {
      successEffect.destroy();
      errorEffect.destroy();
      debugEffect.destroy();
    };
  }

  /**
   * Handles input change events
   * @method onInputChange
   * @description Updates input value signal from input events
   * @param {Event} event - Input change event
   * @returns {void}
   */
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inputValue.set(target.value);

    // Clear any existing error messages when user types
    if (this.hasError()) {
      this.hasError.set(null);
    }
  }

  /**
   * Updates component data with validation and error handling
   * @method updateData
   * @description Updates the data signal with comprehensive validation
   * @async
   * @returns {Promise<void>}
   */
  async updateData(): Promise<void> {
    const newValue = this.inputValue().trim();

    // Validation
    if (!this.isInputValid()) {
      this.hasError.set('Input must be between 3 and 100 characters');
      return;
    }

    this.isProcessing.set(true);
    this.hasError.set(null);
    this.successMessage.set(null);

    try {
      // Simulate async operation (API call, etc.)
      await this.delay(1000);

      // In zoneless mode, signal updates automatically trigger change detection
      this.data.set(newValue);
      this.updateCount.update(count => count + 1);
      this.lastUpdated.set(new Date());

      // Show success message
      this.successMessage.set('Data updated successfully!');

      // Clear input after successful update
      this.inputValue.set('');

    } catch (error) {
      this.hasError.set('Failed to update data. Please try again.');
      console.error('Update failed:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Resets component data to initial state
   * @method resetData
   * @description Resets all component data to initial values
   * @returns {void}
   */
  resetData(): void {
    this.data.set('Initial data');
    this.inputValue.set('');
    this.updateCount.set(0);
    this.lastUpdated.set(new Date());
    this.hasError.set(null);
    this.successMessage.set('Data reset to initial state');
  }

  /**
   * Utility method for creating delays
   * @private
   * @method delay
   * @description Creates a promise that resolves after specified milliseconds
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>}
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Component state interface
 * @interface ComponentState
 * @description Represents the current state of the optimized component
 */
interface ComponentState {
  hasData: boolean;
  isValid: boolean;
  canUpdate: boolean;
  hasChanges: boolean;
  errorCount: number;
}
```

## JSDoc Documentation Standards

### 1. Component Documentation

**MANDATORY**: All components must have comprehensive JSDoc documentation.

```typescript
/**
 * Advanced task list component with signals-based architecture
 * @component TaskListComponent
 * @description Displays and manages tasks with real-time updates, filtering, and sorting capabilities.
 * Uses Angular signals for reactive state management and zoneless change detection optimization.
 * @example
 * ```html
 * <app-task-list
 *   [initialTasks]="tasks()"
 *   [filter]="currentFilter()"
 *   [sortBy]="sortPreference()"
 *   (taskUpdate)="onTaskUpdate($event)"
 *   (taskDelete)="onTaskDelete($event)"
 *   (filterChange)="onFilterChange($event)"
 *   (sortChange)="onSortChange($event)">
 * </app-task-list>
 * ```
 * @signals
 * - `tasks`: Internal task list state
 * - `filter`: Current filter state
 * - `sortBy`: Current sort preference
 * - `isLoading`: Loading state for async operations
 * - `filteredTasks`: Computed filtered and sorted tasks
 * - `taskStats`: Computed task statistics
 * @since 1.0.0
 * @author Development Team
 * @version 2.0.0
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TaskItemComponent, TaskFilterComponent, TaskStatsComponent],
  template: `
    <div class="task-list-container">
      <!-- Header with stats and controls -->
      <header class="task-list-header">
        <app-task-stats [stats]="taskStats()"></app-task-stats>
        <app-task-filter
          [currentFilter]="filter()"
          [sortBy]="sortBy()"
          (filterChange)="onFilterUpdate($event)"
          (sortChange)="onSortUpdate($event)">
        </app-task-filter>
      </header>

      <!-- Task list with loading state -->
      <main class="task-list-content" [class.loading]="isLoading()">
        @if (isLoading()) {
          <div class="loading-indicator" role="status" aria-label="Loading tasks">
            <span class="sr-only">Loading tasks...</span>
          </div>
        } @else if (filteredTasks().length === 0) {
          <div class="empty-state">
            <p>No tasks found for current filter.</p>
            @if (filter() !== 'all') {
              <button type="button" (click)="clearFilter()">Show all tasks</button>
            }
          </div>
        } @else {
          <ul class="task-list" role="list">
            @for (task of filteredTasks(); track task.id) {
              <li>
                <app-task-item
                  [task]="task"
                  [isEditing]="editingTaskId() === task.id"
                  (toggle)="onTaskToggle(task)"
                  (delete)="onTaskDelete(task.id)"
                  (edit)="onTaskEdit(task)"
                  (save)="onTaskSave($event)"
                  (cancel)="onEditCancel()">
                </app-task-item>
              </li>
            }
          </ul>
        }
      </main>
    </div>
  `,
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  /**
   * Input signal for initial task list data
   * @input
   * @signal
   * @description Initial array of tasks to populate the list
   * @type {InputSignal<Task[]>}
   * @default []
   */
  initialTasks = input<Task[]>([]);

  /**
   * Input signal for filter configuration
   * @input
   * @signal
   * @description Current filter to apply to task list
   * @type {InputSignal<TaskFilter>}
   * @default 'all'
   */
  filter = input<TaskFilter>('all');

  /**
   * Input signal for sort preference
   * @input
   * @signal
   * @description Current sort preference for task ordering
   * @type {InputSignal<TaskSort>}
   * @default { field: 'createdAt', direction: 'desc' }
   */
  sortBy = input<TaskSort>({ field: 'createdAt', direction: 'desc' });

  /**
   * Output event emitter for task updates
   * @output
   * @description Emitted when a task is updated with the modified task data
   * @type {OutputEmitterRef<Task>}
   * @emits Task - Updated task object
   */
  taskUpdate = output<Task>();

  /**
   * Output event emitter for task deletion
   * @output
   * @description Emitted when a task is deleted with the task ID
   * @type {OutputEmitterRef<string>}
   * @emits string - ID of deleted task
   */
  taskDelete = output<string>();

  /**
   * Output event emitter for filter changes
   * @output
   * @description Emitted when filter preference changes
   * @type {OutputEmitterRef<TaskFilter>}
   * @emits TaskFilter - New filter value
   */
  filterChange = output<TaskFilter>();

  /**
   * Output event emitter for sort changes
   * @output
   * @description Emitted when sort preference changes
   * @type {OutputEmitterRef<TaskSort>}
   * @emits TaskSort - New sort configuration
   */
  sortChange = output<TaskSort>();

  /**
   * Internal task list signal
   * @signal
   * @private
   * @description Manages the internal state of all tasks
   * @type {WritableSignal<Task[]>}
   */
  private readonly _tasks = signal<Task[]>([]);

  /**
   * Public readonly tasks signal
   * @signal
   * @readonly
   * @description Exposes current task list state
   * @type {Signal<Task[]>}
   * @returns {Signal<Task[]>} Current tasks array
   */
  readonly tasks = this._tasks.asReadonly();

  /**
   * Loading state signal
   * @signal
   * @description Indicates if the component is performing async operations
   * @type {WritableSignal<boolean>}
   * @default false
   */
  isLoading = signal<boolean>(false);

  /**
   * Editing task ID signal
   * @signal
   * @description Tracks which task is currently being edited
   * @type {WritableSignal<string | null>}
   * @default null
   */
  editingTaskId = signal<string | null>(null);

  /**
   * Error state signal
   * @signal
   * @description Holds any error messages from operations
   * @type {WritableSignal<string | null>}
   * @default null
   */
  errorMessage = signal<string | null>(null);

  /**
   * Computed signal for filtered and sorted tasks
   * @computed
   * @readonly
   * @description Automatically filters and sorts tasks based on current preferences
   * @type {Signal<Task[]>}
   * @returns {Signal<Task[]>} Filtered and sorted task array
   * @dependency tasks - Source task list
   * @dependency filter - Current filter preference
   * @dependency sortBy - Current sort preference
   */
  filteredTasks = computed(() => {
    const allTasks = this._tasks();
    const currentFilter = this.filter();
    const currentSort = this.sortBy();

    // Apply filter
    let filtered: Task[];
    switch (currentFilter) {
      case 'completed':
        filtered = allTasks.filter(task => task.completed);
        break;
      case 'pending':
        filtered = allTasks.filter(task => !task.completed);
        break;
      case 'overdue':
        filtered = allTasks.filter(task =>
          task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
        );
        break;
      case 'priority':
        filtered = allTasks.filter(task =>
          task.priority && ['high', 'critical'].includes(task.priority)
        );
        break;
      default:
        filtered = allTasks;
    }

    // Apply sort
    return filtered.sort((a, b) => {
      const aValue = a[currentSort.field];
      const bValue = b[currentSort.field];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return currentSort.direction === 'asc' ? comparison : -comparison;
    });
  });

  /**
   * Computed signal for task statistics
   * @computed
   * @readonly
   * @description Calculates comprehensive task statistics
   * @type {Signal<TaskStats>}
   * @returns {Signal<TaskStats>} Task statistics object
   * @dependency tasks - Source task list for calculations
   */
  taskStats = computed((): TaskStats => {
    const allTasks = this._tasks();
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = allTasks.filter(task =>
      task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
    ).length;
    const highPriority = allTasks.filter(task =>
      task.priority && ['high', 'critical'].includes(task.priority)
    ).length;

    return {
      total,
      completed,
      pending,
      overdue,
      highPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  /**
   * Computed signal for component accessibility state
   * @computed
   * @readonly
   * @description Provides accessibility information for screen readers
   * @type {Signal<AccessibilityState>}
   * @returns {Signal<AccessibilityState>} Accessibility state object
   */
  accessibilityState = computed((): AccessibilityState => {
    const stats = this.taskStats();
    const filtered = this.filteredTasks();
    const isLoading = this.isLoading();

    return {
      ariaLabel: `Task list with ${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'}`,
      ariaDescription: `${stats.completed} completed, ${stats.pending} pending${stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''}`,
      ariaBusy: isLoading,
      liveRegionText: isLoading ? 'Loading tasks...' : `${filtered.length} tasks displayed`
    };
  });

  /**
   * Task service dependency
   * @private
   * @readonly
   * @description Service for task data operations
   * @type {TaskService}
   */
  private readonly taskService = inject(TaskService);

  /**
   * Component initialization
   * @lifecycle OnInit
   * @description Sets up reactive effects and initializes component state
   * @returns {void}
   */
  ngOnInit(): void {
    // Initialize tasks from input
    effect(() => {
      const initial = this.initialTasks();
      if (initial.length > 0) {
        this._tasks.set([...initial]);
      }
    });

    // Set up error handling effect
    effect(() => {
      const error = this.errorMessage();
      if (error) {
        console.error('Task list error:', error);
        // Auto-clear error after 5 seconds
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  /**
   * Component cleanup
   * @lifecycle OnDestroy
   * @description Performs cleanup operations
   * @returns {void}
   */
  ngOnDestroy(): void {
    // Cleanup is automatic with signals and effects
  }

  /**
   * Handles task status toggle with optimistic updates
   * @method onTaskToggle
   * @description Toggles task completion status with optimistic UI updates
   * @param {Task} task - The task to toggle
   * @returns {Promise<void>}
   * @emits taskUpdate - Emitted with updated task data on success
   * @async
   */
  async onTaskToggle(task: Task): Promise<void> {
    const originalCompleted = task.completed;
    const updatedTask = { ...task, completed: !task.completed, updatedAt: new Date() };

    // Optimistic update
    this._tasks.update(tasks =>
      tasks.map(t => t.id === task.id ? updatedTask : t)
    );

    try {
      const serverTask = await this.taskService.updateTask(task.id, {
        completed: updatedTask.completed,
        updatedAt: updatedTask.updatedAt
      });

      // Update with server response
      this._tasks.update(tasks =>
        tasks.map(t => t.id === task.id ? serverTask : t)
      );

      this.taskUpdate.emit(serverTask);
    } catch (error) {
      // Revert optimistic update on error
      this._tasks.update(tasks =>
        tasks.map(t => t.id === task.id ? { ...t, completed: originalCompleted } : t)
      );
      this.errorMessage.set('Failed to update task. Please try again.');
    }
  }

  /**
   * Handles task deletion with confirmation
   * @method onTaskDelete
   * @description Removes a task with user confirmation
   * @param {string} taskId - ID of the task to delete
   * @returns {Promise<void>}
   * @emits taskDelete - Emitted with task ID on successful deletion
   * @async
   */
  async onTaskDelete(taskId: string): Promise<void> {
    const task = this._tasks().find(t => t.id === taskId);
    if (!task) return;

    // Optional: Show confirmation dialog
    const confirmed = await this.confirmDeletion(task.title);
    if (!confirmed) return;

    this.isLoading.set(true);

    try {
      await this.taskService.deleteTask(taskId);

      // Remove from local state
      this._tasks.update(tasks => tasks.filter(t => t.id !== taskId));

      this.taskDelete.emit(taskId);
    } catch (error) {
      this.errorMessage.set('Failed to delete task. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handles filter updates
   * @method onFilterUpdate
   * @description Updates the current filter and emits change event
   * @param {TaskFilter} newFilter - New filter value
   * @returns {void}
   * @emits filterChange - Emitted with new filter value
   */
  onFilterUpdate(newFilter: TaskFilter): void {
    this.filterChange.emit(newFilter);
  }

  /**
   * Handles sort updates
   * @method onSortUpdate
   * @description Updates the current sort preference and emits change event
   * @param {TaskSort} newSort - New sort configuration
   * @returns {void}
   * @emits sortChange - Emitted with new sort configuration
   */
  onSortUpdate(newSort: TaskSort): void {
    this.sortChange.emit(newSort);
  }

  /**
   * Clears current filter
   * @method clearFilter
   * @description Resets filter to show all tasks
   * @returns {void}
   * @emits filterChange - Emitted with 'all' filter value
   */
  clearFilter(): void {
    this.filterChange.emit('all');
  }

  /**
   * Initiates task editing
   * @method onTaskEdit
   * @description Sets a task into edit mode
   * @param {Task} task - Task to edit
   * @returns {void}
   */
  onTaskEdit(task: Task): void {
    this.editingTaskId.set(task.id);
  }

  /**
   * Saves task edits
   * @method onTaskSave
   * @description Saves edited task data
   * @param {Task} updatedTask - Updated task data
   * @returns {Promise<void>}
   * @async
   */
  async onTaskSave(updatedTask: Task): Promise<void> {
    this.isLoading.set(true);

    try {
      const serverTask = await this.taskService.updateTask(updatedTask.id, updatedTask);

      this._tasks.update(tasks =>
        tasks.map(t => t.id === updatedTask.id ? serverTask : t)
      );

      this.editingTaskId.set(null);
      this.taskUpdate.emit(serverTask);
    } catch (error) {
      this.errorMessage.set('Failed to save task changes.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cancels task editing
   * @method onEditCancel
   * @description Cancels current edit operation
   * @returns {void}
   */
  onEditCancel(): void {
    this.editingTaskId.set(null);
  }

  /**
   * Shows confirmation dialog for task deletion
   * @private
   * @method confirmDeletion
   * @description Shows user confirmation for destructive actions
   * @param {string} taskTitle - Title of task being deleted
   * @returns {Promise<boolean>} User confirmation result
   * @async
   */
  private async confirmDeletion(taskTitle: string): Promise<boolean> {
    return confirm(`Are you sure you want to delete "${taskTitle}"?`);
  }
}

/**
 * Task statistics interface
 * @interface TaskStats
 * @description Statistics about task completion and status
 */
interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
  completionRate: number;
}

/**
 * Accessibility state interface
 * @interface AccessibilityState
 * @description Accessibility information for screen readers
 */
interface AccessibilityState {
  ariaLabel: string;
  ariaDescription: string;
  ariaBusy: boolean;
  liveRegionText: string;
}
```

### 2. Service Documentation

**MANDATORY**: All services must document their purpose, methods, and state management.

```typescript
/**
 * Task management service
 * @service TaskService
 * @injectable
 * @description Centralized service for managing task data with signals-based reactive state
 * @since 1.0.0
 * @author Development Team
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  /**
   * Private tasks state signal
   * @private
   * @signal
   * @type {WritableSignal<Task[]>}
   */
  private readonly _tasks = signal<Task[]>([]);

  /**
   * Private loading state signal
   * @private
   * @signal
   * @type {WritableSignal<boolean>}
   */
  private readonly _loading = signal<boolean>(false);

  /**
   * Public readonly tasks signal
   * @readonly
   * @signal
   * @description Observable array of all tasks
   * @type {Signal<Task[]>}
   * @returns {Signal<Task[]>} Current tasks array
   */
  readonly tasks = this._tasks.asReadonly();

  /**
   * Public readonly loading signal
   * @readonly
   * @signal
   * @description Loading state for async operations
   * @type {Signal<boolean>}
   * @returns {Signal<boolean>} Current loading state
   */
  readonly loading = this._loading.asReadonly();

  /**
   * Computed signal for completed tasks count
   * @computed
   * @readonly
   * @description Calculates number of completed tasks
   * @type {Signal<number>}
   * @returns {Signal<number>} Count of completed tasks
   */
  readonly completedCount = computed(() =>
    this._tasks().filter(task => task.completed).length
  );

  /**
   * Computed signal for pending tasks
   * @computed
   * @readonly
   * @description Filters tasks to show only incomplete ones
   * @type {Signal<Task[]>}
   * @returns {Signal<Task[]>} Array of incomplete tasks
   */
  readonly pendingTasks = computed(() =>
    this._tasks().filter(task => !task.completed)
  );

  /**
   * HTTP client for API communication
   * @private
   * @readonly
   * @type {HttpClient}
   */
  private readonly http = inject(HttpClient);

  /**
   * Loads tasks from the server
   * @method loadTasks
   * @description Fetches tasks from API and updates local state
   * @async
   * @returns {Promise<void>} Promise that resolves when tasks are loaded
   * @throws {Error} When API request fails
   */
  async loadTasks(): Promise<void> {
    this._loading.set(true);
    try {
      const tasks = await firstValueFrom(
        this.http.get<Task[]>('/api/tasks')
      );
      this._tasks.set(tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      throw new Error('Failed to load tasks');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Creates a new task
   * @method createTask
   * @description Creates a new task and adds it to the local state
   * @async
   * @param {Omit<Task, 'id'>} taskData - Task data without ID
   * @returns {Promise<Task>} Promise that resolves with the created task
   * @throws {Error} When task creation fails
   */
  async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    this._loading.set(true);
    try {
      const newTask = await firstValueFrom(
        this.http.post<Task>('/api/tasks', taskData)
      );
      this._tasks.update(tasks => [...tasks, newTask]);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error('Failed to create task');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Updates an existing task
   * @method updateTask
   * @description Updates a task by ID and refreshes local state
   * @async
   * @param {string} id - Task ID to update
   * @param {Partial<Task>} updates - Partial task data to update
   * @returns {Promise<Task>} Promise that resolves with the updated task
   * @throws {Error} When task update fails
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    this._loading.set(true);
    try {
      const updatedTask = await firstValueFrom(
        this.http.patch<Task>(`/api/tasks/${id}`, updates)
      );
      this._tasks.update(tasks =>
        tasks.map(task => task.id === id ? updatedTask : task)
      );
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error('Failed to update task');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Deletes a task by ID
   * @method deleteTask
   * @description Removes a task from server and local state
   * @async
   * @param {string} id - Task ID to delete
   * @returns {Promise<void>} Promise that resolves when task is deleted
   * @throws {Error} When task deletion fails
   */
  async deleteTask(id: string): Promise<void> {
    this._loading.set(true);
    try {
      await firstValueFrom(
        this.http.delete(`/api/tasks/${id}`)
      );
      this._tasks.update(tasks => tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw new Error('Failed to delete task');
    } finally {
      this._loading.set(false);
    }
  }
}
```

### 3. Interface and Type Documentation

**MANDATORY**: All interfaces and types must be documented with JSDoc.

```typescript
/**
 * Task entity interface
 * @interface Task
 * @description Represents a single task item in the todo application
 * @since 1.0.0
 */
export interface Task {
  /**
   * Unique identifier for the task
   * @type {string}
   * @description UUID generated by the server
   */
  id: string;

  /**
   * Task title or description
   * @type {string}
   * @description Human-readable task description
   * @minLength 1
   * @maxLength 255
   */
  title: string;

  /**
   * Task completion status
   * @type {boolean}
   * @description True if task is completed, false otherwise
   * @default false
   */
  completed: boolean;

  /**
   * Task creation timestamp
   * @type {Date}
   * @description ISO 8601 formatted creation date
   */
  createdAt: Date;

  /**
   * Task last update timestamp
   * @type {Date}
   * @description ISO 8601 formatted last modification date
   */
  updatedAt: Date;

  /**
   * Optional task priority level
   * @type {TaskPriority}
   * @optional
   * @description Priority level for task ordering
   */
  priority?: TaskPriority;

  /**
   * Optional task due date
   * @type {Date}
   * @optional
   * @description When the task should be completed
   */
  dueDate?: Date;
}

/**
 * Task priority enumeration
 * @enum {string}
 * @description Available priority levels for tasks
 */
export enum TaskPriority {
  /** Low priority task */
  LOW = 'low',
  /** Normal priority task */
  NORMAL = 'normal',
  /** High priority task */
  HIGH = 'high',
  /** Critical priority task */
  CRITICAL = 'critical'
}

/**
 * Task filter options
 * @type TaskFilter
 * @description Union type for filtering tasks
 */
export type TaskFilter = 'all' | 'completed' | 'pending' | 'overdue';

/**
 * Task creation payload
 * @type CreateTaskPayload
 * @description Data required to create a new task
 */
export type CreateTaskPayload = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Task update payload
 * @type UpdateTaskPayload
 * @description Partial data for updating an existing task
 */
export type UpdateTaskPayload = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
```

## Code Organization Standards

### 1. File and Directory Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── task-item/
│   │   │   ├── task-item.component.ts
│   │   │   ├── task-item.component.html
│   │   │   ├── task-item.component.scss
│   │   │   └── task-item.component.spec.ts
│   ├── pages/              # Route components
│   │   ├── tasks/
│   │   │   ├── tasks.component.ts
│   │   │   └── tasks.component.html
│   ├── services/           # Business logic services
│   │   ├── task.service.ts
│   │   └── api.service.ts
│   ├── models/             # Type definitions
│   │   ├── task.model.ts
│   │   └── api.model.ts
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   └── utils/              # Utility functions
```

### 2. Naming Conventions

#### Components
- **File names**: `kebab-case.component.ts`
- **Class names**: `PascalCase` + `Component` suffix
- **Selectors**: `app-kebab-case`

#### Services
- **File names**: `kebab-case.service.ts`
- **Class names**: `PascalCase` + `Service` suffix

#### Signals and Methods
- **Signals**: `camelCase`
- **Methods**: `camelCase` with descriptive verbs
- **Private members**: `_camelCase` (underscore prefix)

### 3. Import Organization

**MANDATORY**: Organize imports in the following order:

```typescript
// 1. Angular core imports
import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular libraries
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// 3. Third-party libraries
import { Observable, firstValueFrom } from 'rxjs';

// 4. Application imports (relative paths)
import { Task, TaskPriority } from '../models/task.model';
import { TaskService } from '../services/task.service';
```

## Performance and Best Practices

### 1. Advanced Signal Patterns

#### Signal Composition and Derivation
```typescript
/**
 * Advanced signal composition example
 * @description Demonstrates complex signal relationships and optimization patterns
 */
export class AdvancedSignalComponent {
  // Base signals
  private readonly _baseData = signal<DataItem[]>([]);
  private readonly _searchTerm = signal<string>('');
  private readonly _sortConfig = signal<SortConfig>({ field: 'name', direction: 'asc' });
  private readonly _pagination = signal<PaginationConfig>({ page: 1, size: 10 });
  private readonly _isLoading = signal<boolean>(false);

  // Derived signals with performance optimization
  /**
   * Filtered data signal with memoization
   * @computed
   * @description Filters data based on search term with performance optimization
   */
  readonly filteredData = computed(() => {
    const data = this._baseData();
    const term = this._searchTerm().toLowerCase().trim();

    if (!term) return data;

    return data.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  });

  /**
   * Sorted data signal
   * @computed
   * @description Applies sorting to filtered data
   */
  readonly sortedData = computed(() => {
    const data = this.filteredData();
    const config = this._sortConfig();

    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, config.field);
      const bValue = this.getNestedValue(b, config.field);
      const comparison = this.compareValues(aValue, bValue);
      return config.direction === 'asc' ? comparison : -comparison;
    });
  });

  /**
   * Paginated data signal
   * @computed
   * @description Applies pagination to sorted data
   */
  readonly paginatedData = computed(() => {
    const data = this.sortedData();
    const { page, size } = this._pagination();
    const startIndex = (page - 1) * size;
    return data.slice(startIndex, startIndex + size);
  });

  /**
   * Comprehensive data statistics
   * @computed
   * @description Calculates detailed statistics about the dataset
   */
  readonly dataStats = computed(() => {
    const all = this._baseData();
    const filtered = this.filteredData();
    const paginated = this.paginatedData();

    return {
      total: all.length,
      filtered: filtered.length,
      displayed: paginated.length,
      hasMore: filtered.length > paginated.length,
      currentPage: this._pagination().page,
      totalPages: Math.ceil(filtered.length / this._pagination().size),
      isFiltered: this._searchTerm().length > 0
    };
  });

  /**
   * Loading state with debouncing
   * @computed
   * @description Provides debounced loading state for better UX
   */
  readonly debouncedLoading = computed(() => {
    const isLoading = this._isLoading();
    // In real implementation, you might use a debounce mechanism
    return isLoading;
  });

  /**
   * Gets nested object value safely
   * @private
   * @method getNestedValue
   * @param {any} obj - Object to get value from
   * @param {string} path - Dot-separated path to value
   * @returns {any} Value at path or undefined
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Compares values for sorting with type awareness
   * @private
   * @method compareValues
   * @param {any} a - First value
   * @param {any} b - Second value
   * @returns {number} Comparison result
   */
  private compareValues(a: any, b: any): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    return a < b ? -1 : a > b ? 1 : 0;
  }
}
```

#### Signal State Management Patterns
```typescript
/**
 * Advanced state management with signals
 * @description Demonstrates complex state management patterns with signals
 */
export class StateManagementService {
  // Private state signals
  private readonly _entities = signal<Map<string, Entity>>(new Map());
  private readonly _loadingStates = signal<Map<string, boolean>>(new Map());
  private readonly _errorStates = signal<Map<string, string | null>>(new Map());
  private readonly _selectedIds = signal<Set<string>>(new Set());
  private readonly _lastUpdated = signal<Map<string, Date>>(new Map());

  // Public readonly signals
  readonly entities = this._entities.asReadonly();
  readonly selectedIds = this._selectedIds.asReadonly();

  /**
   * Selected entities computed signal
   * @computed
   * @description Gets currently selected entities
   */
  readonly selectedEntities = computed(() => {
    const entities = this._entities();
    const selected = this._selectedIds();
    return Array.from(selected)
      .map(id => entities.get(id))
      .filter((entity): entity is Entity => entity !== undefined);
  });

  /**
   * Entity array computed signal
   * @computed
   * @description Converts entity map to array for iteration
   */
  readonly entityArray = computed(() => {
    return Array.from(this._entities().values());
  });

  /**
   * Loading state for specific entity
   * @method isLoading
   * @param {string} id - Entity ID
   * @returns {boolean} Loading state
   */
  isLoading(id: string): boolean {
    return this._loadingStates().get(id) ?? false;
  }

  /**
   * Error state for specific entity
   * @method getError
   * @param {string} id - Entity ID
   * @returns {string | null} Error message or null
   */
  getError(id: string): string | null {
    return this._errorStates().get(id) ?? null;
  }

  /**
   * Updates entity with optimistic updates
   * @method updateEntity
   * @param {string} id - Entity ID
   * @param {Partial<Entity>} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async updateEntity(id: string, updates: Partial<Entity>): Promise<void> {
    const currentEntity = this._entities().get(id);
    if (!currentEntity) throw new Error(`Entity ${id} not found`);

    // Set loading state
    this.setLoadingState(id, true);
    this.clearError(id);

    // Optimistic update
    const optimisticEntity = { ...currentEntity, ...updates, updatedAt: new Date() };
    this._entities.update(entities => new Map(entities.set(id, optimisticEntity)));

    try {
      // Simulate API call
      const serverEntity = await this.apiCall('UPDATE', id, updates);

      // Apply server response
      this._entities.update(entities => new Map(entities.set(id, serverEntity)));
      this._lastUpdated.update(times => new Map(times.set(id, new Date())));

    } catch (error) {
      // Revert optimistic update
      this._entities.update(entities => new Map(entities.set(id, currentEntity)));
      this.setError(id, 'Failed to update entity');
      throw error;
    } finally {
      this.setLoadingState(id, false);
    }
  }

  /**
   * Batch updates multiple entities
   * @method batchUpdate
   * @param {Array<{id: string, updates: Partial<Entity>}>} operations - Batch operations
   * @returns {Promise<void>}
   */
  async batchUpdate(operations: Array<{id: string, updates: Partial<Entity>}>): Promise<void> {
    const originalEntities = new Map(this._entities());

    // Set loading states
    operations.forEach(op => this.setLoadingState(op.id, true));

    try {
      // Apply optimistic updates
      this._entities.update(entities => {
        const newEntities = new Map(entities);
        operations.forEach(({ id, updates }) => {
          const current = newEntities.get(id);
          if (current) {
            newEntities.set(id, { ...current, ...updates, updatedAt: new Date() });
          }
        });
        return newEntities;
      });

      // Perform batch API call
      const results = await this.batchApiCall(operations);

      // Apply server responses
      this._entities.update(entities => {
        const newEntities = new Map(entities);
        results.forEach(entity => {
          newEntities.set(entity.id, entity);
        });
        return newEntities;
      });

    } catch (error) {
      // Revert all changes
      this._entities.set(originalEntities);
      operations.forEach(op => this.setError(op.id, 'Batch update failed'));
      throw error;
    } finally {
      operations.forEach(op => this.setLoadingState(op.id, false));
    }
  }

  /**
   * Selects or deselects entities
   * @method toggleSelection
   * @param {string} id - Entity ID
   * @param {boolean} [forceState] - Force specific selection state
   * @returns {void}
   */
  toggleSelection(id: string, forceState?: boolean): void {
    this._selectedIds.update(selected => {
      const newSelected = new Set(selected);
      const shouldSelect = forceState ?? !newSelected.has(id);

      if (shouldSelect) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }

      return newSelected;
    });
  }

  /**
   * Clears all selections
   * @method clearSelection
   * @returns {void}
   */
  clearSelection(): void {
    this._selectedIds.set(new Set());
  }

  /**
   * Selects all entities
   * @method selectAll
   * @returns {void}
   */
  selectAll(): void {
    const allIds = Array.from(this._entities().keys());
    this._selectedIds.set(new Set(allIds));
  }

  /**
   * Sets loading state for entity
   * @private
   * @method setLoadingState
   * @param {string} id - Entity ID
   * @param {boolean} loading - Loading state
   * @returns {void}
   */
  private setLoadingState(id: string, loading: boolean): void {
    this._loadingStates.update(states => new Map(states.set(id, loading)));
  }

  /**
   * Sets error state for entity
   * @private
   * @method setError
   * @param {string} id - Entity ID
   * @param {string} error - Error message
   * @returns {void}
   */
  private setError(id: string, error: string): void {
    this._errorStates.update(states => new Map(states.set(id, error)));
  }

  /**
   * Clears error state for entity
   * @private
   * @method clearError
   * @param {string} id - Entity ID
   * @returns {void}
   */
  private clearError(id: string): void {
    this._errorStates.update(states => {
      const newStates = new Map(states);
      newStates.delete(id);
      return newStates;
    });
  }

  /**
   * Simulated API call
   * @private
   * @method apiCall
   * @param {string} method - HTTP method
   * @param {string} id - Entity ID
   * @param {any} data - Request data
   * @returns {Promise<Entity>}
   */
  private async apiCall(method: string, id: string, data: any): Promise<Entity> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return mock entity
    return { id, ...data } as Entity;
  }

  /**
   * Simulated batch API call
   * @private
   * @method batchApiCall
   * @param {Array} operations - Batch operations
   * @returns {Promise<Entity[]>}
   */
  private async batchApiCall(operations: Array<any>): Promise<Entity[]> {
    // Simulate batch API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Return mock entities
    return operations.map(op => ({ id: op.id, ...op.updates } as Entity));
  }
}
```

### 2. Signal Best Practices

```typescript
// ✅ GOOD: Use computed for derived state
readonly filteredTasks = computed(() => {
  const filter = this.currentFilter();
  const tasks = this.tasks();

  switch (filter) {
    case 'completed':
      return tasks.filter(task => task.completed);
    case 'pending':
      return tasks.filter(task => !task.completed);
    default:
      return tasks;
  }
});

// ❌ BAD: Don't create unnecessary computed signals
readonly taskCount = computed(() => this.tasks().length);
readonly taskLength = computed(() => this.tasks().length); // Duplicate

// ✅ GOOD: Update signals efficiently
updateTaskStatus(taskId: string, completed: boolean): void {
  this.tasks.update(tasks =>
    tasks.map(task =>
      task.id === taskId ? { ...task, completed } : task
    )
  );
}

// ❌ BAD: Don't mutate signal values directly
updateTaskStatusBad(taskId: string, completed: boolean): void {
  const tasks = this.tasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = completed; // Direct mutation
    this.tasks.set(tasks); // This won't trigger updates properly
  }
}

// ✅ GOOD: Use effects for side effects
effect(() => {
  const user = this.currentUser();
  if (user) {
    this.loadUserPreferences(user.id);
  }
});

// ❌ BAD: Don't use effects for derived state
effect(() => {
  const tasks = this.tasks();
  this.taskCount.set(tasks.length); // Use computed instead
});

// ✅ GOOD: Cleanup effects when needed
ngOnInit() {
  this.effectRef = effect(() => {
    // Effect logic
  });
}

ngOnDestroy() {
  this.effectRef?.destroy();
}

// ✅ GOOD: Use signal inputs and outputs
@Component({
  selector: 'app-example',
  template: '...'
})
export class ExampleComponent {
  data = input.required<Data>();
  change = output<Data>();

  onClick() {
    this.change.emit(this.data());
  }
}

// ❌ BAD: Don't mix signals with old @Input/@Output
@Component({
  selector: 'app-bad-example',
  template: '...'
})
export class BadExampleComponent {
  @Input() data!: Data; // Don't mix with signals
  dataSignal = signal<Data>(null);
}
```

### 2. Zoneless Optimization

```typescript
// ✅ GOOD: Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})

// ✅ GOOD: Use signals for reactive updates
@Component({
  template: `
    <div>{{ data() }}</div>
    <button (click)="updateData()">Update</button>
  `
})
export class MyComponent {
  data = signal('initial');

  updateData(): void {
    this.data.set('updated'); // Automatically triggers update
  }
}

// ❌ BAD: Avoid manual change detection triggers
export class BadComponent {
  constructor(private cdr: ChangeDetectorRef) {}

  updateData(): void {
    this.data = 'updated';
    this.cdr.detectChanges(); // Not needed with signals
  }
}
```

## Testing Standards

### 1. Component Testing

```typescript
/**
 * Test suite for TaskListComponent
 * @description Comprehensive tests for task list functionality
 */
describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  /**
   * Test component initialization
   * @test
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test task display functionality
   * @test
   */
  it('should display tasks when provided', () => {
    const mockTasks: Task[] = [
      { id: '1', title: 'Test Task', completed: false, createdAt: new Date(), updatedAt: new Date() }
    ];

    fixture.componentRef.setInput('tasks', mockTasks);
    fixture.detectChanges();

    const taskElements = fixture.debugElement.queryAll(By.css('.task-item'));
    expect(taskElements.length).toBe(1);
  });

  /**
   * Test task toggle functionality
   * @test
   */
  it('should emit taskUpdate when task is toggled', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Test Task',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    spyOn(component.taskUpdate, 'emit');
    component.onTaskToggle(mockTask);

    expect(component.taskUpdate.emit).toHaveBeenCalledWith({
      ...mockTask,
      completed: true
    });
  });
});
```

### 2. Service Testing

```typescript
/**
 * Test suite for TaskService
 * @description Tests for task service functionality
 */
describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Test service creation
   * @test
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Test tasks loading
   * @test
   */
  it('should load tasks from API', async () => {
    const mockTasks: Task[] = [
      { id: '1', title: 'Test', completed: false, createdAt: new Date(), updatedAt: new Date() }
    ];

    const loadPromise = service.loadTasks();

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);

    await loadPromise;
    expect(service.tasks()).toEqual(mockTasks);
  });
});
```

## Accessibility Standards

### 1. ARIA Labels and Semantic HTML

```typescript
/**
 * Accessible task component
 */
@Component({
  template: `
    <article
      class="task-item"
      [attr.aria-label]="'Task: ' + task().title">
      <input
        type="checkbox"
        [id]="'task-' + task().id"
        [checked]="task().completed"
        (change)="onToggle()"
        [attr.aria-describedby]="'task-desc-' + task().id">
      <label
        [for]="'task-' + task().id"
        [id]="'task-desc-' + task().id"
        class="task-label">
        {{ task().title }}
      </label>
      <button
        type="button"
        (click)="onDelete()"
        [attr.aria-label]="'Delete task: ' + task().title"
        class="delete-btn">
        <span aria-hidden="true">×</span>
      </button>
    </article>
  `
})
export class TaskItemComponent {
  task = input.required<Task>();
  toggle = output<void>();
  delete = output<void>();

  onToggle(): void {
    this.toggle.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }
}
```

## Error Handling Standards

### 1. Service Error Handling

```typescript
/**
 * Error handling in services
 */
export class TaskService {
  /**
   * Handles API errors with proper logging and user feedback
   * @private
   * @method handleError
   * @param {string} operation - Name of the operation that failed
   * @param {any} error - The error object
   * @throws {Error} User-friendly error message
   */
  private handleError(operation: string, error: any): never {
    console.error(`${operation} failed:`, error);

    let userMessage = `Failed to ${operation.toLowerCase()}`;

    if (error.status === 404) {
      userMessage = 'Resource not found';
    } else if (error.status === 403) {
      userMessage = 'Permission denied';
    } else if (error.status >= 500) {
      userMessage = 'Server error, please try again later';
    }

    throw new Error(userMessage);
  }

  async createTask(taskData: CreateTaskPayload): Promise<Task> {
    this._loading.set(true);
    try {
      const newTask = await firstValueFrom(
        this.http.post<Task>('/api/tasks', taskData)
      );
      this._tasks.update(tasks => [...tasks, newTask]);
      return newTask;
    } catch (error) {
      this.handleError('Create task', error);
    } finally {
      this._loading.set(false);
    }
  }
}
```

---

## Compliance Checklist

### Pre-Commit Requirements
- [ ] All components use signals for state management
- [ ] Application is configured for zoneless operation
- [ ] All public APIs have comprehensive JSDoc documentation
- [ ] All files follow naming conventions
- [ ] Imports are organized correctly
- [ ] Components use OnPush change detection
- [ ] Tests cover signal-based functionality
- [ ] Accessibility requirements are met
- [ ] Error handling is implemented

### Code Review Checklist
- [ ] No direct DOM manipulation outside Angular
- [ ] No Zone.js usage or monkey patching
- [ ] All async operations use promises or signals
- [ ] JSDoc comments are complete and accurate
- [ ] Component inputs/outputs are properly typed
- [ ] Services follow dependency injection patterns
- [ ] Tests verify signal behavior
- [ ] Performance considerations are addressed

This document serves as the definitive guide for Angular development standards in our application. All team members must adhere to these standards to ensure consistency, maintainability, and optimal performance.