/**
 * Login page component
 * @description Login page wrapper with layout and navigation
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@simple-todo/shared';
import { LoginFormComponent } from '../components/login-form.component';

/**
 * Login page component
 * @component LoginPage
 * @description Page component for user login
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoginFormComponent],
  template: `
    <div class="login-page">
      <div class="page-container">
        <!-- Header -->
        <header class="page-header">
          <div class="brand">
            <h1>📝 Simple Todo</h1>
            <p>Organize your tasks efficiently</p>
          </div>
        </header>

        <!-- Main Content -->
        <main class="page-content">
          <app-login-form (loggedIn)="onUserLoggedIn($event)"></app-login-form>
        </main>

        <!-- Footer -->
        <footer class="page-footer">
          <p>&copy; 2024 Simple Todo. Built with Angular 20 & Supabase.</p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .page-container {
      width: 100%;
      max-width: 480px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;

      .brand h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .brand p {
        font-size: 1.125rem;
        margin: 0;
        opacity: 0.9;
      }
    }

    .page-content {
      margin-bottom: 2rem;
    }

    .page-footer {
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;

      p {
        margin: 0;
      }
    }

    @media (max-width: 640px) {
      .page-header .brand h1 {
        font-size: 2rem;
      }

      .page-header .brand p {
        font-size: 1rem;
      }
    }
  `]
})
export class LoginPage {
  /**
   * Router service for navigation
   * @private
   * @readonly
   */
  private readonly router = inject(Router);

  /**
   * Handles successful user login
   * @method onUserLoggedIn
   * @param {User} user - The logged in user
   */
  onUserLoggedIn(user: User): void {
    console.log('User logged in on page:', user.email);
    // Navigation is handled by the form component
  }
}