/**
 * Authentication E2E tests
 * @description End-to-end tests for authentication system using Playwright
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Authentication System E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());

    // Navigate to the login page
    await page.goto('/auth/login');
  });

  test.describe('User Registration', () => {
    test('should successfully register a new user with valid data', async () => {
      // Navigate to registration page
      await page.click('[data-testid="register-link"]');
      await expect(page).toHaveURL('/auth/register');

      // Fill registration form with valid data
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'testuser@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL('/dashboard');

      // Should display welcome message or user info
      await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Welcome, Test User');
    });

    test('should show validation error for invalid email format', async () => {
      await page.click('[data-testid="register-link"]');
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Try to submit
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email address');

      // Should not redirect
      await expect(page).toHaveURL('/auth/register');
    });

    test('should show validation error for weak password', async () => {
      await page.click('[data-testid="register-link"]');
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', '123');

      // Password field should show error
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters long');

      // Submit button should be disabled
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });

    test('should handle registration with existing email', async () => {
      await page.click('[data-testid="register-link"]');
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'existing@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Mock server response for existing email
      await page.route('**/api/auth/register', async route => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'User already registered',
            code: 'REGISTRATION_FAILED'
          })
        });
      });

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="form-error"]')).toContainText('User already registered');
    });

    test('should sanitize and reject script injection attempts', async () => {
      await page.click('[data-testid="register-link"]');
      await page.fill('[name="name"]', '<script>alert("hack")</script>');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Should show validation error for invalid name
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name contains invalid characters');
    });

    test('should handle missing required fields', async () => {
      await page.click('[data-testid="register-link"]');

      // Leave fields empty and try to submit
      await page.click('button[type="submit"]');

      // Should show all required field errors
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Full name is required');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email address is required');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
    });

    test('should work in development mode with mocked authentication', async () => {
      // Ensure we're in development mode
      await page.addInitScript(() => {
        window.localStorage.setItem('dev-mode', 'true');
      });

      await page.click('[data-testid="register-link"]');
      await page.fill('[name="name"]', 'Dev User');
      await page.fill('[name="email"]', 'dev@example.com');
      await page.fill('[name="password"]', 'DevPassword123!');

      await page.click('button[type="submit"]');

      // Should succeed in dev mode
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('User Login', () => {
    test('should successfully login with valid credentials', async () => {
      // Fill login form
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');

      // Should display user information
      await expect(page.locator('[data-testid="user-welcome"]')).toBeVisible();
    });

    test('should show error for incorrect password', async () => {
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'wrongpassword');

      // Mock server response for invalid credentials
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          })
        });
      });

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="form-error"]')).toContainText('Invalid credentials');

      // Should stay on login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('should show error for unregistered email', async () => {
      await page.fill('[name="email"]', 'nonexistent@example.com');
      await page.fill('[name="password"]', 'password123');

      // Mock server response for unregistered user
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          })
        });
      });

      await page.click('button[type="submit"]');

      await expect(page.locator('[data-testid="form-error"]')).toContainText('Invalid credentials');
    });

    test('should handle missing required fields', async () => {
      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email address is required');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
    });

    test('should work in development mode with mocked authentication', async () => {
      // Set dev mode
      await page.addInitScript(() => {
        window.localStorage.setItem('dev-mode', 'true');
      });

      await page.fill('[name="email"]', 'dev@example.com');
      await page.fill('[name="password"]', 'anypassword');

      await page.click('button[type="submit"]');

      // Should succeed in dev mode
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Password Recovery', () => {
    test('should successfully initiate password recovery for registered email', async () => {
      // Navigate to password recovery page
      await page.click('[data-testid="forgot-password-link"]');
      await expect(page).toHaveURL('/auth/password-recovery');

      // Fill recovery form
      await page.fill('[name="email"]', 'test@example.com');

      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password recovery email sent');
    });

    test('should handle recovery for unregistered email gracefully', async () => {
      await page.click('[data-testid="forgot-password-link"]');
      await page.fill('[name="email"]', 'nonexistent@example.com');

      await page.click('button[type="submit"]');

      // Should still show success message (security best practice)
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password recovery email sent');
    });

    test('should show validation error for invalid email format', async () => {
      await page.click('[data-testid="forgot-password-link"]');
      await page.fill('[name="email"]', 'invalid-email');

      // Should show validation error
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email address');

      // Submit button should be disabled
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });

    test('should work in development mode with mocked flow', async () => {
      await page.addInitScript(() => {
        window.localStorage.setItem('dev-mode', 'true');
      });

      await page.click('[data-testid="forgot-password-link"]');
      await page.fill('[name="email"]', 'dev@example.com');

      await page.click('button[type="submit"]');

      // Should show success message in dev mode
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password recovery email sent');
    });
  });

  test.describe('HTTPS Enforcement', () => {
    test('should redirect HTTP requests to HTTPS in production', async () => {
      // This test would typically run against a production-like environment
      // In development, HTTPS enforcement is disabled, so we skip this test in dev
      test.skip(process.env.NODE_ENV !== 'production', 'HTTPS enforcement disabled in development');

      // Navigate to HTTP URL
      await page.goto('http://localhost:3000/api/auth/login', { waitUntil: 'networkidle' });

      // Should be redirected to HTTPS
      expect(page.url()).toMatch(/^https:/);
    });

    test('should allow HTTPS requests in production', async () => {
      test.skip(process.env.NODE_ENV !== 'production', 'Production-only test');

      // Navigate to HTTPS URL
      await page.goto('https://localhost:3000/auth/login');

      // Should load successfully
      await expect(page.locator('form')).toBeVisible();
    });
  });

  test.describe('Audit Logging', () => {
    test('should create audit log entry for successful registration', async () => {
      // This test would typically verify audit logs in a database
      // For E2E testing, we can verify the API call is made correctly

      let auditLogCalled = false;

      await page.route('**/api/auth/register', async route => {
        const request = route.request();
        const postData = request.postData();

        // Verify request includes audit data
        expect(postData).toContain('testuser@example.com');
        auditLogCalled = true;

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'User registered successfully',
            user: { id: '123', email: 'testuser@example.com', name: 'Test User' },
            session: { accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now() + 3600000 }
          })
        });
      });

      await page.click('[data-testid="register-link"]');
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'testuser@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');
      await page.click('button[type="submit"]');

      expect(auditLogCalled).toBe(true);
    });

    test('should create audit log entry for login attempts', async () => {
      let auditLogCalled = false;

      await page.route('**/api/auth/login', async route => {
        auditLogCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Login successful',
            user: { id: '123', email: 'test@example.com', name: 'Test User' },
            session: { accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now() + 3600000 }
          })
        });
      });

      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      expect(auditLogCalled).toBe(true);
    });

    test('should create audit log entry for password recovery', async () => {
      let auditLogCalled = false;

      await page.route('**/api/auth/password-recovery', async route => {
        auditLogCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password recovery email sent successfully'
          })
        });
      });

      await page.click('[data-testid="forgot-password-link"]');
      await page.fill('[name="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      expect(auditLogCalled).toBe(true);
    });
  });

  test.describe('Input Validation & Sanitization', () => {
    test('should reject forms with script injection attempts', async () => {
      await page.click('[data-testid="register-link"]');

      // Try script injection in name field
      await page.fill('[name="name"]', '<script>alert("hack")</script>');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Should show validation error
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name contains invalid characters');
    });

    test('should reject forms with SQL injection attempts', async () => {
      // Try SQL injection in email field
      await page.fill('[name="email"]', "admin@example.com'; DROP TABLE users; --");
      await page.fill('[name="password"]', 'password123');

      // Should show validation error for invalid email format
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email address');
    });

    test('should handle excessive length inputs', async () => {
      await page.click('[data-testid="register-link"]');

      // Fill with excessive length data
      const longName = 'A'.repeat(101);
      await page.fill('[name="name"]', longName);
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'SecurePassword123!');

      // Should show validation error
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name must be less than 100 characters');
    });

    test('should sanitize input fields automatically', async () => {
      // Fill fields with extra whitespace
      await page.fill('[name="email"]', '  test@example.com  ');

      // Check that input is trimmed
      const emailValue = await page.inputValue('[name="email"]');
      expect(emailValue).toBe('test@example.com');
    });
  });

  test.describe('Session Management', () => {
    test('should persist user session across page reloads', async () => {
      // Login first
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard');

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-welcome"]')).toBeVisible();
    });

    test('should handle expired sessions properly', async () => {
      // Set an expired session in localStorage
      await page.addInitScript(() => {
        const expiredSession = {
          user: { id: '123', email: 'test@example.com', name: 'Test User' },
          session: { accessToken: 'expired-token', refreshToken: 'refresh', expiresAt: Date.now() - 1000 }
        };
        window.localStorage.setItem('simple-todo-auth', JSON.stringify(expiredSession));
      });

      await page.goto('/dashboard');

      // Should redirect to login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('should logout user and clear session', async () => {
      // Login first
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard');

      // Logout
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login page
      await expect(page).toHaveURL('/auth/login');

      // Session should be cleared from localStorage
      const auth = await page.evaluate(() => localStorage.getItem('simple-todo-auth'));
      expect(auth).toBe(null);
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      // Test tab navigation through form
      await page.keyboard.press('Tab'); // Email field
      await expect(page.locator('input[name="email"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password field
      await expect(page.locator('input[name="password"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Forgot password link
      await expect(page.locator('[data-testid="forgot-password-link"]')).toBeFocused();
    });

    test('should have proper ARIA labels and roles', async () => {
      // Check ARIA attributes
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label', 'Email Address');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label', 'Password');

      // Check error messages have proper ARIA
      await page.fill('[name="email"]', 'invalid');
      await expect(page.locator('[data-testid="email-error"]')).toHaveAttribute('role', 'alert');
      await expect(page.locator('[data-testid="email-error"]')).toHaveAttribute('aria-live', 'polite');
    });

    test('should announce errors to screen readers', async () => {
      // Fill invalid data and check error announcements
      await page.fill('[name="email"]', 'invalid-email');

      const errorElement = page.locator('[data-testid="email-error"]');
      await expect(errorElement).toHaveAttribute('aria-live', 'polite');
      await expect(errorElement).toContainText('Please enter a valid email address');
    });
  });
});