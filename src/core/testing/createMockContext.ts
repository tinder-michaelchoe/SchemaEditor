/**
 * Mock Plugin Context Factory
 * 
 * Creates mock PluginContext objects for testing plugins in isolation.
 * Allows configuring which capabilities are available and tracking interactions.
 */

import type { 
  PluginContext, 
  PluginCapability,
  ExtensionPointDeclaration,
} from '../types';
import type { JSONSchema, ValidationError } from '../../types/schema';

/**
 * Options for creating a mock context
 */
export interface MockContextOptions {
  /** Plugin ID for the context */
  pluginId?: string;
  
  /** Capabilities to grant */
  capabilities?: PluginCapability[];
  
  /** Initial document data */
  documentData?: unknown;
  
  /** JSON Schema for the document */
  schema?: JSONSchema | null;
  
  /** Validation errors */
  errors?: ValidationError[];
  
  /** Selected path */
  selectedPath?: string | null;
  
  /** Dark mode setting */
  darkMode?: boolean;
  
  /** Expanded paths */
  expandedPaths?: Set<string>;
  
  /** View mode */
  viewMode?: 'tree' | 'json';
  
  /** Available services */
  services?: Record<string, unknown>;
  
  /** Extension contributions */
  extensions?: Record<string, unknown[]>;
}

/**
 * Interaction tracking for mock context
 */
export interface MockContextInteractions {
  /** Events that were emitted */
  emittedEvents: Array<{ type: string; data?: unknown }>;
  
  /** Actions that were executed */
  executedActions: Array<{ action: string; path?: string; value?: unknown }>;
  
  /** Services that were provided */
  providedServices: Array<{ id: string; implementation: unknown }>;
  
  /** Services that were consumed */
  consumedServices: string[];
  
  /** Extension points that were defined */
  definedExtensionPoints: ExtensionPointDeclaration[];
  
  /** Extensions that were contributed */
  contributedExtensions: Array<{ point: string; contribution: unknown }>;
  
  /** Log messages */
  logs: Array<{ level: string; args: unknown[] }>;
  
  /** Notifications shown */
  notifications: Array<{ message: string; type?: string }>;
  
  /** Selection changes */
  selectionChanges: Array<{ path: string | null }>;
}

/**
 * Extended mock context with testing utilities
 */
export interface MockPluginContext extends PluginContext {
  /** Access to interaction tracking */
  __interactions: MockContextInteractions;
  
  /** Reset all tracked interactions */
  __reset(): void;
  
  /** Set document data */
  __setDocumentData(data: unknown): void;
  
  /** Set schema */
  __setSchema(schema: JSONSchema | null): void;
  
  /** Set errors */
  __setErrors(errors: ValidationError[]): void;
  
  /** Set selected path */
  __setSelectedPath(path: string | null): void;
  
  /** Add a service */
  __addService(id: string, implementation: unknown): void;
  
  /** Add extension contributions */
  __addExtensions(point: string, contributions: unknown[]): void;
}

/**
 * Creates a mock PluginContext for testing
 */
export function createMockContext(options: MockContextOptions = {}): MockPluginContext {
  const {
    pluginId = 'test-plugin',
    capabilities = [],
    documentData = {},
    schema = null,
    errors = [],
    selectedPath = null,
    darkMode = false,
    expandedPaths = new Set<string>(),
    viewMode = 'tree',
    services = {},
    extensions = {},
  } = options;
  
  // Internal state
  let _documentData = documentData;
  let _schema = schema;
  let _errors = errors;
  let _selectedPath = selectedPath;
  let _editingPath: string | null = null;
  let _hoveredPath: string | null = null;
  const _services = new Map<string, unknown>(Object.entries(services));
  const _extensions = new Map<string, unknown[]>(Object.entries(extensions));
  
  // Interaction tracking
  const interactions: MockContextInteractions = {
    emittedEvents: [],
    executedActions: [],
    providedServices: [],
    consumedServices: [],
    definedExtensionPoints: [],
    contributedExtensions: [],
    logs: [],
    notifications: [],
    selectionChanges: [],
  };
  
  // Helper to check capabilities
  const hasCapability = (cap: PluginCapability): boolean => {
    return capabilities.includes(cap);
  };
  
  // Create the mock context
  const context: MockPluginContext = {
    pluginId,
    capabilities,
    hasCapability,
    
    // Document access (gated by document:read)
    document: hasCapability('document:read') ? {
      getData: () => _documentData,
      getSchema: () => _schema,
      getErrors: () => _errors,
      getValueAtPath: (path: string) => {
        if (!path) return _documentData;
        const parts = path.split('.');
        let current: unknown = _documentData;
        for (const part of parts) {
          if (current == null || typeof current !== 'object') return undefined;
          current = (current as Record<string, unknown>)[part];
        }
        return current;
      },
    } : undefined,
    
    // Selection access (gated by selection:read/write)
    selection: (hasCapability('selection:read') || hasCapability('selection:write')) ? {
      getSelectedPath: () => _selectedPath,
      getEditingPath: () => _editingPath,
      getHoveredPath: () => _hoveredPath,
      ...(hasCapability('selection:write') ? {
        setSelectedPath: (path: string | null) => {
          _selectedPath = path;
          interactions.selectionChanges.push({ path });
        },
        setEditingPath: (path: string | null) => { _editingPath = path; },
        setHoveredPath: (path: string | null) => { _hoveredPath = path; },
      } : {}),
    } : undefined,
    
    // UI access (gated by ui:* capabilities)
    ui: (hasCapability('ui:theme') || hasCapability('ui:notifications') || hasCapability('ui:slots')) ? {
      isDarkMode: () => darkMode,
      getExpandedPaths: () => expandedPaths,
      getViewMode: () => viewMode,
      ...(hasCapability('ui:notifications') ? {
        showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => {
          interactions.notifications.push({ message, type });
        },
      } : {}),
    } : undefined,
    
    // Events (gated by events:* capabilities)
    events: (hasCapability('events:emit') || hasCapability('events:subscribe')) ? {
      ...(hasCapability('events:emit') ? {
        emit: (type: string, data?: unknown) => {
          interactions.emittedEvents.push({ type, data });
        },
      } : {}),
      ...(hasCapability('events:subscribe') ? {
        subscribe: (type: string, handler: (data: unknown) => void) => {
          // Return a no-op unsubscribe for testing
          return () => {};
        },
      } : {}),
    } : undefined,
    
    // Actions (gated by document:write)
    actions: hasCapability('document:write') ? {
      setValueAtPath: (path: string, value: unknown, pluginId?: string) => {
        interactions.executedActions.push({ action: 'setValueAtPath', path, value });
        // Actually update the mock data
        if (!path) {
          _documentData = value;
        } else {
          const parts = path.split('.');
          let current: Record<string, unknown> = _documentData as Record<string, unknown>;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
              current[part] = {};
            }
            current = current[part] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = value;
        }
        return true;
      },
      deleteAtPath: (path: string, pluginId?: string) => {
        interactions.executedActions.push({ action: 'deleteAtPath', path });
        return true;
      },
      addArrayItem: (path: string, item: unknown, pluginId?: string) => {
        interactions.executedActions.push({ action: 'addArrayItem', path, value: item });
        return true;
      },
      removeArrayItem: (path: string, index: number, pluginId?: string) => {
        interactions.executedActions.push({ action: 'removeArrayItem', path, value: index });
        return true;
      },
      replaceDocument: (data: unknown, pluginId?: string) => {
        interactions.executedActions.push({ action: 'replaceDocument', value: data });
        _documentData = data;
        return true;
      },
      setSchema: (schema: JSONSchema, pluginId?: string) => {
        interactions.executedActions.push({ action: 'setSchema', value: schema });
        _schema = schema;
        return true;
      },
      getActionLog: () => interactions.executedActions.map(a => ({
        timestamp: Date.now(),
        pluginId,
        action: a.action,
        path: a.path,
        value: a.value,
      })),
    } : undefined,
    
    // Extensions (gated by extensions:* capabilities)
    extensions: (hasCapability('extensions:provide') || hasCapability('extensions:contribute')) ? {
      ...(hasCapability('extensions:provide') ? {
        define: (point: ExtensionPointDeclaration) => {
          interactions.definedExtensionPoints.push(point);
        },
      } : {}),
      ...(hasCapability('extensions:contribute') ? {
        contribute: (point: string, contribution: unknown) => {
          interactions.contributedExtensions.push({ point, contribution });
          const existing = _extensions.get(point) || [];
          _extensions.set(point, [...existing, contribution]);
        },
      } : {}),
      getContributions: (point: string) => {
        return _extensions.get(point) || [];
      },
    } : undefined,
    
    // Services (gated by services:* capabilities)
    services: (hasCapability('services:provide') || hasCapability('services:consume')) ? {
      ...(hasCapability('services:provide') ? {
        provide: (id: string, implementation: unknown) => {
          interactions.providedServices.push({ id, implementation });
          _services.set(id, implementation);
        },
      } : {}),
      ...(hasCapability('services:consume') ? {
        consume: <T>(id: string): T | undefined => {
          interactions.consumedServices.push(id);
          return _services.get(id) as T | undefined;
        },
        onAvailable: (id: string, callback: (service: unknown) => void) => {
          const service = _services.get(id);
          if (service) {
            callback(service);
          }
          return () => {};
        },
      } : {}),
    } : undefined,
    
    // Logging (always available)
    log: {
      debug: (...args: unknown[]) => {
        interactions.logs.push({ level: 'debug', args });
      },
      info: (...args: unknown[]) => {
        interactions.logs.push({ level: 'info', args });
      },
      warn: (...args: unknown[]) => {
        interactions.logs.push({ level: 'warn', args });
      },
      error: (...args: unknown[]) => {
        interactions.logs.push({ level: 'error', args });
      },
    },
    
    // Testing utilities
    __interactions: interactions,
    
    __reset: () => {
      interactions.emittedEvents = [];
      interactions.executedActions = [];
      interactions.providedServices = [];
      interactions.consumedServices = [];
      interactions.definedExtensionPoints = [];
      interactions.contributedExtensions = [];
      interactions.logs = [];
      interactions.notifications = [];
      interactions.selectionChanges = [];
    },
    
    __setDocumentData: (data: unknown) => {
      _documentData = data;
    },
    
    __setSchema: (schema: JSONSchema | null) => {
      _schema = schema;
    },
    
    __setErrors: (errors: ValidationError[]) => {
      _errors = errors;
    },
    
    __setSelectedPath: (path: string | null) => {
      _selectedPath = path;
    },
    
    __addService: (id: string, implementation: unknown) => {
      _services.set(id, implementation);
    },
    
    __addExtensions: (point: string, contributions: unknown[]) => {
      _extensions.set(point, contributions);
    },
  };
  
  return context;
}
