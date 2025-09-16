/**
 * Dashboard page component
 * @description Main dashboard for authenticated users
 */

import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

/**
 * Dashboard page component
 * @component DashboardPage
 * @description Main application dashboard
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <!-- Navigation Bar -->
      <nav class="navbar">
        <div class="nav-brand">
          <h1>📝 Simple Todo</h1>
        </div>

        <div class="nav-user">
          @if (authService.user(); as user) {
            <div class="user-info">
              <span class="user-name">{{ authService.userDisplayName() }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <button
              type="button"
              class="logout-button"
              (click)="onLogout()"
              [disabled]="authService.isLoading()"
            >
              {{ authService.isLoading() ? 'Signing out...' : 'Sign Out' }}
            </button>
          }
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <div class="welcome-section">
          <h2>Welcome to Simple Todo! 🎉</h2>
          <p>Your authentication system is working perfectly.</p>

          @if (authService.user(); as user) {
            <div class="user-card">
              <h3>Your Profile</h3>
              <div class="profile-details">
                <div class="profile-item">
                  <strong>Name:</strong>
                  <span>{{ user.name }}</span>
                </div>
                <div class="profile-item">
                  <strong>Email:</strong>
                  <span>{{ user.email }}</span>
                </div>
                <div class="profile-item">
                  <strong>Member Since:</strong>
                  <span>{{ user.createdAt | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>
          }

          <div class="features-section">
            <h3>What's Next?</h3>
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">✅</div>
                <h4>Task Management</h4>
                <p>Create, organize, and track your tasks efficiently</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h4>Progress Tracking</h4>
                <p>Monitor your productivity with detailed insights</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <h4>Secure & Private</h4>
                <p>Your data is protected with enterprise-grade security</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h4>Cross-Platform</h4>
                <p>Access your todos from any device, anywhere</p>
              </div>
            </div>
          </div>

          <!-- Development Info -->
          @if (isDevelopmentMode()) {
            <div class="dev-info">
              <h3>🔧 Development Information</h3>
              <div class="dev-details">
                <p><strong>Authentication:</strong> Mocked (Supabase integration ready)</p>
                <p><strong>Backend:</strong> Express.js with security middleware</p>
                <p><strong>Frontend:</strong> Angular 20 with signals & zoneless change detection</p>
                <p><strong>Validation:</strong> Comprehensive input sanitization active</p>
                <p><strong>Audit Logging:</strong> All auth events logged to console</p>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f8fafc;
    }

    .navbar {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

      .nav-brand h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .nav-user {
        display: flex;
        align-items: center;
        gap: 1rem;

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          .user-name {
            font-weight: 600;
            color: #1e293b;
            font-size: 0.875rem;
          }

          .user-email {
            color: #64748b;
            font-size: 0.75rem;
          }
        }

        .logout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover:not(:disabled) {
            background: #dc2626;
          }

          &:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        }
      }
    }

    .main-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-section {
      text-align: center;

      h2 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 1rem 0;
      }

      > p {
        font-size: 1.25rem;
        color: #64748b;
        margin-bottom: 3rem;
      }
    }

    .user-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin: 2rem 0;
      text-align: left;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;

      h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1.5rem 0;
        text-align: center;
      }

      .profile-details {
        display: grid;
        gap: 1rem;

        .profile-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e2e8f0;

          &:last-child {
            border-bottom: none;
          }

          strong {
            color: #374151;
            font-weight: 600;
          }

          span {
            color: #6b7280;
          }
        }
      }
    }

    .features-section {
      margin-top: 4rem;

      h3 {
        font-size: 2rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2rem;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }

      .feature-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px -1px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        p {
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        }
      }
    }

    .dev-info {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 2rem;
      margin: 3rem 0;
      text-align: left;

      h3 {
        color: #92400e;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
        text-align: center;
      }

      .dev-details {
        display: grid;
        gap: 0.5rem;

        p {
          color: #78350f;
          margin: 0;
          font-size: 0.875rem;

          strong {
            font-weight: 600;
            color: #78350f;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .navbar {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;

        .nav-user {
          width: 100%;
          justify-content: space-between;
        }
      }

      .main-content {
        padding: 1rem;
      }

      .welcome-section h2 {
        font-size: 2rem;
      }

      .features-section .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPage implements OnInit {
  /**
   * Authentication service
   * @readonly
   */
  readonly authService = inject(AuthService);

  /**
   * Router service for navigation
   * @private
   * @readonly
   */
  private readonly router = inject(Router);

  /**
   * Component initialization
   * @lifecycle OnInit
   */
  ngOnInit(): void {
    // Check authentication status
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  /**
   * Checks if application is in development mode
   * @method isDevelopmentMode
   * @returns {boolean} True if in development mode
   */
  isDevelopmentMode(): boolean {
    return !!(window as any)['ngDevMode'] || (window as any)['ng'];
  }

  /**
   * Handles user logout
   * @method onLogout
   * @async
   */
  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
      // Navigation is handled by the auth service
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}