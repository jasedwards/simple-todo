/**
 * Login form component unit tests
 * @description Tests for LoginFormComponent with reactive forms and validation
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LoginFormComponent } from './login-form.component';
import { AuthService } from '../services/auth.service';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    test('should create the component', () => {
      expect(component).toBeTruthy();
    });

    test('should initialize form with empty values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    test('should initialize form as invalid', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    test('should display required field labels', () => {
      const labels = fixture.debugElement.queryAll(By.css('label'));
      expect(labels.length).toBe(2);
      expect(labels[0].nativeElement.textContent.trim()).toBe('Email Address');
      expect(labels[1].nativeElement.textContent.trim()).toBe('Password');
    });
  });

  describe('Form Validation', () => {
    test('should show email required error', async () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Email address is required');
    });

    test('should show email format error', async () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Please enter a valid email address');
    });

    test('should show password required error', async () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Password is required');
    });

    test('should accept valid email formats', async () => {
      const emailControl = component.loginForm.get('email');

      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com'
      ];

      for (const email of validEmails) {
        emailControl?.setValue(email);
        expect(emailControl?.invalid).toBe(false);
      }
    });

    test('should reject invalid email formats', async () => {
      const emailControl = component.loginForm.get('email');

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        '<script>@domain.com'
      ];

      for (const email of invalidEmails) {
        emailControl?.setValue(email);
        expect(emailControl?.invalid).toBe(true);
      }
    });

    test('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
    });

    test('should enable submit button when form is valid', async () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(false);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Fill form with valid data
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();
    });

    test('should call AuthService.login on valid form submission', async () => {
      const loginSpy = vi.spyOn(authService, 'login').mockResolvedValue();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should not submit invalid form', () => {
      const loginSpy = vi.spyOn(authService, 'login');

      // Make form invalid
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: ''
      });
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(loginSpy).not.toHaveBeenCalled();
    });

    test('should show loading state during login', () => {
      // Mock loading state
      vi.spyOn(authService, 'isLoading').mockReturnValue(true);
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
      expect(submitButton.nativeElement.textContent.trim()).toContain('Signing In');
    });

    test('should handle login success', async () => {
      const loginSpy = vi.spyOn(authService, 'login').mockResolvedValue();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      await loginSpy;

      // Form should be reset after successful login
      expect(component.loginForm.pristine).toBe(true);
    });

    test('should display login error from AuthService', () => {
      // Mock error state
      vi.spyOn(authService, 'error').mockReturnValue('Invalid credentials');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="form-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Invalid credentials');
    });

    test('should display rate limiting error', () => {
      // Mock rate limiting error
      vi.spyOn(authService, 'error').mockReturnValue('Too many requests. Please try again later.');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="form-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Too many requests. Please try again later.');
    });
  });

  describe('Password Recovery Link', () => {
    test('should display password recovery link', () => {
      const recoveryLink = fixture.debugElement.query(By.css('[data-testid="forgot-password-link"]'));
      expect(recoveryLink).toBeTruthy();
      expect(recoveryLink.nativeElement.textContent.trim()).toBe('Forgot your password?');
    });

    test('should navigate to password recovery on link click', () => {
      const recoveryLink = fixture.debugElement.query(By.css('[data-testid="forgot-password-link"]'));
      const href = recoveryLink.nativeElement.getAttribute('href');
      expect(href).toBe('/auth/password-recovery');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize malicious input in email field', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('test@example.com<script>alert("hack")</script>');

      expect(emailControl?.invalid).toBe(true);
    });

    test('should handle SQL injection attempts', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue("admin@example.com'; DROP TABLE users; --");

      expect(emailControl?.invalid).toBe(true);
    });

    test('should handle excessive length inputs', () => {
      const emailControl = component.loginForm.get('email');
      const longEmail = 'A'.repeat(200) + '@example.com';
      emailControl?.setValue(longEmail);

      expect(emailControl?.invalid).toBe(true);
    });

    test('should handle password with excessive length', () => {
      const passwordControl = component.loginForm.get('password');
      const longPassword = 'A'.repeat(1001);
      passwordControl?.setValue(longPassword);

      expect(passwordControl?.invalid).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const emailInput = fixture.debugElement.query(By.css('input[name="email"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));

      expect(emailInput.nativeElement.getAttribute('aria-label')).toBe('Email Address');
      expect(passwordInput.nativeElement.getAttribute('aria-label')).toBe('Password');
    });

    test('should associate labels with inputs', () => {
      const emailLabel = fixture.debugElement.query(By.css('label[for="email"]'));
      const passwordLabel = fixture.debugElement.query(By.css('label[for="password"]'));

      expect(emailLabel).toBeTruthy();
      expect(passwordLabel).toBeTruthy();
    });

    test('should have proper error announcements', async () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
      expect(errorElement?.nativeElement.getAttribute('role')).toBe('alert');
      expect(errorElement?.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    test('should focus first invalid field on submission attempt', async () => {
      const emailInput = fixture.debugElement.query(By.css('input[name="email"]'));
      const focusSpy = vi.spyOn(emailInput.nativeElement, 'focus');

      // Try to submit invalid form
      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(focusSpy).toHaveBeenCalled();
    });

    test('should have proper keyboard navigation', () => {
      const emailInput = fixture.debugElement.query(By.css('input[name="email"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));

      expect(emailInput.nativeElement.tabIndex).toBe(0);
      expect(passwordInput.nativeElement.tabIndex).toBe(0);
      expect(submitButton.nativeElement.tabIndex).toBe(0);
    });
  });

  describe('User Experience', () => {
    test('should clear errors when user starts typing', () => {
      // Set an error state
      vi.spyOn(authService, 'error').mockReturnValue('Invalid credentials');
      fixture.detectChanges();

      let errorElement = fixture.debugElement.query(By.css('[data-testid="form-error"]'));
      expect(errorElement).toBeTruthy();

      // Mock clearError method
      const clearErrorSpy = vi.spyOn(authService, 'clearError');

      // Simulate user typing
      const emailInput = fixture.debugElement.query(By.css('input[name="email"]'));
      emailInput.triggerEventHandler('input', { target: { value: 'new@example.com' } });

      expect(clearErrorSpy).toHaveBeenCalled();
    });

    test('should show password visibility toggle', () => {
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));
      const toggleButton = fixture.debugElement.query(By.css('[data-testid="password-toggle"]'));

      expect(passwordInput.nativeElement.type).toBe('password');
      expect(toggleButton).toBeTruthy();

      // Click toggle to show password
      toggleButton.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(passwordInput.nativeElement.type).toBe('text');
    });
  });
});