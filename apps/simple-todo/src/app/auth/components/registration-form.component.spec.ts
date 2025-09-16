/**
 * Registration form component unit tests
 * @description Tests for RegistrationFormComponent with reactive forms and validation
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { RegistrationFormComponent } from './registration-form.component';
import { AuthService } from '../services/auth.service';

describe('RegistrationFormComponent', () => {
  let component: RegistrationFormComponent;
  let fixture: ComponentFixture<RegistrationFormComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationFormComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    test('should create the component', () => {
      expect(component).toBeTruthy();
    });

    test('should initialize form with empty values', () => {
      expect(component.registrationForm.get('name')?.value).toBe('');
      expect(component.registrationForm.get('email')?.value).toBe('');
      expect(component.registrationForm.get('password')?.value).toBe('');
    });

    test('should initialize form as invalid', () => {
      expect(component.registrationForm.valid).toBe(false);
    });

    test('should display required field labels', () => {
      const labels = fixture.debugElement.queryAll(By.css('label'));
      expect(labels.length).toBe(3);
      expect(labels[0].nativeElement.textContent.trim()).toBe('Full Name');
      expect(labels[1].nativeElement.textContent.trim()).toBe('Email Address');
      expect(labels[2].nativeElement.textContent.trim()).toBe('Password');
    });
  });

  describe('Form Validation', () => {
    test('should show name required error', async () => {
      const nameControl = component.registrationForm.get('name');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="name-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Full name is required');
    });

    test('should show name minimum length error', async () => {
      const nameControl = component.registrationForm.get('name');
      nameControl?.setValue('A');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="name-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Full name must be at least 2 characters long');
    });

    test('should show email required error', async () => {
      const emailControl = component.registrationForm.get('email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Email address is required');
    });

    test('should show email format error', async () => {
      const emailControl = component.registrationForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Please enter a valid email address');
    });

    test('should show password required error', async () => {
      const passwordControl = component.registrationForm.get('password');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Password is required');
    });

    test('should show password minimum length error', async () => {
      const passwordControl = component.registrationForm.get('password');
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Password must be at least 8 characters long');
    });

    test('should validate password strength requirements', async () => {
      const passwordControl = component.registrationForm.get('password');

      // Test weak password (no uppercase)
      passwordControl?.setValue('weakpassword123');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      let errorElement = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
      expect(errorElement?.nativeElement.textContent).toContain('uppercase letter');

      // Test weak password (no number)
      passwordControl?.setValue('WeakPassword');
      fixture.detectChanges();

      errorElement = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
      expect(errorElement?.nativeElement.textContent).toContain('number');

      // Test strong password
      passwordControl?.setValue('StrongPassword123!');
      fixture.detectChanges();

      errorElement = fixture.debugElement.query(By.css('[data-testid="password-error"]'));
      expect(errorElement).toBeFalsy();
    });

    test('should show password strength indicators', async () => {
      const passwordControl = component.registrationForm.get('password');

      passwordControl?.setValue('weak');
      fixture.detectChanges();

      let strengthIndicator = fixture.debugElement.query(By.css('[data-testid="password-strength"]'));
      expect(strengthIndicator?.nativeElement.textContent).toContain('Weak');

      passwordControl?.setValue('StrongPassword123!');
      fixture.detectChanges();

      strengthIndicator = fixture.debugElement.query(By.css('[data-testid="password-strength"]'));
      expect(strengthIndicator?.nativeElement.textContent).toContain('Strong');
    });

    test('should disable submit button when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
    });

    test('should enable submit button when form is valid', async () => {
      component.registrationForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePassword123!'
      });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(false);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Fill form with valid data
      component.registrationForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePassword123!'
      });
      fixture.detectChanges();
    });

    test('should call AuthService.register on valid form submission', async () => {
      const registerSpy = vi.spyOn(authService, 'register').mockResolvedValue();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(registerSpy).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePassword123!'
      });
    });

    test('should not submit invalid form', () => {
      const registerSpy = vi.spyOn(authService, 'register');

      // Make form invalid
      component.registrationForm.patchValue({
        name: '',
        email: 'invalid-email',
        password: '123'
      });
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(registerSpy).not.toHaveBeenCalled();
    });

    test('should show loading state during registration', () => {
      // Mock loading state
      vi.spyOn(authService, 'isLoading').mockReturnValue(true);
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton.nativeElement.disabled).toBe(true);
      expect(submitButton.nativeElement.textContent.trim()).toContain('Creating Account');
    });

    test('should handle registration success', async () => {
      const registerSpy = vi.spyOn(authService, 'register').mockResolvedValue();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      await registerSpy;

      // Form should be reset after successful registration
      expect(component.registrationForm.pristine).toBe(true);
    });

    test('should display registration error from AuthService', () => {
      // Mock error state
      vi.spyOn(authService, 'error').mockReturnValue('Email already exists');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="form-error"]'));
      expect(errorElement?.nativeElement.textContent.trim()).toBe('Email already exists');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize malicious input in name field', () => {
      const nameControl = component.registrationForm.get('name');
      nameControl?.setValue('<script>alert("hack")</script>');

      expect(nameControl?.value).toBe('<script>alert("hack")</script>');
      expect(nameControl?.invalid).toBe(true);
    });

    test('should sanitize malicious input in email field', () => {
      const emailControl = component.registrationForm.get('email');
      emailControl?.setValue('test@example.com<script>alert("hack")</script>');

      expect(emailControl?.invalid).toBe(true);
    });

    test('should handle excessive length inputs', () => {
      const nameControl = component.registrationForm.get('name');
      const longName = 'A'.repeat(101); // Exceeds max length
      nameControl?.setValue(longName);

      expect(nameControl?.invalid).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const nameInput = fixture.debugElement.query(By.css('input[name="name"]'));
      const emailInput = fixture.debugElement.query(By.css('input[name="email"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));

      expect(nameInput.nativeElement.getAttribute('aria-label')).toBe('Full Name');
      expect(emailInput.nativeElement.getAttribute('aria-label')).toBe('Email Address');
      expect(passwordInput.nativeElement.getAttribute('aria-label')).toBe('Password');
    });

    test('should associate labels with inputs', () => {
      const nameLabel = fixture.debugElement.query(By.css('label[for="name"]'));
      const emailLabel = fixture.debugElement.query(By.css('label[for="email"]'));
      const passwordLabel = fixture.debugElement.query(By.css('label[for="password"]'));

      expect(nameLabel).toBeTruthy();
      expect(emailLabel).toBeTruthy();
      expect(passwordLabel).toBeTruthy();
    });

    test('should have proper error announcements', async () => {
      const nameControl = component.registrationForm.get('name');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[data-testid="name-error"]'));
      expect(errorElement?.nativeElement.getAttribute('role')).toBe('alert');
      expect(errorElement?.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    test('should focus first invalid field on submission attempt', async () => {
      const nameInput = fixture.debugElement.query(By.css('input[name="name"]'));
      const focusSpy = vi.spyOn(nameInput.nativeElement, 'focus');

      // Try to submit invalid form
      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(focusSpy).toHaveBeenCalled();
    });
  });
});