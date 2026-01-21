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
import { slotManager } from './SlotManager';
import { eventBus } from './EventBus';
import { createDocumentStoreAdapter } from './store/documentStore';
import { getSelectionStoreInterface } from './store/selectionStore';
import { getUIStoreInterface } from './store/uiStore';
import { useEditorStore } from '../store/editorStore';

let initialized = false;

/**
 * Initialize the core plugin system
 * Should be called once at application startup
 */
export function initializeCore(): void {
  if (initialized) {
    console.warn('Core already initialized');
    return;
  }

  // Create core stores interface
  const coreStores: CoreStores = {
    document: {
      getSchema: () => useEditorStore.getState().schema,
      getSchemaContext: () => useEditorStore.getState().schemaContext,
      getData: () => useEditorStore.getState().data,
      getErrors: () => useEditorStore.getState().errors,
      isValid: () => useEditorStore.getState().isValid,
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

  // Update slot manager context when store changes
  const updateSlotContext = () => {
    const state = useEditorStore.getState();
    slotManager.updateContext({
      hasDocument: state.schema !== null,
      hasSelection: state.selectedPath !== null,
      isDarkMode: state.isDarkMode,
      selectedPath: state.selectedPath,
      hasErrors: state.errors.size > 0,
    });
  };

  // Initial update
  updateSlotContext();

  // Subscribe to store changes
  useEditorStore.subscribe(updateSlotContext);

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
