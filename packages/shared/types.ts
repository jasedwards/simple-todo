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