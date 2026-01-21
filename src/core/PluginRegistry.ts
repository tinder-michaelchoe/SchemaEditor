/**
 * Plugin Registry
 * 
 * Manages plugin registration, activation, and lifecycle.
 * Supports lazy activation based on activation events.
 */

import { z } from 'zod';
import type {
  PluginDefinition,
  PluginManifest,
  RegisteredPlugin,
  PluginStatus,
  PluginRegistrationResult,
  PluginContext,
  ActivationEvent,
  PluginCapability,
  UISlot,
} from './types/plugin';

// ============================================================================
// Manifest Validation Schema
// ============================================================================

const VALID_CAPABILITIES: PluginCapability[] = [
  'document:read',
  'document:write',
  'selection:read',
  'selection:write',
  'ui:read',
  'ui:write',
  'events:emit',
  'events:subscribe',
  'extensions:define',
  'extensions:contribute',
  'services:provide',
  'services:consume',
  'storage:local',
];

const VALID_SLOTS: UISlot[] = [
  'header:left',
  'header:center',
  'header:right',
  'sidebar:left',
  'sidebar:right',
  'main:view',
  'panel:bottom',
  'toolbar:main',
  'context-menu',
];

const pluginDependencySchema = z.object({
  id: z.string().min(1),
  version: z.string().optional(),
  optional: z.boolean().optional(),
});

const extensionPointPropertySchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'function', 'object', 'array']),
  required: z.boolean().optional(),
  description: z.string().optional(),
});

const extensionPointSchemaSchema = z.object({
  type: z.literal('object'),
  properties: z.record(extensionPointPropertySchema),
});

const extensionPointDeclarationSchema = z.object({
  id: z.string().min(1),
  schema: extensionPointSchemaSchema,
  multiple: z.boolean().optional(),
});

const extensionContributionSchema = z.object({
  point: z.string().min(1),
  contribution: z.record(z.unknown()),
});

const serviceDeclarationSchema = z.object({
  id: z.string().min(1),
  interface: z.string().min(1),
  implementation: z.unknown(),
});

const slotRegistrationSchema = z.object({
  slot: z.enum(VALID_SLOTS as [UISlot, ...UISlot[]]),
  component: z.any(), // Function type - validated at runtime
  priority: z.number().optional(),
  when: z.string().optional(),
});

const shortcutRegistrationSchema = z.object({
  key: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
  when: z.string().optional(),
});

const manifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ID must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)'),
  description: z.string().optional(),
  apiVersion: z.literal('1.0'),
  requires: z.array(pluginDependencySchema).optional(),
  activation: z.enum(['eager', 'lazy']),
  activationEvents: z.array(z.string()).optional(),
  capabilities: z.array(z.enum(VALID_CAPABILITIES as [PluginCapability, ...PluginCapability[]])),
  slots: z.array(slotRegistrationSchema).optional(),
  extensionPoints: z.array(extensionPointDeclarationSchema).optional(),
  extensions: z.array(extensionContributionSchema).optional(),
  provides: z.array(serviceDeclarationSchema).optional(),
  consumes: z.array(z.string()).optional(),
  emits: z.array(z.string()).optional(),
  subscribes: z.array(z.string()).optional(),
  shortcuts: z.array(shortcutRegistrationSchema).optional(),
});

// ============================================================================
// Plugin Registry Types
// ============================================================================

type ActivationListener = (pluginId: string) => void;
type ContextFactory = (manifest: PluginManifest) => PluginContext;

// ============================================================================
// Plugin Registry Class
// ============================================================================

export class PluginRegistry {
  private plugins = new Map<string, RegisteredPlugin>();
  private activationListeners = new Map<string, Set<ActivationListener>>();
  private contextFactory: ContextFactory | null = null;

  /**
   * Set the context factory used to create plugin contexts
   */
  setContextFactory(factory: ContextFactory): void {
    this.contextFactory = factory;
  }

  /**
   * Register a plugin with the registry
   */
  register(definition: PluginDefinition): PluginRegistrationResult {
    const { manifest } = definition;

    // Validate manifest
    const validationResult = this.validateManifest(manifest);
    if (!validationResult.success) {
      return {
        success: false,
        pluginId: manifest.id,
        errors: validationResult.errors,
      };
    }

    // Check for duplicate ID
    if (this.plugins.has(manifest.id)) {
      return {
        success: false,
        pluginId: manifest.id,
        errors: [`Plugin with ID "${manifest.id}" is already registered`],
      };
    }

    // Register the plugin
    const registered: RegisteredPlugin = {
      definition,
      status: 'registered',
    };

    this.plugins.set(manifest.id, registered);

    // Auto-activate eager plugins
    if (manifest.activation === 'eager') {
      this.activate(manifest.id);
    }

    return {
      success: true,
      pluginId: manifest.id,
    };
  }

  /**
   * Validate a plugin manifest
   */
  private validateManifest(manifest: PluginManifest): {
    success: boolean;
    errors: string[];
  } {
    const result = manifestSchema.safeParse(manifest);

    if (!result.success) {
      // Handle both Zod v3 (.errors) and Zod v4 (.issues) structures
      const issues = (result.error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues 
        ?? (result.error as { errors?: Array<{ path: (string | number)[]; message: string }> }).errors 
        ?? [];
      return {
        success: false,
        errors: issues.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        ),
      };
    }

    return { success: true, errors: [] };
  }

  /**
   * Activate a plugin
   */
  async activate(pluginId: string): Promise<boolean> {
    const registered = this.plugins.get(pluginId);
    if (!registered) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    if (registered.status === 'active' || registered.status === 'activating') {
      return true; // Already active
    }

    // Check dependencies
    const { manifest } = registered.definition;
    for (const dep of manifest.requires ?? []) {
      const depPlugin = this.plugins.get(dep.id);
      if (!depPlugin) {
        if (dep.optional) {
          continue;
        }
        console.error(`Required dependency ${dep.id} not found for ${pluginId}`);
        registered.status = 'error';
        registered.error = new Error(`Required dependency ${dep.id} not found`);
        return false;
      }

      // Activate dependency first
      if (depPlugin.status !== 'active') {
        const depActivated = await this.activate(dep.id);
        if (!depActivated && !dep.optional) {
          registered.status = 'error';
          registered.error = new Error(`Failed to activate dependency ${dep.id}`);
          return false;
        }
      }
    }

    // Update status
    registered.status = 'activating';

    try {
      // Create context
      if (this.contextFactory) {
        registered.context = this.contextFactory(manifest);
      } else {
        // Minimal context if no factory set
        registered.context = {
          pluginId,
          get: () => undefined,
        };
      }

      // Call onLoad hook
      if (registered.definition.onLoad) {
        await registered.definition.onLoad(registered.context);
      }

      // Call onActivate hook
      if (registered.definition.onActivate) {
        registered.definition.onActivate(registered.context);
      }

      registered.status = 'active';

      // Notify listeners
      this.notifyActivation(pluginId);

      return true;
    } catch (error) {
      registered.status = 'error';
      registered.error = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId: string): Promise<boolean> {
    const registered = this.plugins.get(pluginId);
    if (!registered) {
      return false;
    }

    if (registered.status !== 'active') {
      return true;
    }

    registered.status = 'deactivating';

    try {
      // Call onDeactivate hook
      if (registered.definition.onDeactivate) {
        registered.definition.onDeactivate();
      }

      registered.status = 'registered';
      registered.context = undefined;

      return true;
    } catch (error) {
      registered.status = 'error';
      registered.error = error instanceof Error ? error : new Error(String(error));
      return false;
    }
  }

  /**
   * Unregister a plugin completely
   */
  async unregister(pluginId: string): Promise<boolean> {
    const registered = this.plugins.get(pluginId);
    if (!registered) {
      return false;
    }

    // Deactivate first
    await this.deactivate(pluginId);

    // Call onUnload hook
    if (registered.definition.onUnload) {
      try {
        registered.definition.onUnload();
      } catch (error) {
        console.error(`Error in onUnload for ${pluginId}:`, error);
      }
    }

    this.plugins.delete(pluginId);
    return true;
  }

  /**
   * Get a registered plugin
   */
  get(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get a plugin's manifest
   */
  getManifest(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId)?.definition.manifest;
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Check if a plugin is active
   */
  isActive(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.status === 'active';
  }

  /**
   * Get all registered plugin IDs
   */
  getAllPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all active plugin IDs
   */
  getActivePluginIds(): string[] {
    return Array.from(this.plugins.entries())
      .filter(([, p]) => p.status === 'active')
      .map(([id]) => id);
  }

  /**
   * Get plugins by status
   */
  getPluginsByStatus(status: PluginStatus): string[] {
    return Array.from(this.plugins.entries())
      .filter(([, p]) => p.status === status)
      .map(([id]) => id);
  }

  /**
   * Get plugins that have registered for a specific slot
   */
  getPluginsForSlot(slot: UISlot): RegisteredPlugin[] {
    return Array.from(this.plugins.values()).filter(
      (p) =>
        p.status === 'active' &&
        p.definition.manifest.slots?.some((s) => s.slot === slot)
    );
  }

  /**
   * Trigger activation for plugins listening to an event
   */
  triggerActivationEvent(event: ActivationEvent): void {
    for (const [pluginId, registered] of this.plugins) {
      if (registered.status !== 'registered') {
        continue;
      }

      const { manifest } = registered.definition;
      if (manifest.activation !== 'lazy') {
        continue;
      }

      const events = manifest.activationEvents ?? [];
      if (events.includes(event)) {
        this.activate(pluginId);
      }
    }
  }

  /**
   * Listen for when a specific plugin is activated
   */
  onActivated(pluginId: string, listener: ActivationListener): () => void {
    let listeners = this.activationListeners.get(pluginId);
    if (!listeners) {
      listeners = new Set();
      this.activationListeners.set(pluginId, listeners);
    }
    listeners.add(listener);

    // If already active, call immediately
    if (this.isActive(pluginId)) {
      listener(pluginId);
    }

    // Return unsubscribe function
    return () => {
      listeners?.delete(listener);
    };
  }

  /**
   * Notify listeners that a plugin was activated
   */
  private notifyActivation(pluginId: string): void {
    const listeners = this.activationListeners.get(pluginId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(pluginId);
        } catch (error) {
          console.error(`Error in activation listener for ${pluginId}:`, error);
        }
      }
    }
  }

  /**
   * Clear all plugins (useful for testing)
   */
  clear(): void {
    this.plugins.clear();
    this.activationListeners.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry();
