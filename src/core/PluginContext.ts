/**
 * Plugin Context Factory
 * 
 * Creates hierarchical, capability-gated contexts for plugins.
 * Contexts provide dependency injection and enforce the principle of least privilege.
 */

import type {
  PluginManifest,
  PluginContext,
  PluginCapability,
  Path,
  ViewMode,
  ExtensionPointDeclaration,
  ServiceDeclaration,
  Unsubscribe,
  EventHandler,
  PluginAction,
} from './types/plugin';
import type { JSONSchema, SchemaContext, ValidationError } from '../types/schema';
import { eventBus } from './EventBus';
import { extensionRegistry } from './ExtensionRegistry';
import { serviceRegistry } from './ServiceRegistry';
import { actionAPI } from './ActionAPI';

// ============================================================================
// Types
// ============================================================================

/**
 * Core state stores interface
 */
export interface CoreStores {
  document: {
    getSchema(): JSONSchema | null;
    getSchemaContext(): SchemaContext | null;
    getData(): unknown;
    getErrors(): Map<string, ValidationError[]>;
    isValid(): boolean;
  };
  selection: {
    getSelectedPath(): string | null;
    getEditingPath(): string | null;
    getHoveredPath(): string | null;
    setSelectedPath(path: string | null): void;
    setEditingPath(path: string | null): void;
    setHoveredPath(path: string | null): void;
  };
  ui: {
    isDarkMode(): boolean;
    getViewMode(): ViewMode;
    getExpandedPaths(): Set<string>;
    toggleDarkMode(): void;
    setViewMode(mode: ViewMode): void;
    toggleExpanded(path: string): void;
    expandAll(): void;
    collapseAll(): void;
  };
}

/**
 * Plugin state management
 */
interface PluginStateManager<T = unknown> {
  getState(): T;
  dispatch(action: PluginAction): void;
}

// ============================================================================
// Plugin Context Factory
// ============================================================================

export class PluginContextFactory {
  private coreStores: CoreStores | null = null;
  private pluginStates = new Map<string, PluginStateManager>();
  private localStorage = new Map<string, Map<string, unknown>>();
  private parentContext: Partial<PluginContext> | null = null;

  /**
   * Set the core stores
   */
  setStores(stores: CoreStores): void {
    this.coreStores = stores;
  }

  /**
   * Set a parent context for hierarchical resolution
   */
  setParentContext(context: Partial<PluginContext>): void {
    this.parentContext = context;
  }

  /**
   * Create a context for a plugin
   */
  createContext(manifest: PluginManifest): PluginContext {
    const { id: pluginId, capabilities } = manifest;

    // Create base context with hierarchical get
    const context: PluginContext = {
      pluginId,
      get: <T>(key: string): T | undefined => this.resolveValue(pluginId, key),
    };

    // Add capability-gated properties
    if (hasCapability(capabilities, 'document:read')) {
      context.document = this.createDocumentAccessor();
    }

    if (hasCapability(capabilities, 'document:write')) {
      context.actions = this.createActions(pluginId);
    }

    if (hasCapability(capabilities, 'selection:read')) {
      context.selection = this.createSelectionAccessor(
        hasCapability(capabilities, 'selection:write')
      );
    }

    if (hasCapability(capabilities, 'ui:read')) {
      context.ui = this.createUIAccessor(
        hasCapability(capabilities, 'ui:write')
      );
    }

    if (
      hasCapability(capabilities, 'events:emit') ||
      hasCapability(capabilities, 'events:subscribe')
    ) {
      context.events = this.createEventsAccessor(
        pluginId,
        hasCapability(capabilities, 'events:emit'),
        hasCapability(capabilities, 'events:subscribe')
      );
    }

    if (
      hasCapability(capabilities, 'extensions:define') ||
      hasCapability(capabilities, 'extensions:contribute')
    ) {
      context.extensions = this.createExtensionsAccessor(
        pluginId,
        hasCapability(capabilities, 'extensions:define')
      );
    }

    if (
      hasCapability(capabilities, 'services:provide') ||
      hasCapability(capabilities, 'services:consume')
    ) {
      context.services = this.createServicesAccessor(
        pluginId,
        hasCapability(capabilities, 'services:provide')
      );
    }

    if (hasCapability(capabilities, 'storage:local')) {
      context.storage = this.createStorageAccessor(pluginId);
    }

    // Freeze the context to prevent modification
    return Object.freeze(context) as PluginContext;
  }

  /**
   * Resolve a value from context hierarchy
   */
  private resolveValue<T>(pluginId: string, key: string): T | undefined {
    // Check plugin-local storage first
    const pluginStorage = this.localStorage.get(pluginId);
    if (pluginStorage?.has(key)) {
      return pluginStorage.get(key) as T;
    }

    // Check parent context
    if (this.parentContext) {
      const parentValue = (this.parentContext as Record<string, unknown>)[key];
      if (parentValue !== undefined) {
        return parentValue as T;
      }
    }

    return undefined;
  }

  /**
   * Create read-only document accessor
   */
  private createDocumentAccessor(): NonNullable<PluginContext['document']> {
    const stores = this.coreStores;
    
    return {
      get schema() {
        return stores?.document.getSchema() ?? null;
      },
      get schemaContext() {
        return stores?.document.getSchemaContext() ?? null;
      },
      get data() {
        return stores?.document.getData();
      },
      get errors() {
        return stores?.document.getErrors() ?? new Map();
      },
      get isValid() {
        return stores?.document.isValid() ?? true;
      },
    };
  }

  /**
   * Create actions accessor
   */
  private createActions(pluginId: string): NonNullable<PluginContext['actions']> {
    const api = actionAPI.createForPlugin(pluginId);

    return {
      updateValue: (path: Path, value: unknown) => api.updateValue(path, value),
      addArrayItem: (path: Path, value?: unknown) => api.addArrayItem(path, value),
      removeArrayItem: (path: Path, index: number) => api.removeArrayItem(path, index),
      addObjectProperty: (path: Path, key: string, value?: unknown) =>
        api.addObjectProperty(path, key, value),
      removeObjectProperty: (path: Path, key: string) =>
        api.removeObjectProperty(path, key),
      setData: (data: unknown) => api.setData(data),
      resetData: () => api.resetData(),
    };
  }

  /**
   * Create selection accessor
   */
  private createSelectionAccessor(
    canWrite: boolean
  ): NonNullable<PluginContext['selection']> {
    const stores = this.coreStores;

    const accessor: NonNullable<PluginContext['selection']> = {
      get selectedPath() {
        return stores?.selection.getSelectedPath() ?? null;
      },
      get editingPath() {
        return stores?.selection.getEditingPath() ?? null;
      },
      get hoveredPath() {
        return stores?.selection.getHoveredPath() ?? null;
      },
    };

    if (canWrite && stores) {
      accessor.setSelectedPath = (path) => {
        const previousPath = stores.selection.getSelectedPath();
        stores.selection.setSelectedPath(path);
        eventBus.emitCore('selection:changed', { path, previousPath });
      };
      accessor.setEditingPath = (path) => stores.selection.setEditingPath(path);
      accessor.setHoveredPath = (path) => stores.selection.setHoveredPath(path);
    }

    return accessor;
  }

  /**
   * Create UI accessor
   */
  private createUIAccessor(
    canWrite: boolean
  ): NonNullable<PluginContext['ui']> {
    const stores = this.coreStores;

    const accessor: NonNullable<PluginContext['ui']> = {
      get isDarkMode() {
        return stores?.ui.isDarkMode() ?? false;
      },
      get viewMode() {
        return stores?.ui.getViewMode() ?? 'tree';
      },
      get expandedPaths() {
        return stores?.ui.getExpandedPaths() ?? new Set();
      },
    };

    if (canWrite && stores) {
      accessor.toggleDarkMode = () => {
        stores.ui.toggleDarkMode();
        eventBus.emitCore('theme:changed', { isDarkMode: stores.ui.isDarkMode() });
      };
      accessor.setViewMode = (mode) => stores.ui.setViewMode(mode);
      accessor.toggleExpanded = (path) => stores.ui.toggleExpanded(path);
      accessor.expandAll = () => stores.ui.expandAll();
      accessor.collapseAll = () => stores.ui.collapseAll();
    }

    return accessor;
  }

  /**
   * Create events accessor
   */
  private createEventsAccessor(
    pluginId: string,
    canEmit: boolean,
    canSubscribe: boolean
  ): NonNullable<PluginContext['events']> {
    return {
      emit: (event: string, payload?: unknown) => {
        if (canEmit) {
          eventBus.emit(event, payload, pluginId);
        } else {
          console.warn(`Plugin ${pluginId} cannot emit events`);
        }
      },
      subscribe: (event: string, handler: EventHandler): Unsubscribe => {
        if (canSubscribe) {
          return eventBus.subscribe(event, handler, { pluginId });
        } else {
          console.warn(`Plugin ${pluginId} cannot subscribe to events`);
          return () => {};
        }
      },
    };
  }

  /**
   * Create extensions accessor
   */
  private createExtensionsAccessor(
    pluginId: string,
    canDefine: boolean
  ): NonNullable<PluginContext['extensions']> {
    const accessor: NonNullable<PluginContext['extensions']> = {
      getExtensions: <T>(pointId: string): T[] => {
        return extensionRegistry.getExtensions<T>(pointId);
      },
    };

    if (canDefine) {
      accessor.defineExtensionPoint = (point: ExtensionPointDeclaration) => {
        extensionRegistry.defineExtensionPoint(pluginId, point);
      };
    }

    return accessor;
  }

  /**
   * Create services accessor
   */
  private createServicesAccessor(
    pluginId: string,
    canProvide: boolean
  ): NonNullable<PluginContext['services']> {
    const accessor: NonNullable<PluginContext['services']> = {
      get: <T>(serviceId: string): T | undefined => {
        return serviceRegistry.get<T>(serviceId);
      },
    };

    if (canProvide) {
      accessor.register = (declaration: ServiceDeclaration) => {
        serviceRegistry.registerFromDeclaration(pluginId, declaration);
      };
    }

    return accessor;
  }

  /**
   * Create storage accessor
   */
  private createStorageAccessor(
    pluginId: string
  ): NonNullable<PluginContext['storage']> {
    // Get or create plugin's local storage
    let storage = this.localStorage.get(pluginId);
    if (!storage) {
      storage = new Map();
      this.localStorage.set(pluginId, storage);

      // Try to load from localStorage
      try {
        const saved = window.localStorage.getItem(`plugin:${pluginId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          for (const [key, value] of Object.entries(parsed)) {
            storage.set(key, value);
          }
        }
      } catch {
        // Ignore errors
      }
    }

    return {
      get: <T>(key: string, defaultValue: T): T => {
        if (storage!.has(key)) {
          return storage!.get(key) as T;
        }
        return defaultValue;
      },
      set: <T>(key: string, value: T): void => {
        storage!.set(key, value);

        // Persist to localStorage
        try {
          const obj: Record<string, unknown> = {};
          for (const [k, v] of storage!.entries()) {
            obj[k] = v;
          }
          window.localStorage.setItem(`plugin:${pluginId}`, JSON.stringify(obj));
        } catch {
          // Ignore errors
        }
      },
    };
  }

  /**
   * Initialize plugin state
   */
  initializePluginState<T>(
    pluginId: string,
    initialState: T,
    reducer?: (state: T, action: PluginAction) => T
  ): void {
    let state = initialState;

    const manager: PluginStateManager<T> = {
      getState: () => state,
      dispatch: (action: PluginAction) => {
        if (reducer) {
          state = reducer(state, action);
        }
      },
    };

    this.pluginStates.set(pluginId, manager as PluginStateManager);
  }

  /**
   * Get plugin state manager
   */
  getPluginState<T>(pluginId: string): PluginStateManager<T> | undefined {
    return this.pluginStates.get(pluginId) as PluginStateManager<T> | undefined;
  }

  /**
   * Clear plugin state and storage
   */
  clearPlugin(pluginId: string): void {
    this.pluginStates.delete(pluginId);
    this.localStorage.delete(pluginId);
  }

  /**
   * Clear all state (useful for testing)
   */
  clear(): void {
    this.pluginStates.clear();
    this.localStorage.clear();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if capabilities include a specific capability
 */
function hasCapability(
  capabilities: PluginCapability[],
  capability: PluginCapability
): boolean {
  return capabilities.includes(capability);
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global plugin context factory
 */
export const pluginContextFactory = new PluginContextFactory();
