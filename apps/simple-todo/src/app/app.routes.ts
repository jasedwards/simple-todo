import { Routes } from '@angular/router';

/**
 * Application routes configuration
 * @constant appRoutes
 * @description Main application routes with authentication integration
 */
export const appRoutes: Routes = [
  // Default redirect to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Authentication routes
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
  },

  // Dashboard route (protected)
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    title: 'Dashboard - Simple Todo'
  },

  // Fallback route for unmatched paths
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
