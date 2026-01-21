/**
 * Event Types for Cross-Plugin Communication
 * 
 * Events enable loose coupling between plugins. Core events are always
 * available, while plugin events follow a namespace convention.
 */

import type { JSONSchema } from '../../types/schema';
import type { Path } from './plugin';

// ============================================================================
// Core Events (always available)
// ============================================================================

/**
 * All core events that plugins can subscribe to
 */
export type CoreEvent =
  | DocumentLoadedEvent
  | DocumentChangedEvent
  | SelectionChangedEvent
  | ValidationCompletedEvent
  | ThemeChangedEvent
  | PluginActivatedEvent
  | PluginDeactivatedEvent
  | ServiceRegisteredEvent;

/**
 * Emitted when a schema/document is loaded
 */
export interface DocumentLoadedEvent {
  type: 'document:loaded';
  payload: {
    schema: JSONSchema;
    data: unknown;
  };
}

/**
 * Emitted when document data changes
 */
export interface DocumentChangedEvent {
  type: 'document:changed';
  payload: {
    path: Path;
    value: unknown;
    previousValue: unknown;
  };
}

/**
 * Emitted when selection changes
 */
export interface SelectionChangedEvent {
  type: 'selection:changed';
  payload: {
    path: string | null;
    previousPath: string | null;
  };
}

/**
 * Emitted after validation completes
 */
export interface ValidationCompletedEvent {
  type: 'validation:completed';
  payload: {
    isValid: boolean;
    errorCount: number;
    errorPaths: string[];
  };
}

/**
 * Emitted when theme changes
 */
export interface ThemeChangedEvent {
  type: 'theme:changed';
  payload: {
    isDarkMode: boolean;
  };
}

/**
 * Emitted when a plugin is activated
 */
export interface PluginActivatedEvent {
  type: 'plugin:activated';
  payload: {
    pluginId: string;
  };
}

/**
 * Emitted when a plugin is deactivated
 */
export interface PluginDeactivatedEvent {
  type: 'plugin:deactivated';
  payload: {
    pluginId: string;
  };
}

/**
 * Emitted when a service is registered
 */
export interface ServiceRegisteredEvent {
  type: 'service:registered';
  payload: {
    serviceId: string;
    pluginId: string;
  };
}

// ============================================================================
// Event Type Extraction
// ============================================================================

/**
 * Get the payload type for a specific event type
 */
export type EventPayload<T extends CoreEvent['type']> = Extract<
  CoreEvent,
  { type: T }
>['payload'];

/**
 * Core event types as string literals
 */
export const CORE_EVENT_TYPES = [
  'document:loaded',
  'document:changed',
  'selection:changed',
  'validation:completed',
  'theme:changed',
  'plugin:activated',
  'plugin:deactivated',
  'service:registered',
] as const;

export type CoreEventType = (typeof CORE_EVENT_TYPES)[number];

/**
 * Check if an event type is a core event
 */
export function isCoreEvent(eventType: string): eventType is CoreEventType {
  return CORE_EVENT_TYPES.includes(eventType as CoreEventType);
}

// ============================================================================
// Event Subscription Types
// ============================================================================

/**
 * Event handler function type
 */
export type TypedEventHandler<T extends CoreEvent['type']> = (
  payload: EventPayload<T>
) => void;

/**
 * Generic event handler for custom events
 */
export type GenericEventHandler = (payload: unknown) => void;

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /** Only fire once then unsubscribe */
  once?: boolean;
  /** Priority (higher = called first) */
  priority?: number;
}

/**
 * Event subscription info (for debugging/tooling)
 */
export interface EventSubscription {
  eventType: string;
  pluginId: string;
  handler: GenericEventHandler;
  options?: SubscriptionOptions;
}
