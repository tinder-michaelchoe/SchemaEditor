/**
 * Simple API ("The Twenty Things")
 * 
 * A simplified API layer for common plugin operations.
 * Covers 80% of use cases with a minimal interface.
 */

import type { JSONSchema } from '../types/schema';
import type { Path, Unsubscribe } from './types/plugin';
import { eventBus } from './EventBus';
import { actionAPI } from './ActionAPI';
import type { CoreStores } from './PluginContext';

// ============================================================================
// Types
// ============================================================================

/**
 * Notification type
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification handler
 */
export type NotificationHandler = (
  message: string,
  type: NotificationType
) => void;

/**
 * Simple Plugin API interface
 * Provides a streamlined interface for common operations
 */
export interface SimplePluginAPI {
  // === Document (read-only) ===
  readonly schema: JSONSchema | null;
  readonly data: unknown;
  readonly isValid: boolean;

  // === Value Access ===
  getValue(path: string): unknown;
  setValue(path: string, value: unknown): void;

  // === Selection ===
  readonly selectedPath: string | null;
  select(path: string | null): void;

  // === UI ===
  readonly isDarkMode: boolean;

  // === Notifications ===
  notify(message: string, type: NotificationType): void;

  // === Events (simplified) ===
  on(event: string, handler: (payload: unknown) => void): () => void;
  emit(event: string, payload?: unknown): void;
}

// ============================================================================
// Simple API Implementation
// ============================================================================

export class SimpleAPIImpl implements SimplePluginAPI {
  private stores: CoreStores | null = null;
  private notificationHandler: NotificationHandler | null = null;
  private pluginId: string;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  /**
   * Set the core stores
   */
  setStores(stores: CoreStores): void {
    this.stores = stores;
  }

  /**
   * Set the notification handler
   */
  setNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandler = handler;
  }

  // === Document Access ===

  get schema(): JSONSchema | null {
    return this.stores?.document.getSchema() ?? null;
  }

  get data(): unknown {
    return this.stores?.document.getData();
  }

  get isValid(): boolean {
    return this.stores?.document.isValid() ?? true;
  }

  // === Value Access ===

  getValue(path: string): unknown {
    const pathArray = parsePath(path);
    return actionAPI.getValue(pathArray);
  }

  setValue(path: string, value: unknown): void {
    const pathArray = parsePath(path);
    actionAPI.updateValue(this.pluginId, pathArray, value);
  }

  // === Selection ===

  get selectedPath(): string | null {
    return this.stores?.selection.getSelectedPath() ?? null;
  }

  select(path: string | null): void {
    const previousPath = this.stores?.selection.getSelectedPath() ?? null;
    this.stores?.selection.setSelectedPath(path);
    eventBus.emitCore('selection:changed', { path, previousPath });
  }

  // === UI ===

  get isDarkMode(): boolean {
    return this.stores?.ui.isDarkMode() ?? false;
  }

  // === Notifications ===

  notify(message: string, type: NotificationType): void {
    if (this.notificationHandler) {
      this.notificationHandler(message, type);
    } else {
      // Fallback to console
      const methods = {
        info: console.info,
        success: console.log,
        warning: console.warn,
        error: console.error,
      };
      methods[type](`[${this.pluginId}] ${message}`);
    }
  }

  // === Events ===

  on(event: string, handler: (payload: unknown) => void): () => void {
    return eventBus.subscribe(event, handler, { pluginId: this.pluginId });
  }

  emit(event: string, payload?: unknown): void {
    eventBus.emit(event, payload, this.pluginId);
  }
}

// ============================================================================
// Simple API Factory
// ============================================================================

export class SimpleAPIFactory {
  private stores: CoreStores | null = null;
  private notificationHandler: NotificationHandler | null = null;
  private instances = new Map<string, SimpleAPIImpl>();

  /**
   * Set the core stores
   */
  setStores(stores: CoreStores): void {
    this.stores = stores;
    // Update existing instances
    for (const instance of this.instances.values()) {
      instance.setStores(stores);
    }
  }

  /**
   * Set the notification handler
   */
  setNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandler = handler;
    // Update existing instances
    for (const instance of this.instances.values()) {
      instance.setNotificationHandler(handler);
    }
  }

  /**
   * Create a Simple API for a plugin
   */
  create(pluginId: string): SimplePluginAPI {
    let instance = this.instances.get(pluginId);
    if (!instance) {
      instance = new SimpleAPIImpl(pluginId);
      if (this.stores) {
        instance.setStores(this.stores);
      }
      if (this.notificationHandler) {
        instance.setNotificationHandler(this.notificationHandler);
      }
      this.instances.set(pluginId, instance);
    }
    return instance;
  }

  /**
   * Remove a plugin's Simple API instance
   */
  remove(pluginId: string): void {
    this.instances.delete(pluginId);
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear(): void {
    this.instances.clear();
  }
}

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Parse a path string into an array
 * Supports: "root.property", "root[0].property", "root.nested.path"
 */
function parsePath(pathStr: string): Path {
  if (!pathStr || pathStr === 'root') {
    return [];
  }

  // Remove 'root.' prefix if present
  const normalized = pathStr.startsWith('root.')
    ? pathStr.slice(5)
    : pathStr.startsWith('root')
    ? pathStr.slice(4)
    : pathStr;

  if (!normalized) {
    return [];
  }

  const segments: Path = [];
  let current = '';
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];

    if (char === '.') {
      if (current) {
        segments.push(current);
        current = '';
      }
      i++;
    } else if (char === '[') {
      if (current) {
        segments.push(current);
        current = '';
      }
      // Find closing bracket
      const end = normalized.indexOf(']', i);
      if (end === -1) {
        throw new Error(`Invalid path: unclosed bracket in "${pathStr}"`);
      }
      const index = normalized.slice(i + 1, end);
      segments.push(parseInt(index, 10));
      i = end + 1;
    } else {
      current += char;
      i++;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

/**
 * Convert a path array to a string
 */
export function pathToString(path: Path): string {
  if (path.length === 0) {
    return 'root';
  }

  let result = 'root';
  for (const segment of path) {
    if (typeof segment === 'number') {
      result += `[${segment}]`;
    } else {
      result += `.${segment}`;
    }
  }
  return result;
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global Simple API factory
 */
export const simpleAPIFactory = new SimpleAPIFactory();
