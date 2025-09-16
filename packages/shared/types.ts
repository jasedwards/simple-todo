/**
 * Shared type definitions for Simple Todo application
 * @description Core interfaces and types used across frontend and backend
 */

/**
 * Base entity interface
 * @interface BaseEntity
 * @description Common fields for all entities
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task entity interface
 * @interface Task
 * @description Represents a todo task
 * @extends BaseEntity
 */
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  priority: TaskPriority;
  userId: string;
}

/**
 * Task priority levels
 * @enum TaskPriority
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * User entity interface
 * @interface User
 * @description Represents a user
 * @extends BaseEntity
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
}

/**
 * User registration request
 * @interface RegisterRequest
 * @description Data required for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * User login request
 * @interface LoginRequest
 * @description Data required for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Password recovery request
 * @interface PasswordRecoveryRequest
 * @description Data required to initiate password recovery
 */
export interface PasswordRecoveryRequest {
  email: string;
}

/**
 * Password reset request
 * @interface PasswordResetRequest
 * @description Data required to reset password
 */
export interface PasswordResetRequest {
  token: string;
  password: string;
}

/**
 * Authentication response
 * @interface AuthResponse
 * @description Response from successful authentication
 */
export interface AuthResponse {
  user: User;
  session: AuthSession;
}

/**
 * Authentication session
 * @interface AuthSession
 * @description User session information
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Audit log entry
 * @interface AuditLog
 * @description System audit log entry
 * @extends BaseEntity
 */
export interface AuditLog extends BaseEntity {
  userId?: string;
  action: AuditAction;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit action types
 * @enum AuditAction
 */
export enum AuditAction {
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_RECOVERY_INITIATED = 'PASSWORD_RECOVERY_INITIATED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED'
}

// Removed ApiError - defined locally in auth.service.ts