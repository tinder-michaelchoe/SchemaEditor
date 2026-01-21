/**
 * Core Plugin Types and Interfaces
 * 
 * This file defines the contract for all plugins in the system.
 * Every plugin must implement PluginManifest to declare its capabilities,
 * dependencies, and UI slots.
 */

import type { ComponentType } from 'react';
import type { JSONSchema, SchemaContext, ValidationError } from '../../types/schema';

// ============================================================================
// Plugin Identity & Manifest
// ============================================================================

/**
 * Plugin manifest - the contract every plugin must implement.
 * Declares everything a plugin needs and provides, enabling the core to enforce boundaries.
 */
export interface PluginManifest {
  // === Identity ===
  /** Unique ID: "tree-view", "canvas-view" */
  id: string;
  /** Display name */
  name: string;
  /** Semver version */
  version: string;
  /** Optional description */
  description?: string;

  // === API Version (allows backward-compatible evolution) ===
  /** Core can provide shims for older versions */
  apiVersion: '1.0';

  // === Dependencies ===
  /** Other plugins this depends on */
  requires?: PluginDependency[];

  // === Activation (improves startup performance) ===
  /** Lazy = only load when actually needed */
  activation: 'eager' | 'lazy';
  /** What triggers lazy activation */
  activationEvents?: ActivationEvent[];

  // === Capabilities Requested ===
  capabilities: PluginCapability[];

  // === UI Slots (where this plugin renders) ===
  slots?: SlotRegistration[];

  // === Extension Points (enables plugin-to-plugin extensibility) ===
  extensionPoints?: ExtensionPointDeclaration[];

  // === Extensions (contributions to other plugins' extension points) ===
  extensions?: ExtensionContribution[];

  // === Services (decoupled functionality sharing between plugins) ===
  /** Services this plugin provides */
  provides?: ServiceDeclaration[];
  /** Service IDs this plugin needs */
  consumes?: string[];

  // === Events ===
  /** Events this plugin emits */
  emits?: string[];
  /** Events this plugin subscribes to */
  subscribes?: string[];

  // === Keyboard shortcuts ===
  shortcuts?: ShortcutRegistration[];
}

/**
 * Dependency declaration for plugins that require other plugins
 */
export interface PluginDependency {
  /** Plugin ID */
  id: string;
  /** Semver range (optional) */
  version?: string;
  /** Can run without this dependency */
  optional?: boolean;
}

/**
 * Activation events determine when lazy-loaded plugins are initialized
 */
export type ActivationEvent =
  | `onSlot:${UISlot}` // When slot is rendered
  | `onExtensionPoint:${string}` // When extension point is accessed
  | `onEvent:${string}` // When event fires
  | `onCommand:${string}` // When command is invoked
  | `onService:${string}`; // When service is requested

/**
 * Capabilities follow the principle of least privilege.
 * Plugins only receive access to what they explicitly request.
 */
export type PluginCapability =
  | 'document:read' // Read schema, data, errors
  | 'document:write' // Dispatch mutations
  | 'selection:read' // Read selected path
  | 'selection:write' // Change selection
  | 'ui:read' // Read UI state (panels, theme)
  | 'ui:write' // Change UI state
  | 'events:emit' // Emit events
  | 'events:subscribe' // Subscribe to events
  | 'extensions:define' // Define extension points
  | 'extensions:contribute' // Contribute to extension points
  | 'services:provide' // Provide services
  | 'services:consume' // Consume services
  | 'storage:local'; // Access localStorage for plugin

// ============================================================================
// UI Slots
// ============================================================================

/**
 * Predefined UI slots where plugins can render components
 */
export type UISlot =
  | 'header:left'
  | 'header:center'
  | 'header:right'
  | 'sidebar:left'
  | 'sidebar:right'
  | 'main:view'
  | 'panel:bottom'
  | 'toolbar:main'
  | 'context-menu';

/**
 * Props passed to slot components
 */
export interface SlotProps {
  /** The plugin context */
  pluginId: string;
}

/**
 * Registration for a plugin to render in a UI slot
 */
export interface SlotRegistration {
  /** Which slot to render in */
  slot: UISlot;
  /** Component to render */
  component: ComponentType<SlotProps>;
  /** Higher = renders first */
  priority?: number;
  /** Condition expression (optional) */
  when?: string;
}

// ============================================================================
// Extension Points
// ============================================================================

/**
 * Extension point declaration - defines a contract for other plugins to extend
 */
export interface ExtensionPointDeclaration {
  /** e.g., "nodeRenderer" - Full ID becomes: "{pluginId}.{id}" */
  id: string;
  /** Schema that extensions must conform to */
  schema: ExtensionPointSchema;
  /** Can have multiple extensions (default: true) */
  multiple?: boolean;
}

/**
 * Schema for validating extension contributions
 */
export interface ExtensionPointSchema {
  type: 'object';
  properties: Record<string, ExtensionPointProperty>;
}

export interface ExtensionPointProperty {
  type: 'string' | 'number' | 'boolean' | 'function' | 'object' | 'array';
  required?: boolean;
  description?: string;
}

/**
 * Contribution to another plugin's extension point
 */
export interface ExtensionContribution {
  /** Full extension point ID to extend (e.g., "tree-view.nodeRenderer") */
  point: string;
  /** Must match the extension point's schema */
  contribution: Record<string, unknown>;
}

// ============================================================================
// Services
// ============================================================================

/**
 * Service declaration for providing functionality to other plugins
 */
export interface ServiceDeclaration {
  /** Service ID */
  id: string;
  /** TypeScript interface name (for documentation) */
  interface: string;
  /** The service implementation */
  implementation: unknown;
}

// ============================================================================
// Shortcuts
// ============================================================================

/**
 * Keyboard shortcut registration
 */
export interface ShortcutRegistration {
  /** Key combination (e.g., "mod+shift+e") */
  key: string;
  /** Action to trigger */
  action: string;
  /** Optional description */
  description?: string;
  /** Condition when shortcut is active */
  when?: string;
}

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * Action for plugin-local state reducer
 */
export interface PluginAction {
  type: string;
  payload?: unknown;
}

/**
 * Complete plugin definition including manifest, state, and lifecycle hooks
 */
export interface PluginDefinition<TState = unknown> {
  manifest: PluginManifest;

  /** Optional plugin-local state (isolated) */
  initialState?: TState;

  /** Called when plugin is loaded */
  onLoad?: (context: PluginContext) => void | Promise<void>;
  /** Called when lazy plugin is activated */
  onActivate?: (context: PluginContext) => void;
  /** Called when plugin goes idle */
  onDeactivate?: () => void;
  /** Called when plugin is unloaded */
  onUnload?: () => void;

  /** State reducer for plugin-local state */
  reducer?: (state: TState, action: PluginAction) => TState;
}

// ============================================================================
// Plugin Context (Dependency Injection)
// ============================================================================

/** Path type for document operations */
export type Path = (string | number)[];

/** View mode type */
export type ViewMode = 'tree' | 'canvas' | 'json';

/** Unsubscribe function type */
export type Unsubscribe = () => void;

/** Event handler type */
export type EventHandler = (payload: unknown) => void;

/**
 * Hierarchical context provided to plugins.
 * Access is gated by capabilities declared in the manifest.
 */
export interface PluginContext {
  /** Plugin identity */
  pluginId: string;

  // === Hierarchical Context Access ===
  /** Get a value from context (walks up hierarchy if not found locally) */
  get<T>(key: string): T | undefined;

  // === Document Access (requires 'document:read') ===
  document?: {
    readonly schema: JSONSchema | null;
    readonly schemaContext: SchemaContext | null;
    readonly data: unknown;
    readonly errors: Map<string, ValidationError[]>;
    readonly isValid: boolean;
  };

  // === Document Mutations (requires 'document:write') ===
  actions?: {
    updateValue: (path: Path, value: unknown) => void;
    addArrayItem: (path: Path, value?: unknown) => void;
    removeArrayItem: (path: Path, index: number) => void;
    addObjectProperty: (path: Path, key: string, value?: unknown) => void;
    removeObjectProperty: (path: Path, key: string) => void;
    setData: (data: unknown) => void;
    resetData: () => void;
  };

  // === Selection (requires 'selection:read' / 'selection:write') ===
  selection?: {
    readonly selectedPath: string | null;
    readonly editingPath: string | null;
    readonly hoveredPath: string | null;
    setSelectedPath?: (path: string | null) => void;
    setEditingPath?: (path: string | null) => void;
    setHoveredPath?: (path: string | null) => void;
  };

  // === UI State (requires 'ui:read' / 'ui:write') ===
  ui?: {
    readonly isDarkMode: boolean;
    readonly viewMode: ViewMode;
    readonly expandedPaths: Set<string>;
    toggleDarkMode?: () => void;
    setViewMode?: (mode: ViewMode) => void;
    toggleExpanded?: (path: string) => void;
    expandAll?: () => void;
    collapseAll?: () => void;
  };

  // === Events (requires 'events:emit' / 'events:subscribe') ===
  events?: {
    emit: (event: string, payload?: unknown) => void;
    subscribe: (event: string, handler: EventHandler) => Unsubscribe;
  };

  // === Extension Points (requires 'extensions:define' / 'extensions:contribute') ===
  extensions?: {
    /** Get all contributions to an extension point */
    getExtensions<T>(pointId: string): T[];
    /** Define a new extension point (usually in onLoad) */
    defineExtensionPoint?: (point: ExtensionPointDeclaration) => void;
  };

  // === Services (requires 'services:provide' / 'services:consume') ===
  services?: {
    /** Get a service (auto-injected based on 'consumes' in manifest) */
    get<T>(serviceId: string): T | undefined;
    /** Register a service (usually in onLoad) */
    register?: (declaration: ServiceDeclaration) => void;
  };

  // === Plugin-local Storage (requires 'storage:local') ===
  storage?: {
    get: <T>(key: string, defaultValue: T) => T;
    set: <T>(key: string, value: T) => void;
  };

  // === Plugin-local State ===
  state?: {
    get: <T>() => T;
    dispatch: (action: PluginAction) => void;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to create type-safe plugin definitions
 */
export function definePlugin<TState = void>(
  definition: PluginDefinition<TState>
): PluginDefinition<TState> {
  return definition;
}

// ============================================================================
// Plugin Registration Types
// ============================================================================

/**
 * Internal representation of a registered plugin
 */
export interface RegisteredPlugin {
  definition: PluginDefinition;
  status: PluginStatus;
  context?: PluginContext;
  error?: Error;
}

/**
 * Plugin lifecycle status
 */
export type PluginStatus =
  | 'registered' // Loaded but not active
  | 'activating' // In the process of activating
  | 'active' // Fully active
  | 'deactivating' // In the process of deactivating
  | 'error'; // Failed to load/activate

/**
 * Result of plugin registration
 */
export interface PluginRegistrationResult {
  success: boolean;
  pluginId: string;
  errors?: string[];
}
