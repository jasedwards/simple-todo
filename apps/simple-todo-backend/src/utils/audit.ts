/**
 * Audit logging utilities
 * @description Comprehensive audit logging for security events
 */

import { AuditLog, AuditAction } from '@simple-todo/shared';
import { supabase, isDevelopment } from '../config/supabase';

/**
 * Audit log service
 * @class AuditService
 * @description Handles creation and storage of audit logs
 */
export class AuditService {
  /**
   * Creates an audit log entry
   * @method createAuditLog
   * @description Records an audit log entry for security events
   * @param {AuditAction} action - The action being audited
   * @param {string} [userId] - User ID if available
   * @param {Record<string, any>} [details] - Additional details about the action
   * @param {string} [ipAddress] - Client IP address
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   */
  static async createAuditLog(
    action: AuditAction,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const auditEntry: Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        action,
        details: details || {},
        ipAddress,
        userAgent
      };

      if (isDevelopment) {
        // In development mode, just log to console
        console.log('🔍 AUDIT LOG:', {
          timestamp: new Date().toISOString(),
          ...auditEntry
        });
        return;
      }

      // In production, store in Supabase
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          ...auditEntry,
          created_at: new Date(),
          updated_at: new Date()
        }]);

      if (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error - audit logging failures shouldn't break the main flow
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Silently fail - audit logging shouldn't break the application
    }
  }

  /**
   * Records user registration audit log
   * @method logUserRegistration
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} [ipAddress] - Client IP
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   */
  static async logUserRegistration(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog(
      AuditAction.USER_REGISTER,
      userId,
      { email, success: true },
      ipAddress,
      userAgent
    );
  }

  /**
   * Records user login audit log
   * @method logUserLogin
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {boolean} success - Login success status
   * @param {string} [ipAddress] - Client IP
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   */
  static async logUserLogin(
    userId: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog(
      AuditAction.USER_LOGIN,
      userId,
      { email, success },
      ipAddress,
      userAgent
    );
  }

  /**
   * Records user logout audit log
   * @method logUserLogout
   * @param {string} userId - User ID
   * @param {string} [ipAddress] - Client IP
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   */
  static async logUserLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog(
      AuditAction.USER_LOGOUT,
      userId,
      { success: true },
      ipAddress,
      userAgent
    );
  }

  /**
   * Records password recovery initiation
   * @method logPasswordRecoveryInitiated
   * @param {string} email - User email
   * @param {string} [ipAddress] - Client IP
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   */
  static async logPasswordRecoveryInitiated(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog(
      AuditAction.PASSWORD_RECOVERY_INITIATED,
      undefined, // No userId available during recovery initiation
      { email },
      ipAddress,
      userAgent
    );
  }

  /**
   * Records password reset completion
   * @method logPasswordResetCompleted
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {boolean} success - Reset success status
   * @param {string} [ipAddress] - Client IP
   * @param {string} [userAgent] - Client user agent
   * @returns {Promise<void>}
   */
  static async logPasswordResetCompleted(
    userId: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const action = success ? AuditAction.PASSWORD_RESET_COMPLETED : AuditAction.PASSWORD_RESET_FAILED;

    await this.createAuditLog(
      action,
      userId,
      { email, success },
      ipAddress,
      userAgent
    );
  }
}

/**
 * Helper function to extract client information from Express request
 * @function getClientInfo
 * @description Extracts IP address and user agent from request
 * @param {any} req - Express request object
 * @returns {{ ipAddress?: string, userAgent?: string }} Client information
 */
export function getClientInfo(req: any): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent']
  };
}