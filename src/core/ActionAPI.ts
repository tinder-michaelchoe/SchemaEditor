/**
 * Action API
 * 
 * Safe mutation layer with validation and logging.
 * All state changes must go through actions.
 */

import type { Path } from './types/plugin';
import { eventBus } from './EventBus';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of an action
 */
export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  pluginId: string;
  action: string;
  path?: Path;
  value?: unknown;
  previousValue?: unknown;
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * Store interface for ActionAPI to interact with
 */
export interface DocumentStore {
  getSchema(): unknown;
  getData(): unknown;
  getValueAtPath(path: Path): unknown;
  setValueAtPath(path: Path, value: unknown): void;
  addArrayItem(path: Path, value?: unknown): void;
  removeArrayItem(path: Path, index: number): void;
  addObjectProperty(path: Path, key: string, value?: unknown): void;
  removeObjectProperty(path: Path, key: string): void;
  setData(data: unknown): void;
  resetData(): void;
  validate(): { isValid: boolean; errors: Map<string, unknown[]> };
}

// ============================================================================
// Action API Class
// ============================================================================

export class ActionAPI {
  private store: DocumentStore | null = null;
  private auditLog: AuditLogEntry[] = [];
  private auditLogLimit = 1000;

  /**
   * Set the document store
   */
  setStore(store: DocumentStore): void {
    this.store = store;
  }

  /**
   * Create a plugin-scoped action API
   */
  createForPlugin(pluginId: string): PluginActionAPI {
    return new PluginActionAPI(this, pluginId);
  }

  /**
   * Update a value at a path
   */
  updateValue(
    pluginId: string,
    path: Path,
    value: unknown
  ): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'updateValue', false, 'Store not initialized', { path });
    }

    const previousValue = this.store.getValueAtPath(path);

    try {
      this.store.setValueAtPath(path, value);

      // Validate
      const { isValid, errors } = this.store.validate();

      // Emit event
      eventBus.emitCore('document:changed', {
        path,
        value,
        previousValue,
      });

      // Emit validation event
      eventBus.emitCore('validation:completed', {
        isValid,
        errorCount: errors.size,
        errorPaths: Array.from(errors.keys()),
      });

      return this.logAndReturn(pluginId, 'updateValue', true, undefined, {
        path,
        value,
        previousValue,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'updateValue', false, message, { path, value });
    }
  }

  /**
   * Add an item to an array
   */
  addArrayItem(
    pluginId: string,
    path: Path,
    value?: unknown
  ): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'addArrayItem', false, 'Store not initialized', { path });
    }

    try {
      this.store.addArrayItem(path, value);

      // Emit event
      eventBus.emitCore('document:changed', {
        path,
        value: this.store.getValueAtPath(path),
        previousValue: undefined,
      });

      return this.logAndReturn(pluginId, 'addArrayItem', true, undefined, { path, value });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'addArrayItem', false, message, { path });
    }
  }

  /**
   * Remove an item from an array
   */
  removeArrayItem(
    pluginId: string,
    path: Path,
    index: number
  ): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'removeArrayItem', false, 'Store not initialized', { path });
    }

    try {
      const array = this.store.getValueAtPath(path);
      const previousValue = Array.isArray(array) ? array[index] : undefined;

      this.store.removeArrayItem(path, index);

      eventBus.emitCore('document:changed', {
        path: [...path, index],
        value: undefined,
        previousValue,
      });

      return this.logAndReturn(pluginId, 'removeArrayItem', true, undefined, {
        path,
        value: index,
        previousValue,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'removeArrayItem', false, message, { path });
    }
  }

  /**
   * Add a property to an object
   */
  addObjectProperty(
    pluginId: string,
    path: Path,
    key: string,
    value?: unknown
  ): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'addObjectProperty', false, 'Store not initialized', { path });
    }

    try {
      this.store.addObjectProperty(path, key, value);

      eventBus.emitCore('document:changed', {
        path: [...path, key],
        value,
        previousValue: undefined,
      });

      return this.logAndReturn(pluginId, 'addObjectProperty', true, undefined, {
        path: [...path, key],
        value,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'addObjectProperty', false, message, { path });
    }
  }

  /**
   * Remove a property from an object
   */
  removeObjectProperty(
    pluginId: string,
    path: Path,
    key: string
  ): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'removeObjectProperty', false, 'Store not initialized', { path });
    }

    try {
      const obj = this.store.getValueAtPath(path) as Record<string, unknown> | undefined;
      const previousValue = obj?.[key];

      this.store.removeObjectProperty(path, key);

      eventBus.emitCore('document:changed', {
        path: [...path, key],
        value: undefined,
        previousValue,
      });

      return this.logAndReturn(pluginId, 'removeObjectProperty', true, undefined, {
        path: [...path, key],
        previousValue,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'removeObjectProperty', false, message, { path });
    }
  }

  /**
   * Set the entire data
   */
  setData(pluginId: string, data: unknown): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'setData', false, 'Store not initialized');
    }

    const previousValue = this.store.getData();

    try {
      this.store.setData(data);

      eventBus.emitCore('document:changed', {
        path: [],
        value: data,
        previousValue,
      });

      return this.logAndReturn(pluginId, 'setData', true, undefined, {
        path: [],
        value: data,
        previousValue,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'setData', false, message);
    }
  }

  /**
   * Reset data to defaults
   */
  resetData(pluginId: string): ActionResult {
    if (!this.store) {
      return this.logAndReturn(pluginId, 'resetData', false, 'Store not initialized');
    }

    const previousValue = this.store.getData();

    try {
      this.store.resetData();

      eventBus.emitCore('document:changed', {
        path: [],
        value: this.store.getData(),
        previousValue,
      });

      return this.logAndReturn(pluginId, 'resetData', true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.logAndReturn(pluginId, 'resetData', false, message);
    }
  }

  /**
   * Get the current value at a path (read-only)
   */
  getValue(path: Path): unknown {
    return this.store?.getValueAtPath(path);
  }

  /**
   * Get the current data (read-only)
   */
  getData(): unknown {
    return this.store?.getData();
  }

  /**
   * Get the current schema (read-only)
   */
  getSchema(): unknown {
    return this.store?.getSchema();
  }

  /**
   * Log an action and return the result
   */
  private logAndReturn(
    pluginId: string,
    action: string,
    success: boolean,
    error?: string,
    details?: { path?: Path; value?: unknown; previousValue?: unknown }
  ): ActionResult {
    const entry: AuditLogEntry = {
      pluginId,
      action,
      path: details?.path,
      value: details?.value,
      previousValue: details?.previousValue,
      timestamp: Date.now(),
      success,
      error,
    };

    this.auditLog.push(entry);

    // Trim log
    if (this.auditLog.length > this.auditLogLimit) {
      this.auditLog = this.auditLog.slice(-this.auditLogLimit);
    }

    // Log for debugging
    if (success) {
      console.debug(`[${pluginId}] ${action}`, details);
    } else {
      console.warn(`[${pluginId}] ${action} FAILED:`, error, details);
    }

    return success ? { success: true } : { success: false, error };
  }

  /**
   * Get the audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Get audit log for a specific plugin
   */
  getAuditLogForPlugin(pluginId: string): AuditLogEntry[] {
    return this.auditLog.filter((e) => e.pluginId === pluginId);
  }

  /**
   * Clear the audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Set the audit log limit
   */
  setAuditLogLimit(limit: number): void {
    this.auditLogLimit = limit;
  }

  /**
   * Clear all state (useful for testing)
   */
  clear(): void {
    this.auditLog = [];
  }
}

// ============================================================================
// Plugin-Scoped Action API
// ============================================================================

/**
 * Action API scoped to a specific plugin
 */
export class PluginActionAPI {
  constructor(
    private api: ActionAPI,
    private pluginId: string
  ) {}

  updateValue(path: Path, value: unknown): ActionResult {
    return this.api.updateValue(this.pluginId, path, value);
  }

  addArrayItem(path: Path, value?: unknown): ActionResult {
    return this.api.addArrayItem(this.pluginId, path, value);
  }

  removeArrayItem(path: Path, index: number): ActionResult {
    return this.api.removeArrayItem(this.pluginId, path, index);
  }

  addObjectProperty(path: Path, key: string, value?: unknown): ActionResult {
    return this.api.addObjectProperty(this.pluginId, path, key, value);
  }

  removeObjectProperty(path: Path, key: string): ActionResult {
    return this.api.removeObjectProperty(this.pluginId, path, key);
  }

  setData(data: unknown): ActionResult {
    return this.api.setData(this.pluginId, data);
  }

  resetData(): ActionResult {
    return this.api.resetData(this.pluginId);
  }

  getValue(path: Path): unknown {
    return this.api.getValue(path);
  }

  getData(): unknown {
    return this.api.getData();
  }

  getSchema(): unknown {
    return this.api.getSchema();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global action API instance
 */
export const actionAPI = new ActionAPI();
