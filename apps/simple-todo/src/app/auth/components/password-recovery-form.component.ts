/**
 * Password recovery form component
 * @description Password recovery form with validation and signals-based architecture
 */

import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordRecoveryRequest } from '@simple-todo/shared';
import { AuthService } from '../services/auth.service';

/**
 * Password recovery form component
 * @component PasswordRecoveryFormComponent
 * @description Allows users to initiate password recovery
 */
@Component({
  selector: 'app-password-recovery-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="recovery-form-container">
      <div class="form-header">
        <h2>Reset Your Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password</p>
      </div>

      @if (!recoverySubmitted()) {
        <form [formGroup]="recoveryForm" (ngSubmit)="onSubmit()" novalidate>
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

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-button"
            [disabled]="!recoveryForm.valid || authService.isLoading()"
            [class.loading]="authService.isLoading()"
          >
            @if (authService.isLoading()) {
              <span class="loading-spinner"></span>
              <span>Sending Recovery Email...</span>
            } @else {
              <span>Send Recovery Email</span>
            }
          </button>

          <!-- Error Display -->
          @if (authService.error(); as error) {
            <div class="form-error" role="alert">
              {{ error }}
            </div>
          }
        </form>
      } @else {
        <!-- Success Message -->
        <div class="success-message">
          <div class="success-icon">📧</div>
          <h3>Check Your Email</h3>
          <p>
            If an account with that email exists, we've sent you a password reset link.
            Please check your email and follow the instructions to reset your password.
          </p>
          <div class="success-details">
            <p><strong>Didn't receive the email?</strong></p>
            <ul>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          <button
            type="button"
            class="retry-button"
            (click)="resetForm()"
          >
            Try Different Email
          </button>
        </div>
      }

      <!-- Navigation Links -->
      <div class="form-footer">
        <p>
          Remember your password?
          <a (click)="navigateToLogin()" class="link">Back to Sign In</a>
        </p>
        <p>
          Don't have an account?
          <a (click)="navigateToRegister()" class="link">Create one here</a>
        </p>
      </div>

      <!-- Development Mode Notice -->
      @if (isDevelopmentMode()) {
        <div class="dev-notice">
          <h4>🔧 Development Mode</h4>
          <p>Password recovery is simulated in development mode.</p>
          <p>In production, this would send an actual recovery email through Supabase.</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./password-recovery-form.component.scss']
})
export class PasswordRecoveryFormComponent {
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
   * Recovery submission state signal
   * @signal
   */
  recoverySubmitted = signal<boolean>(false);

  /**
   * Password recovery form group
   * @readonly
   */
  readonly recoveryForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /**
   * Computed signal for email field errors
   * @computed
   * @readonly
   */
  readonly emailFieldError = computed(() => {
    const emailControl = this.recoveryForm.get('email');
    return emailControl?.invalid && (emailControl.dirty || emailControl.touched)
      ? emailControl.errors
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
   * Handles form submission
   * @method onSubmit
   * @async
   */
  async onSubmit(): Promise<void> {
    if (!this.recoveryForm.valid) {
      // Mark all fields as touched to show validation errors
      this.recoveryForm.markAllAsTouched();
      return;
    }

    // Clear any previous errors
    this.authService.clearError();

    const formValue = this.recoveryForm.value;
    const recoveryData: PasswordRecoveryRequest = {
      email: formValue.email.trim().toLowerCase()
    };

    try {
      await this.authService.initiatePasswordRecovery(recoveryData);

      // Show success message (always shown for security)
      this.recoverySubmitted.set(true);

    } catch (error: any) {
      console.error('Password recovery failed:', error);
      // Show success message anyway for security (don't reveal if email exists)
      this.recoverySubmitted.set(true);
    }
  }

  /**
   * Resets the form to allow retry
   * @method resetForm
   */
  resetForm(): void {
    this.recoverySubmitted.set(false);
    this.recoveryForm.reset();
    this.authService.clearError();
  }

  /**
   * Navigates to login page
   * @method navigateToLogin
   * @async
   */
  async navigateToLogin(): Promise<void> {
    await this.router.navigate(['/auth/login']);
  }

  /**
   * Navigates to registration page
   * @method navigateToRegister
   * @async
   */
  async navigateToRegister(): Promise<void> {
    await this.router.navigate(['/auth/register']);
  }
}