/**
 * Shared utility functions
 * @description Common utilities used across the application
 */

/**
 * Generates a unique ID
 * @function generateId
 * @returns {string} Unique identifier
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Formats a date for display
 * @function formatDate
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Validates email format
 * @function isValidEmail
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}