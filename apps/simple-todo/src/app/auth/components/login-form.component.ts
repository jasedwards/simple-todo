/**
 * User login form component
 * @description Login form with validation and signals-based architecture
 */

import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginRequest, User } from '@simple-todo/shared';
import { AuthService } from '../services/auth.service';

/**
 * Login form component
 * @component LoginFormComponent
 * @description User authentication form with validation
 */
@Component({
  selector: 'app-login-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-form-container">
      <div class="form-header">
        <h2>Welcome Back</h2>
        <p>Sign in to your account to continue</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="Enter your email address"
            [class.error]="emailFieldError()"
            autocomplete="email"
            required
          />
          @if (emailFieldError(); as error) {
            <div class="field-error">
              @if (error.required) {
                <span>Email is required</span>
              } @else if (error.email) {
                <span>Please enter a valid email address</span>
              }
            </div>
          }
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password">Password *</label>
          <div class="password-input-container">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              placeholder="Enter your password"
              [class.error]="passwordFieldError()"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            >
              {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          @if (passwordFieldError(); as error) {
            <div class="field-error">
              @if (error.required) {
                <span>Password is required</span>
              } @else if (error.minlength) {
                <span>Password is too short</span>
              }
            </div>
          }
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="form-options">
          <label class="checkbox-container">
            <input
              type="checkbox"
              formControlName="rememberMe"
            />
            <span class="checkmark"></span>
            <span class="checkbox-label">Remember me</span>
          </label>

          <a (click)="navigateToPasswordRecovery()" class="forgot-password-link">
            Forgot password?
          </a>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-button"
          [disabled]="!loginForm.valid || authService.isLoading()"
          [class.loading]="authService.isLoading()"
        >
          @if (authService.isLoading()) {
            <span class="loading-spinner"></span>
            <span>Signing In...</span>
          } @else {
            <span>Sign In</span>
          }
        </button>

        <!-- Error Display -->
        @if (authService.error(); as error) {
          <div class="form-error" role="alert">
            {{ error }}
          </div>
        }

        <!-- Registration Link -->
        <div class="form-footer">
          <p>
            Don't have an account?
            <a (click)="navigateToRegister()" class="link">Create one here</a>
          </p>
        </div>

        <!-- Development Mode Notice -->
        @if (isDevelopmentMode()) {
          <div class="dev-notice">
            <h4>🔧 Development Mode</h4>
            <p>Authentication is mocked for development. Use any email and password to login.</p>
            <p><strong>Quick Login:</strong> Any email format with any password will work.</p>
          </div>
        }
      </form>
    </div>
  `,
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  /**
   * Output event for successful login
   * @output
   */
  loggedIn = output<User>();

  /**
   * Form builder service
   * @private
   * @readonly
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router service for navigation
   * @private
   * @readonly
   */
  private readonly router = inject(Router);

  /**
   * Authentication service
   * @readonly
   */
  readonly authService = inject(AuthService);

  /**
   * Password visibility toggle signal
   * @signal
   */
  showPassword = signal<boolean>(false);

  /**
   * Login form group
   * @readonly
   */
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
    rememberMe: [false]
  });

  /**
   * Computed signal for email field errors
   * @computed
   * @readonly
   */
  readonly emailFieldError = computed(() => {
    const emailControl = this.loginForm.get('email');
    return emailControl?.invalid && (emailControl.dirty || emailControl.touched)
      ? emailControl.errors
      : null;
  });

  /**
   * Computed signal for password field errors
   * @computed
   * @readonly
   */
  readonly passwordFieldError = computed(() => {
    const passwordControl = this.loginForm.get('password');
    return passwordControl?.invalid && (passwordControl.dirty || passwordControl.touched)
      ? passwordControl.errors
      : null;
  });

  /**
   * Checks if application is in development mode
   * @method isDevelopmentMode
   * @returns {boolean} True if in development mode
   */
  isDevelopmentMode(): boolean {
    return !!(window as any)['ngDevMode'] || (window as any)['ng'];
  }

  /**
   * Toggles password visibility
   * @method togglePasswordVisibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(current => !current);
  }

  /**
   * Handles form submission
   * @method onSubmit
   * @async
   */
  async onSubmit(): Promise<void> {
    if (!this.loginForm.valid) {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
      return;
    }

    // Clear any previous errors
    this.authService.clearError();

    const formValue = this.loginForm.value;
    const loginData: LoginRequest = {
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password
    };

    try {
      const user = await this.authService.login(loginData);

      // Handle "remember me" functionality
      if (formValue.rememberMe) {
        // In a real application, you might extend token expiration
        console.log('Remember me option selected');
      }

      // Emit login success
      this.loggedIn.emit(user);

      // Navigate to dashboard or intended route
      await this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Login failed:', error);
      // Error is already handled by the auth service
    }
  }

  /**
   * Navigates to registration page
   * @method navigateToRegister
   * @async
   */
  async navigateToRegister(): Promise<void> {
    await this.router.navigate(['/auth/register']);
  }

  /**
   * Navigates to password recovery page
   * @method navigateToPasswordRecovery
   * @async
   */
  async navigateToPasswordRecovery(): Promise<void> {
    await this.router.navigate(['/auth/recover']);
  }

  /**
   * Pre-fills form with demo credentials (development only)
   * @method fillDemoCredentials
   */
  fillDemoCredentials(): void {
    if (this.isDevelopmentMode()) {
      this.loginForm.patchValue({
        email: 'demo@example.com',
        password: 'DemoPassword123!'
      });
    }
  }
}