/**
 * Drag Drop Registry
 *
 * Manages component drag-drop capabilities, drop zone calculation,
 * and validation rules based on the JSON schema.
 */

import type { DragSourceType, DragSource } from './DragDropManager';
import { SchemaParser } from '../../services/schemaParser';

export interface DropZoneVisual {
  id: string;
  targetPath: string;
  bounds: DOMRect;
  position: 'before' | 'after' | 'inside' | 'header' | 'footer';
  indicator: 'line' | 'highlight';
  orientation?: 'horizontal' | 'vertical';
  componentType: string;
  index?: number; // For insert positions
}

export interface ComponentDragConfig {
  componentType: string;
  canAccept: (childType: string) => boolean;
  getDropZones: (
    element: HTMLElement,
    dragType: DragSourceType,
    componentData: any
  ) => DropZoneVisual[];
}

export class DragDropRegistry {
  private schemaParser: SchemaParser | null = null;
  private componentConfigs = new Map<string, ComponentDragConfig>();

  constructor(schemaParser?: SchemaParser) {
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
   * Auto-register components from schema
   */
  private autoRegisterFromSchema() {
    if (!this.schemaParser) return;

    // Register layout containers (vstack, hstack, zstack)
    this.registerLayoutContainer('vstack', 'horizontal');
    this.registerLayoutContainer('hstack', 'vertical');
    this.registerLayoutContainer('zstack', 'horizontal');

    // Register special components
    this.registerForEach();
    this.registerSectionLayout();

    // Register leaf components (no children)
    this.registerLeafComponents();
  }

  /**
   * Register a layout container (vstack, hstack, zstack)
   */
  private registerLayoutContainer(
    componentType: 'vstack' | 'hstack' | 'zstack',
    lineOrientation: 'horizontal' | 'vertical'
  ) {
    this.componentConfigs.set(componentType, {
      componentType,
      canAccept: (childType: string) => {
        if (!this.schemaParser) return false;
        return this.schemaParser.canAcceptChild(componentType, childType);
      },
      getDropZones: (element, dragType, componentData) => {
        const zones: DropZoneVisual[] = [];
        const bounds = element.getBoundingClientRect();
        const children = componentData.children || [];

        if (children.length === 0) {
          // Empty container: show highlight box
          zones.push({
            id: `${componentType}-inside-${Date.now()}`,
            targetPath: componentData.path || '',
            bounds,
            position: 'inside',
            indicator: 'highlight',
            componentType,
            index: 0,
          });
        } else {
          // Has children: show lines between them
          // Note: Actual child element bounds would be calculated by the UI component
          // This is a simplified version
          children.forEach((child: any, index: number) => {
            zones.push({
              id: `${componentType}-before-${index}-${Date.now()}`,
              targetPath: componentData.path || '',
              bounds, // Would be calculated based on child position
              position: 'before',
              indicator: 'line',
              orientation: lineOrientation,
              componentType,
              index,
            });
          });

          // Add zone after last child
          zones.push({
            id: `${componentType}-after-${children.length - 1}-${Date.now()}`,
            targetPath: componentData.path || '',
            bounds,
            position: 'after',
            indicator: 'line',
            orientation: lineOrientation,
            componentType,
            index: children.length,
          });
        }

        return zones;
      },
    });
  }

  /**
   * Register forEach component
   */
  private registerForEach() {
    this.componentConfigs.set('forEach', {
      componentType: 'forEach',
      canAccept: (childType: string) => {
        if (!this.schemaParser) return false;
        return this.schemaParser.canAcceptChild('forEach', childType);
      },
      getDropZones: (element, dragType, componentData) => {
        const zones: DropZoneVisual[] = [];
        const bounds = element.getBoundingClientRect();

        // forEach has a template property, not children
        // Can only accept one template
        if (!componentData.template) {
          zones.push({
            id: `forEach-template-${Date.now()}`,
            targetPath: componentData.path || '',
            bounds,
            position: 'inside',
            indicator: 'highlight',
            componentType: 'forEach',
          });
        }

        return zones;
      },
    });
  }

  /**
   * Register sectionLayout component
   */
  private registerSectionLayout() {
    this.componentConfigs.set('sectionLayout', {
      componentType: 'sectionLayout',
      canAccept: (childType: string) => {
        if (!this.schemaParser) return false;
        return this.schemaParser.canAcceptChild('sectionLayout', childType);
      },
      getDropZones: (element, dragType, componentData) => {
        const zones: DropZoneVisual[] = [];
        const bounds = element.getBoundingClientRect();

        // sectionLayout has sections array, each with header/children/footer
        // This is complex and would be handled separately in the UI
        // For now, return empty zones
        return zones;
      },
    });
  }

  /**
   * Register leaf components (no children)
   */
  private registerLeafComponents() {
    const leafTypes = [
      'label',
      'button',
      'textfield',
      'image',
      'toggle',
      'slider',
      'divider',
      'spacer',
      'gradient',
    ];

    leafTypes.forEach(componentType => {
      this.componentConfigs.set(componentType, {
        componentType,
        canAccept: () => false, // Leaf nodes don't accept children
        getDropZones: () => [], // No drop zones
      });
    });
  }

  /**
   * Register a custom component configuration
   */
  registerComponent(config: ComponentDragConfig) {
    this.componentConfigs.set(config.componentType, config);
  }

  /**
   * Check if a parent can accept a child
   */
  canAcceptDrop(parentType: string, childType: string): boolean {
    const config = this.componentConfigs.get(parentType);
    if (!config) return false;

    return config.canAccept(childType);
  }

  /**
   * Get drop zones for a component
   */
  getDropZones(
    componentType: string,
    element: HTMLElement,
    dragType: DragSourceType,
    componentData: any
  ): DropZoneVisual[] {
    const config = this.componentConfigs.get(componentType);
    if (!config) return [];

    return config.getDropZones(element, dragType, componentData);
  }

  /**
   * Check if a drag source can be dropped on a target
   */
  canDrop(source: DragSource, targetComponentType: string): boolean {
    // Extract component type from drag source
    let sourceComponentType: string | null = null;

    if (source.type === 'palette-component') {
      const data = source.data as { type?: string };
      sourceComponentType = data.type || null;
    } else if (source.type === 'canvas-node' || source.type === 'layer-node') {
      const data = source.data as { type?: string };
      sourceComponentType = data.type || null;
    }

    if (!sourceComponentType) return false;

    return this.canAcceptDrop(targetComponentType, sourceComponentType);
  }

  /**
   * Get all registered component types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.componentConfigs.keys());
  }

  /**
   * Check if a component type is registered
   */
  isRegistered(componentType: string): boolean {
    return this.componentConfigs.has(componentType);
  }
}

// Singleton instance
let registryInstance: DragDropRegistry | null = null;

/**
 * Get or create the drag drop registry instance
 */
export function getDragDropRegistry(): DragDropRegistry {
  if (!registryInstance) {
    registryInstance = new DragDropRegistry();
  }
  return registryInstance;
}

/**
 * Initialize the registry with a schema parser
 */
export function initDragDropRegistry(schemaParser: SchemaParser): DragDropRegistry {
  if (!registryInstance) {
    registryInstance = new DragDropRegistry(schemaParser);
  } else {
    registryInstance.setSchemaParser(schemaParser);
  }
  return registryInstance;
}
