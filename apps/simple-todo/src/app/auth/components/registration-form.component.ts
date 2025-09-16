/**
 * User registration form component
 * @description Registration form with validation and signals-based architecture
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
import { RegisterRequest, User } from '@simple-todo/shared';
import { AuthService } from '../services/auth.service';

/**
 * Custom validators for registration form
 * @class CustomValidators
 */
class CustomValidators {
  /**
   * Password strength validator
   * @static
   * @method passwordStrength
   * @param {any} control - Form control
   * @returns {any} Validation result
   */
  static passwordStrength(control: any) {
    const value = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    const isValidLength = value.length >= 8;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial && isValidLength;

    if (!passwordValid) {
      return {
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecial,
          isValidLength
        }
      };
    }

    return null;
  }

  /**
   * Name validation
   * @static
   * @method validName
   * @param {any} control - Form control
   * @returns {any} Validation result
   */
  static validName(control: any) {
    const value = control.value || '';
    const namePattern = /^[a-zA-Z\s\-']+$/;
    const isValidFormat = namePattern.test(value);
    const isValidLength = value.length >= 2 && value.length <= 100;

    if (!isValidFormat || !isValidLength) {
      return {
        validName: {
          isValidFormat,
          isValidLength
        }
      };
    }

    return null;
  }
}

/**
 * Registration form component
 * @component RegistrationFormComponent
 * @description User registration form with comprehensive validation
 */
@Component({
  selector: 'app-registration-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="registration-form-container">
      <div class="form-header">
        <h2>Create Account</h2>
        <p>Join us to manage your tasks efficiently</p>
      </div>

      <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()" novalidate>
        <!-- Name Field -->
        <div class="form-group">
          <label for="name">Full Name *</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Enter your full name"
            [class.error]="nameFieldError()"
            autocomplete="name"
            required
          />
          @if (nameFieldError(); as error) {
            <div class="field-error">
              @if (error.required) {
                <span>Name is required</span>
              } @else if (error.validName?.isValidFormat === false) {
                <span>Name can only contain letters, spaces, hyphens, and apostrophes</span>
              } @else if (error.validName?.isValidLength === false) {
                <span>Name must be between 2 and 100 characters</span>
              }
            </div>
          }
        </div>

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
              placeholder="Create a strong password"
              [class.error]="passwordFieldError()"
              autocomplete="new-password"
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

          <!-- Password Strength Indicator -->
          @if (passwordStrengthInfo(); as strength) {
            <div class="password-strength">
              <div class="strength-indicator" [class]="getPasswordStrengthClass()">
                <span>{{ getPasswordStrengthText() }}</span>
              </div>
              <ul class="strength-requirements">
                <li [class.valid]="strength.hasUpperCase">At least one uppercase letter</li>
                <li [class.valid]="strength.hasLowerCase">At least one lowercase letter</li>
                <li [class.valid]="strength.hasNumeric">At least one number</li>
                <li [class.valid]="strength.hasSpecial">At least one special character</li>
                <li [class.valid]="strength.isValidLength">At least 8 characters long</li>
              </ul>
            </div>
          }

          @if (passwordFieldError(); as error) {
            <div class="field-error">
              @if (error.required) {
                <span>Password is required</span>
              } @else if (error.passwordStrength) {
                <span>Password does not meet strength requirements</span>
              }
            </div>
          }
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="submit-button"
          [disabled]="!registrationForm.valid || authService.isLoading()"
          [class.loading]="authService.isLoading()"
        >
          @if (authService.isLoading()) {
            <span class="loading-spinner"></span>
            <span>Creating Account...</span>
          } @else {
            <span>Create Account</span>
          }
        </button>

        <!-- Error Display -->
        @if (authService.error(); as error) {
          <div class="form-error" role="alert">
            {{ error }}
          </div>
        }

        <!-- Login Link -->
        <div class="form-footer">
          <p>
            Already have an account?
            <a (click)="navigateToLogin()" class="link">Sign in here</a>
          </p>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./registration-form.component.scss']
})
export class RegistrationFormComponent {
  /**
   * Output event for successful registration
   * @output
   */
  registered = output<User>();

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
   * Registration form group
   * @readonly
   */
  readonly registrationForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, CustomValidators.validName]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, CustomValidators.passwordStrength]]
  });

  /**
   * Computed signal for name field errors
   * @computed
   * @readonly
   */
  readonly nameFieldError = computed(() => {
    const nameControl = this.registrationForm.get('name');
    return nameControl?.invalid && (nameControl.dirty || nameControl.touched)
      ? nameControl.errors
      : null;
  });

  /**
   * Computed signal for email field errors
   * @computed
   * @readonly
   */
  readonly emailFieldError = computed(() => {
    const emailControl = this.registrationForm.get('email');
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
    const passwordControl = this.registrationForm.get('password');
    return passwordControl?.invalid && (passwordControl.dirty || passwordControl.touched)
      ? passwordControl.errors
      : null;
  });

  /**
   * Computed signal for password strength information
   * @computed
   * @readonly
   */
  readonly passwordStrengthInfo = computed(() => {
    const passwordControl = this.registrationForm.get('password');
    const errors = passwordControl?.errors;

    if (errors?.['passwordStrength']) {
      return errors['passwordStrength'];
    }

    // If no errors and password exists, all requirements are met
    if (passwordControl?.value) {
      return {
        hasUpperCase: true,
        hasLowerCase: true,
        hasNumeric: true,
        hasSpecial: true,
        isValidLength: true
      };
    }

    return null;
  });

  /**
   * Toggles password visibility
   * @method togglePasswordVisibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(current => !current);
  }

  /**
   * Gets password strength CSS class
   * @method getPasswordStrengthClass
   * @returns {string} CSS class name
   */
  getPasswordStrengthClass(): string {
    const strength = this.passwordStrengthInfo();
    if (!strength) return '';

    const score = Object.values(strength).filter(Boolean).length;

    if (score <= 2) return 'strength-weak';
    if (score <= 4) return 'strength-medium';
    return 'strength-strong';
  }

  /**
   * Gets password strength text
   * @method getPasswordStrengthText
   * @returns {string} Strength description
   */
  getPasswordStrengthText(): string {
    const strength = this.passwordStrengthInfo();
    if (!strength) return '';

    const score = Object.values(strength).filter(Boolean).length;

    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  }

  /**
   * Handles form submission
   * @method onSubmit
   * @async
   */
  async onSubmit(): Promise<void> {
    if (!this.registrationForm.valid) {
      // Mark all fields as touched to show validation errors
      this.registrationForm.markAllAsTouched();
      return;
    }

    // Clear any previous errors
    this.authService.clearError();

    const formValue = this.registrationForm.value;
    const registrationData: RegisterRequest = {
      name: formValue.name.trim(),
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password
    };

    try {
      const user = await this.authService.register(registrationData);

      // Emit registration success
      this.registered.emit(user);

      // Navigate to dashboard or intended route
      await this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('Registration failed:', error);
      // Error is already handled by the auth service
    }
  }

  /**
   * Navigates to login page
   * @method navigateToLogin
   * @async
   */
  async navigateToLogin(): Promise<void> {
    await this.router.navigate(['/auth/login']);
  }
}