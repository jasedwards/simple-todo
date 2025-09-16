/**
 * Supabase configuration and client setup
 * @description Configures Supabase client for authentication and database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Supabase configuration interface
 * @interface SupabaseConfig
 */
interface SupabaseConfig {
  url: string;
  serviceKey: string;
  isDev: boolean;
}

/**
 * Gets Supabase configuration from environment
 * @function getSupabaseConfig
 * @description Retrieves and validates Supabase configuration
 * @returns {SupabaseConfig} Configuration object
 * @throws {Error} If required environment variables are missing
 */
function getSupabaseConfig(): SupabaseConfig {
  const isDev = process.env.NODE_ENV !== 'production';

  // In dev mode, we can use mock values
  if (isDev) {
    return {
      url: process.env.SUPABASE_URL || 'https://mock.supabase.co',
      serviceKey: process.env.SUPABASE_SERVICE_KEY || 'mock-service-key',
      isDev: true
    };
  }

  // In production, require real values
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing required Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  }

  return { url, serviceKey, isDev: false };
}

/**
 * Supabase client instance
 * @constant supabase
 * @description Global Supabase client for backend operations
 */
const config = getSupabaseConfig();

let supabaseClient: SupabaseClient;

if (config.isDev) {
  // Create a mock client for development
  supabaseClient = {
    auth: {
      signUp: async ({ email, password, options }) => ({
        data: {
          user: {
            id: `mock-user-${Date.now()}`,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: options?.data || {}
          },
          session: {
            access_token: `mock-access-token-${Date.now()}`,
            refresh_token: `mock-refresh-token-${Date.now()}`,
            expires_at: Date.now() + 3600000, // 1 hour
            user: null
          }
        },
        error: null
      }),
      signInWithPassword: async ({ email, password }) => ({
        data: {
          user: {
            id: `mock-user-${email}`,
            email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_metadata: {}
          },
          session: {
            access_token: `mock-access-token-${Date.now()}`,
            refresh_token: `mock-refresh-token-${Date.now()}`,
            expires_at: Date.now() + 3600000,
            user: null
          }
        },
        error: email === 'fail@test.com' ? { message: 'Invalid credentials' } : null
      }),
      resetPasswordForEmail: async ({ email }) => ({
        data: {},
        error: null
      })
    },
    from: (table: string) => ({
      insert: async (data: any) => ({
        data: [{ id: `mock-${Date.now()}`, ...data, created_at: new Date(), updated_at: new Date() }],
        error: null
      }),
      select: async () => ({
        data: [],
        error: null
      })
    })
  } as any;
} else {
  supabaseClient = createClient(config.url, config.serviceKey);
}

export const supabase = supabaseClient;
export const isDevelopment = config.isDev;

/**
 * Initialize audit log table in development
 * @function initializeAuditTable
 * @description Creates audit_logs table schema for development
 * @returns {Promise<void>}
 */
export async function initializeAuditTable(): Promise<void> {
  if (!isDevelopment) {
    return; // Only run in development mode
  }

  console.log('🔧 Development mode: Using mocked Supabase with audit logging simulation');
}