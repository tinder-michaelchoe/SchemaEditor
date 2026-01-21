/**
 * Service Types
 * 
 * Services enable decoupled functionality sharing between plugins.
 * Unlike extension points (which are about extending UI or behavior),
 * services are about providing reusable functionality.
 */

import type { Unsubscribe } from './plugin';

// ============================================================================
// Service Registry Types
// ============================================================================

/**
 * Internal representation of a registered service
 */
export interface RegisteredService {
  /** Service ID */
  id: string;
  /** Plugin that provides this service */
  pluginId: string;
  /** The service implementation */
  implementation: unknown;
  /** TypeScript interface name (for documentation) */
  interfaceName: string;
}

/**
 * Callback for service availability notifications
 */
export type ServiceAvailableCallback<T = unknown> = (service: T) => void;

// ============================================================================
// Common Service Interfaces
// ============================================================================

/**
 * Style resolver service interface
 * Provided by design system plugins to resolve style IDs to computed styles
 */
export interface IStyleResolver {
  /**
   * Resolve a style ID to computed style values
   * @param styleId - Style ID (e.g., "@button.primary")
   * @returns Resolved style or undefined if not found
   */
  resolveStyle(styleId: string): ResolvedStyle | undefined;

  /**
   * Check if a style ID exists
   */
  hasStyle(styleId: string): boolean;

  /**
   * Get all available styles
   */
  getAllStyles(): Map<string, ResolvedStyle>;

  /**
   * Get style categories (for UI grouping)
   */
  getCategories(): StyleCategory[];
}

/**
 * Resolved style values
 */
export interface ResolvedStyle {
  /** Style ID */
  id: string;
  /** Display name */
  name: string;
  /** Category */
  category: string;
  /** CSS properties */
  properties: Record<string, string | number>;
  /** Description */
  description?: string;
  /** Preview color (for UI) */
  previewColor?: string;
}

/**
 * Style category for grouping
 */
export interface StyleCategory {
  id: string;
  name: string;
  description?: string;
}

/**
 * Component registry service interface
 * Provided by palette plugins to look up available components
 */
export interface IComponentRegistry {
  /**
   * Get all available components
   */
  getComponents(): ComponentInfo[];

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentInfo[];

  /**
   * Get component by type
   */
  getComponent(type: string): ComponentInfo | undefined;

  /**
   * Get all categories
   */
  getCategories(): string[];

  /**
   * Search components
   */
  searchComponents(query: string): ComponentInfo[];
}

/**
 * Component information
 */
export interface ComponentInfo {
  /** Unique component type */
  type: string;
  /** Display name */
  name: string;
  /** Category */
  category: string;
  /** Description */
  description?: string;
  /** Icon (component or string) */
  icon?: React.ReactNode;
  /** JSON Schema for component properties */
  propsSchema?: Record<string, unknown>;
  /** Default values */
  defaultProps?: Record<string, unknown>;
  /** Source plugin */
  source: string;
}

/**
 * Validation service interface
 * Can be consumed by plugins that need schema validation
 */
export interface IValidationService {
  /**
   * Validate data against schema
   */
  validate(data: unknown, schema: unknown): ValidationResult;

  /**
   * Validate partial data at a path
   */
  validateAtPath(
    data: unknown,
    schema: unknown,
    path: string
  ): ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorInfo[];
}

/**
 * Validation error info
 */
export interface ValidationErrorInfo {
  path: string;
  message: string;
  keyword: string;
  params?: Record<string, unknown>;
}

/**
 * Notification service interface
 * For showing user notifications
 */
export interface INotificationService {
  /**
   * Show an info notification
   */
  info(message: string, options?: NotificationOptions): void;

  /**
   * Show a success notification
   */
  success(message: string, options?: NotificationOptions): void;

  /**
   * Show a warning notification
   */
  warning(message: string, options?: NotificationOptions): void;

  /**
   * Show an error notification
   */
  error(message: string, options?: NotificationOptions): void;

  /**
   * Clear all notifications
   */
  clear(): void;
}

/**
 * Notification options
 */
export interface NotificationOptions {
  /** Duration in ms (0 = persistent) */
  duration?: number;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Well-Known Service IDs
// ============================================================================

/**
 * Well-known service IDs
 * Plugins should use these constants instead of hardcoding strings
 */
export const SERVICES = {
  /** Style resolution service */
  STYLE_RESOLVER: 'style-resolver',
  /** Component registry service */
  COMPONENT_REGISTRY: 'component-registry',
  /** Validation service */
  VALIDATION: 'validation',
  /** Notification service */
  NOTIFICATION: 'notification',
} as const;

export type WellKnownService = (typeof SERVICES)[keyof typeof SERVICES];
