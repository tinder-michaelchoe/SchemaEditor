/**
 * Core Module Index
 * 
 * The core provides the foundation for the plugin architecture.
 * It exports all public APIs for plugins and the application shell.
 */

// Types
export * from './types';

// Registries
export { PluginRegistry, pluginRegistry } from './PluginRegistry';
export { ExtensionRegistry, extensionRegistry } from './ExtensionRegistry';
export { ServiceRegistry, serviceRegistry } from './ServiceRegistry';

// Event Bus
export { EventBus, eventBus } from './EventBus';

// Action API
export { ActionAPI, actionAPI, PluginActionAPI } from './ActionAPI';
export type { ActionResult, AuditLogEntry, DocumentStore } from './ActionAPI';

// Plugin Context
export { PluginContextFactory, pluginContextFactory } from './PluginContext';
export type { CoreStores } from './PluginContext';

// Slot Manager
export {
  SlotManager,
  slotManager,
  Slot,
  useSlot,
  PluginErrorBoundary,
} from './SlotManager';

// Simple API
export {
  SimpleAPIFactory,
  simpleAPIFactory,
  pathToString,
} from './SimpleAPI';
export type { SimplePluginAPI, NotificationType, NotificationHandler } from './SimpleAPI';

// Hooks
export * from './hooks';

// Store
export * from './store';

// ============================================================================
// Initialization
// ============================================================================

import { pluginRegistry } from './PluginRegistry';
import { pluginContextFactory, type CoreStores } from './PluginContext';
import { actionAPI } from './ActionAPI';
import { simpleAPIFactory } from './SimpleAPI';
import { eventBus } from './EventBus';
import { createDocumentStoreAdapter } from './store/documentStore';
import { getSelectionStoreInterface } from './store/selectionStore';
import { getUIStoreInterface } from './store/uiStore';
import { editorStoreRef } from '../store/storeRefs';

let initialized = false;

/**
 * Initialize the core plugin system
 * Should be called once at application startup.
 * Relies on store refs being populated by Providers before this runs.
 * SlotManager updates are handled by EditorProvider's useEffect.
 */
export function initializeCore(): void {
  if (initialized) {
    console.warn('Core already initialized');
    return;
  }

  // Create core stores interface (reads through refs)
  const coreStores: CoreStores = {
    document: {
      getSchema: () => editorStoreRef.current?.schema ?? null,
      getSchemaContext: () => editorStoreRef.current?.schemaContext ?? null,
      getData: () => editorStoreRef.current?.data ?? null,
      getErrors: () => editorStoreRef.current?.errors ?? new Map(),
      isValid: () => editorStoreRef.current?.isValid ?? true,
    },
    selection: getSelectionStoreInterface(),
    ui: getUIStoreInterface(),
  };

  // Initialize context factory with stores
  pluginContextFactory.setStores(coreStores);

  // Initialize action API with document store
  actionAPI.setStore(createDocumentStoreAdapter());

  // Initialize simple API factory with stores
  simpleAPIFactory.setStores(coreStores);

  // Set up plugin registry context factory
  pluginRegistry.setContextFactory((manifest) => {
    return pluginContextFactory.createContext(manifest);
  });

  // Note: SlotManager context updates are handled by EditorProvider's useEffect
  // (replaces the old useEditorStore.subscribe(updateSlotContext) call)

  initialized = true;
  console.log('Core plugin system initialized');
}

/**
 * Check if core is initialized
 */
export function isCoreInitialized(): boolean {
  return initialized;
}

/**
 * Reset core (useful for testing)
 */
export function resetCore(): void {
  pluginRegistry.clear();
  pluginContextFactory.clear();
  actionAPI.clear();
  simpleAPIFactory.clear();
  slotManager.clear();
  eventBus.clear();
  initialized = false;
}
