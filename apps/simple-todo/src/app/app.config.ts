import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appRoutes } from './app.routes';

/**
 * Application configuration for the simple-todo Angular application.
 *
 * This configuration implements the mandatory coding standards:
 * - Zoneless change detection for optimal performance
 * - Global error listeners for proper error handling
 * - Router configuration for navigation
 *
 * @constant
 * @type {ApplicationConfig}
 * @example
 * ```typescript
 * bootstrapApplication(App, appConfig);
 * ```
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /** Global error listeners for comprehensive error handling */
    provideBrowserGlobalErrorListeners(),
    /** Zoneless change detection per coding standards (Angular 20.2.0) */
    provideZonelessChangeDetection(),
    /** HTTP client with fetch API for better performance */
    provideHttpClient(withFetch()),
    /** Router configuration with application routes */
    provideRouter(appRoutes),
  ],
};
