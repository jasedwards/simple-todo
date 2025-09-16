/**
 * Authentication routes configuration
 * @description Route definitions for authentication pages
 */

import { Routes } from '@angular/router';

/**
 * Authentication routes
 * @constant authRoutes
 * @description All authentication-related routes with lazy loading
 */
export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then(m => m.LoginPage),
    title: 'Sign In - Simple Todo'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.page').then(m => m.RegisterPage),
    title: 'Create Account - Simple Todo'
  },
  {
    path: 'recover',
    loadComponent: () => import('./pages/password-recovery.page').then(m => m.PasswordRecoveryPage),
    title: 'Reset Password - Simple Todo'
  }
];