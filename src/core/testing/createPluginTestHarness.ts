/**
 * Plugin Test Harness
 * 
 * A comprehensive testing utility that combines mock context, event bus,
 * and store to provide a complete testing environment for plugins.
 */

import type { 
  PluginManifest, 
  PluginDefinition, 
  PluginCapability,
  ExtensionPointDeclaration,
} from '../types';
import type { JSONSchema } from '../../types/schema';
import { createMockContext, type MockPluginContext, type MockContextOptions } from './createMockContext';
import { createMockEventBus, type MockEventBus } from './createMockEventBus';
import { createMockStore, type MockStore, type MockStoreOptions } from './createMockStore';

/**
 * Options for creating a plugin test harness
 */
export interface PluginTestHarnessOptions {
  /** Plugin manifest */
  manifest?: Partial<PluginManifest>;
  
  /** Plugin definition */
  definition?: Partial<PluginDefinition>;
  
  /** Context options */
  contextOptions?: Omit<MockContextOptions, 'pluginId' | 'capabilities'>;
  
  /** Store options */
  storeOptions?: MockStoreOptions;
  
  /** Additional capabilities beyond manifest */
  additionalCapabilities?: PluginCapability[];
}

/**
 * Plugin test harness interface
 */
export interface PluginTestHarness {
  /** The mock plugin context */
  context: MockPluginContext;
  
  /** The mock event bus */
  eventBus: MockEventBus;
  
  /** The mock store */
  store: MockStore;
  
  /** The plugin manifest */
  manifest: PluginManifest;
  
  /** The plugin definition */
  definition: PluginDefinition;
  
  /** Activate the plugin */
  activate(): Promise<void>;
  
  /** Deactivate the plugin */
  deactivate(): Promise<void>;
  
  /** Check if plugin is active */
  isActive(): boolean;
  
  /** Get a component from the plugin */
  getComponent(name: string): React.ComponentType | undefined;
  
  /** Simulate an event being received */
  simulateEvent(type: string, data?: unknown): void;
  
  /** Get emitted events */
  getEmittedEvents(): Array<{ type: string; data?: unknown }>;
  
  /** Get executed actions */
  getExecutedActions(): Array<{ action: string; path?: string; value?: unknown }>;
  
  /** Get log messages */
  getLogs(level?: string): Array<{ level: string; args: unknown[] }>;
  
  /** Get notifications */
  getNotifications(): Array<{ message: string; type?: string }>;
  
  /** Set document data */
  setDocumentData(data: unknown): void;
  
  /** Set schema */
  setSchema(schema: JSONSchema | null): void;
  
  /** Set selected path */
  setSelectedPath(path: string | null): void;
  
  /** Add a service */
  addService(id: string, implementation: unknown): void;
  
  /** Add extension contributions */
  addExtensions(point: string, contributions: unknown[]): void;
  
  /** Reset all state and interactions */
  reset(): void;
  
  /** Assert that an event was emitted */
  assertEventEmitted(type: string, dataMatcher?: (data: unknown) => boolean): void;
  
  /** Assert that an action was executed */
  assertActionExecuted(action: string, path?: string): void;
  
  /** Assert that a notification was shown */
  assertNotificationShown(message: string, type?: string): void;
}

/**
 * Creates a default plugin manifest for testing
 */
function createDefaultManifest(partial?: Partial<PluginManifest>): PluginManifest {
  return {
    id: partial?.id ?? 'test-plugin',
    version: partial?.version ?? '1.0.0',
    name: partial?.name ?? 'Test Plugin',
    description: partial?.description ?? 'A test plugin',
    capabilities: partial?.capabilities ?? [],
    activationEvents: partial?.activationEvents ?? ['*'],
    slots: partial?.slots,
    extensionPoints: partial?.extensionPoints,
    extensions: partial?.extensions,
    provides: partial?.provides,
    consumes: partial?.consumes,
    emits: partial?.emits,
    dependencies: partial?.dependencies,
  };
}

/**
 * Creates a default plugin definition for testing
 */
function createDefaultDefinition(partial?: Partial<PluginDefinition>): PluginDefinition {
  return {
    activate: partial?.activate ?? (() => {}),
    deactivate: partial?.deactivate,
    components: partial?.components ?? {},
    extensionImplementations: partial?.extensionImplementations,
    serviceImplementations: partial?.serviceImplementations,
  };
}

/**
 * Creates a plugin test harness
 */
export function createPluginTestHarness(
  options: PluginTestHarnessOptions = {}
): PluginTestHarness {
  const manifest = createDefaultManifest(options.manifest);
  const definition = createDefaultDefinition(options.definition);
  
  // Combine manifest capabilities with any additional ones
  const capabilities = [
    ...manifest.capabilities,
    ...(options.additionalCapabilities ?? []),
  ];
  
  // Create mock components
  const eventBus = createMockEventBus();
  const store = createMockStore(options.storeOptions);
  const context = createMockContext({
    pluginId: manifest.id,
    capabilities,
    ...options.contextOptions,
  });
  
  let isPluginActive = false;
  
  const harness: PluginTestHarness = {
    context,
    eventBus,
    store,
    manifest,
    definition,
    
    async activate(): Promise<void> {
      if (isPluginActive) {
        throw new Error('Plugin is already active');
      }
      
      await definition.activate(context);
      isPluginActive = true;
    },
    
    async deactivate(): Promise<void> {
      if (!isPluginActive) {
        throw new Error('Plugin is not active');
      }
      
      await definition.deactivate?.();
      isPluginActive = false;
    },
    
    isActive(): boolean {
      return isPluginActive;
    },
    
    getComponent(name: string): React.ComponentType | undefined {
      return definition.components?.[name] as React.ComponentType | undefined;
    },
    
    simulateEvent(type: string, data?: unknown): void {
      eventBus.simulateEvent(type, data);
    },
    
    getEmittedEvents(): Array<{ type: string; data?: unknown }> {
      return context.__interactions.emittedEvents;
    },
    
    getExecutedActions(): Array<{ action: string; path?: string; value?: unknown }> {
      return context.__interactions.executedActions;
    },
    
    getLogs(level?: string): Array<{ level: string; args: unknown[] }> {
      if (level) {
        return context.__interactions.logs.filter(log => log.level === level);
      }
      return context.__interactions.logs;
    },
    
    getNotifications(): Array<{ message: string; type?: string }> {
      return context.__interactions.notifications;
    },
    
    setDocumentData(data: unknown): void {
      context.__setDocumentData(data);
      store.setDocumentData(data);
    },
    
    setSchema(schema: JSONSchema | null): void {
      context.__setSchema(schema);
      store.setSchema(schema);
    },
    
    setSelectedPath(path: string | null): void {
      context.__setSelectedPath(path);
      store.setSelectedPath(path);
    },
    
    addService(id: string, implementation: unknown): void {
      context.__addService(id, implementation);
    },
    
    addExtensions(point: string, contributions: unknown[]): void {
      context.__addExtensions(point, contributions);
    },
    
    reset(): void {
      context.__reset();
      eventBus.reset();
      store.reset();
      isPluginActive = false;
    },
    
    assertEventEmitted(type: string, dataMatcher?: (data: unknown) => boolean): void {
      const events = context.__interactions.emittedEvents;
      const found = events.find(e => {
        if (e.type !== type) return false;
        if (dataMatcher && !dataMatcher(e.data)) return false;
        return true;
      });
      
      if (!found) {
        const eventList = events.map(e => `${e.type}`).join(', ');
        throw new Error(
          `Expected event "${type}" to be emitted, but it was not. ` +
          `Emitted events: [${eventList || 'none'}]`
        );
      }
    },
    
    assertActionExecuted(action: string, path?: string): void {
      const actions = context.__interactions.executedActions;
      const found = actions.find(a => {
        if (a.action !== action) return false;
        if (path !== undefined && a.path !== path) return false;
        return true;
      });
      
      if (!found) {
        const actionList = actions.map(a => `${a.action}(${a.path || ''})`).join(', ');
        throw new Error(
          `Expected action "${action}"${path ? ` at path "${path}"` : ''} to be executed, ` +
          `but it was not. Executed actions: [${actionList || 'none'}]`
        );
      }
    },
    
    assertNotificationShown(message: string, type?: string): void {
      const notifications = context.__interactions.notifications;
      const found = notifications.find(n => {
        if (n.message !== message) return false;
        if (type !== undefined && n.type !== type) return false;
        return true;
      });
      
      if (!found) {
        const notifList = notifications.map(n => `"${n.message}"`).join(', ');
        throw new Error(
          `Expected notification "${message}" to be shown, but it was not. ` +
          `Shown notifications: [${notifList || 'none'}]`
        );
      }
    },
  };
  
  return harness;
}
