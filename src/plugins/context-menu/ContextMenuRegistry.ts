/**
 * Context Menu Registry
 *
 * Manages component context menu actions and capabilities based on the JSON schema.
 * Similar pattern to DragDropRegistry.
 */

import type { ContextMenuAction, ComponentActionsConfig, ActionContext } from './types';
import { SchemaParser } from '@/services/schemaParser';
import { encloseActions } from './actions/encloseActions';
import { deleteAction } from './actions/deleteAction';

// Container types that have limited actions
const CONTAINER_TYPES = ['vstack', 'hstack', 'zstack', 'forEach', 'sectionLayout'];

export class ContextMenuRegistry {
  private schemaParser: SchemaParser | null = null;
  private componentConfigs = new Map<string, ComponentActionsConfig>();
  private actions = new Map<string, ContextMenuAction>();

  constructor(schemaParser?: SchemaParser) {
    // Register built-in actions
    this.registerBuiltInActions();

    if (schemaParser) {
      this.schemaParser = schemaParser;
      this.autoRegisterFromSchema();
    }
  }

  /**
   * Set the schema parser
   */
  setSchemaParser(parser: SchemaParser) {
    this.schemaParser = parser;
    this.autoRegisterFromSchema();
  }

  /**
   * Register built-in actions
   */
  private registerBuiltInActions() {
    // Register enclose actions
    encloseActions.forEach(action => {
      this.registerAction(action);
    });

    // Register delete action
    this.registerAction(deleteAction);
  }

  /**
   * Auto-register components from schema
   */
  private autoRegisterFromSchema() {
    if (!this.schemaParser) return;

    const componentTypes = this.schemaParser.getAllComponentTypes();

    componentTypes.forEach(componentType => {
      // Determine available actions based on component type
      const availableActions: string[] = [];

      // Containers get limited actions (no enclose)
      const isContainer = CONTAINER_TYPES.includes(componentType);

      if (!isContainer) {
        // Leaf components can be enclosed
        availableActions.push('enclose');
      }

      // All components can be deleted
      availableActions.push('delete');

      // Register component config
      this.componentConfigs.set(componentType, {
        componentType,
        availableActions,
      });
    });

    // Also register generic "component" type for any custom components
    this.componentConfigs.set('component', {
      componentType: 'component',
      availableActions: ['enclose', 'delete'],
    });
  }

  /**
   * Register a new action
   */
  registerAction(action: ContextMenuAction) {
    this.actions.set(action.id, action);
  }

  /**
   * Get available actions for a component type
   */
  getAvailableActions(componentType: string): ContextMenuAction[] {
    const config = this.componentConfigs.get(componentType);
    if (!config) {
      // Default to generic component actions for unknown types
      const genericConfig = this.componentConfigs.get('component');
      if (!genericConfig) return [];
      return this.getActionsById(genericConfig.availableActions, componentType);
    }

    return this.getActionsById(config.availableActions, componentType);
  }

  /**
   * Get actions by their IDs, filtering by availability
   */
  private getActionsById(actionIds: string[], componentType: string): ContextMenuAction[] {
    const actions: ContextMenuAction[] = [];

    actionIds.forEach(id => {
      const action = this.actions.get(id);
      if (action && action.isAvailable(componentType)) {
        actions.push(action);
      }
    });

    return actions;
  }

  /**
   * Execute an action
   */
  executeAction(actionId: string, context: ActionContext): boolean {
    const action = this.actions.get(actionId);
    if (!action) {
      console.warn(`Context menu action not found: ${actionId}`);
      return false;
    }

    // Check if action is available for this component type
    const componentType = (context.componentData as { type?: string })?.type || 'unknown';
    if (!action.isAvailable(componentType)) {
      console.warn(`Action ${actionId} is not available for component type ${componentType}`);
      return false;
    }

    try {
      action.execute(context);
      return true;
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      return false;
    }
  }

  /**
   * Get all registered action IDs
   */
  getAllActionIds(): string[] {
    return Array.from(this.actions.keys());
  }

  /**
   * Check if an action is registered
   */
  isActionRegistered(actionId: string): boolean {
    return this.actions.has(actionId);
  }
}

// Singleton instance
let registryInstance: ContextMenuRegistry | null = null;

/**
 * Get or create the context menu registry instance
 */
export function getContextMenuRegistry(): ContextMenuRegistry {
  if (!registryInstance) {
    registryInstance = new ContextMenuRegistry();
  }
  return registryInstance;
}

/**
 * Initialize the registry with a schema parser
 */
export function initContextMenuRegistry(schemaParser: SchemaParser): ContextMenuRegistry {
  if (!registryInstance) {
    registryInstance = new ContextMenuRegistry(schemaParser);
  } else {
    registryInstance.setSchemaParser(schemaParser);
  }
  return registryInstance;
}
