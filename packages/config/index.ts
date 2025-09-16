/**
 * Shared configuration for Simple Todo application
 * @packageDocumentation
 */

/**
 * Environment configuration interface
 * @interface EnvironmentConfig
 */
export interface EnvironmentConfig {
  production: boolean;
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Default environment configuration
 * @constant defaultConfig
 */
export const defaultConfig: Partial<EnvironmentConfig> = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};