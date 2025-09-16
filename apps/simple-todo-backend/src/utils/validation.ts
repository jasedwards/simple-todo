/**
 * Input validation utilities
 * @description Comprehensive input validation and sanitization functions
 */

import validator from 'validator';
import { RegisterRequest, LoginRequest, PasswordRecoveryRequest, PasswordResetRequest } from '@simple-todo/shared';

/**
 * Validation result interface
 * @interface ValidationResult
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Sanitizes and validates email address
 * @function validateEmail
 * @description Validates and normalizes email addresses
 * @param {string} email - Email to validate
 * @returns {ValidationResult} Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // Sanitize email
  const sanitizedEmail = validator.normalizeEmail(email.trim()) || '';

  // Validate email format
  if (!validator.isEmail(sanitizedEmail)) {
    errors.push('Invalid email format');
  }

  // Check email length
  if (sanitizedEmail.length > 254) {
    errors.push('Email address too long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates password strength
 * @function validatePassword
 * @description Validates password meets security requirements
 * @param {string} password - Password to validate
 * @returns {ValidationResult} Validation result
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length (prevent DoS)
  if (password.length > 128) {
    errors.push('Password too long');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for at least one digit
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates and sanitizes name
 * @function validateName
 * @description Validates user display name
 * @param {string} name - Name to validate
 * @returns {ValidationResult} Validation result
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
    return { isValid: false, errors };
  }

  // Sanitize name (remove excessive whitespace, trim)
  const sanitizedName = name.trim().replace(/\s+/g, ' ');

  // Check length
  if (sanitizedName.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (sanitizedName.length > 100) {
    errors.push('Name too long (max 100 characters)');
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(sanitizedName)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes string input to prevent XSS
 * @function sanitizeString
 * @description Removes potentially dangerous characters from string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return validator.escape(input.trim());
}

/**
 * Validates registration request data
 * @function validateRegistrationRequest
 * @description Validates complete registration request
 * @param {any} data - Registration data to validate
 * @returns {ValidationResult & { data?: RegisterRequest }} Validation result with sanitized data
 */
export function validateRegistrationRequest(data: any): ValidationResult & { data?: RegisterRequest } {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data?.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  // Validate password
  const passwordValidation = validatePassword(data?.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate name
  const nameValidation = validateName(data?.name);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return sanitized data
  const sanitizedData: RegisterRequest = {
    email: validator.normalizeEmail(data.email.trim()) || '',
    password: data.password, // Don't sanitize passwords
    name: sanitizeString(data.name)
  };

  return {
    isValid: true,
    errors: [],
    data: sanitizedData
  };
}

/**
 * Validates login request data
 * @function validateLoginRequest
 * @description Validates complete login request
 * @param {any} data - Login data to validate
 * @returns {ValidationResult & { data?: LoginRequest }} Validation result with sanitized data
 */
export function validateLoginRequest(data: any): ValidationResult & { data?: LoginRequest } {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data?.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  // Basic password check (don't apply strength requirements for login)
  if (!data?.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return sanitized data
  const sanitizedData: LoginRequest = {
    email: validator.normalizeEmail(data.email.trim()) || '',
    password: data.password
  };

  return {
    isValid: true,
    errors: [],
    data: sanitizedData
  };
}

/**
 * Validates password recovery request
 * @function validatePasswordRecoveryRequest
 * @description Validates password recovery request
 * @param {any} data - Recovery data to validate
 * @returns {ValidationResult & { data?: PasswordRecoveryRequest }} Validation result with sanitized data
 */
export function validatePasswordRecoveryRequest(data: any): ValidationResult & { data?: PasswordRecoveryRequest } {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data?.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return sanitized data
  const sanitizedData: PasswordRecoveryRequest = {
    email: validator.normalizeEmail(data.email.trim()) || ''
  };

  return {
    isValid: true,
    errors: [],
    data: sanitizedData
  };
}

/**
 * Validates password reset request
 * @function validatePasswordResetRequest
 * @description Validates password reset request
 * @param {any} data - Reset data to validate
 * @returns {ValidationResult & { data?: PasswordResetRequest }} Validation result with sanitized data
 */
export function validatePasswordResetRequest(data: any): ValidationResult & { data?: PasswordResetRequest } {
  const errors: string[] = [];

  // Validate token
  if (!data?.token || typeof data.token !== 'string') {
    errors.push('Reset token is required');
  } else if (data.token.length < 10) {
    errors.push('Invalid reset token');
  }

  // Validate new password
  const passwordValidation = validatePassword(data?.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Return sanitized data
  const sanitizedData: PasswordResetRequest = {
    token: sanitizeString(data.token),
    password: data.password
  };

  return {
    isValid: true,
    errors: [],
    data: sanitizedData
  };
}