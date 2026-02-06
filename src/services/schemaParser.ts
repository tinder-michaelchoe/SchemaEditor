/**
 * Schema Parser Service
 *
 * Provides utilities for parsing and validating component structures
 * based on the CLADS JSON schema.
 */

interface SchemaDefinition {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  $ref?: string;
  oneOf?: any[];
  items?: any;
  enum?: string[];
  const?: string;
}

interface ComponentSchema {
  type: string;
  hasChildren: boolean;
  hasTemplate: boolean;
  hasSections: boolean;
  childrenProperty?: 'children' | 'template' | 'sections';
  acceptsChildren: boolean;
}

export class SchemaParser {
  private schema: any;
  private componentCache = new Map<string, ComponentSchema>();

  constructor(schema: any) {
    this.schema = schema;
    this.buildComponentCache();
  }

  /**
   * Build cache of component definitions from schema
   */
  private buildComponentCache() {
    if (!this.schema.$defs) return;

    // Process all component definitions
    Object.keys(this.schema.$defs).forEach(defKey => {
      const def = this.schema.$defs[defKey];

      // Check if this is a component definition
      if (this.isComponentDefinition(def)) {
        const componentInfo = this.analyzeComponentDefinition(defKey, def);
        this.componentCache.set(defKey, componentInfo);

        // Special handling for layout containers (vstack, hstack, zstack)
        // The schema defines them under "layout" with a type enum
        if (defKey === 'layout') {
          const typeEnum = def.properties?.type?.enum || [];
          typeEnum.forEach((layoutType: string) => {
            // Add each layout type as its own entry pointing to the same info
            this.componentCache.set(layoutType, {
              ...componentInfo,
              type: layoutType,
            });
          });
          console.log('[SchemaParser] Registered layout types:', typeEnum);
        }

        // Ensure spacer is registered
        if (defKey === 'spacer') {
          console.log('[SchemaParser] Registered spacer');
        }
      }
    });

    console.log('[SchemaParser] Component cache keys:', Array.from(this.componentCache.keys()));
  }

  /**
   * Check if a definition represents a component
   */
  private isComponentDefinition(def: SchemaDefinition): boolean {
    // Has a type property with specific values or enum
    if (def.properties?.type) {
      return true;
    }
    return false;
  }

  /**
   * Analyze a component definition to extract capabilities
   */
  private analyzeComponentDefinition(key: string, def: SchemaDefinition): ComponentSchema {
    const properties = def.properties || {};

    // Check for children property
    const hasChildren = 'children' in properties;
    const hasTemplate = 'template' in properties;
    const hasSections = 'sections' in properties;

    // Determine if component accepts children
    const acceptsChildren = hasChildren || hasTemplate || hasSections;

    // Determine the property name used for children
    let childrenProperty: 'children' | 'template' | 'sections' | undefined;
    if (hasChildren) childrenProperty = 'children';
    else if (hasTemplate) childrenProperty = 'template';
    else if (hasSections) childrenProperty = 'sections';

    return {
      type: key,
      hasChildren,
      hasTemplate,
      hasSections,
      childrenProperty,
      acceptsChildren,
    };
  }

  /**
   * Resolve a $ref reference
   */
  private resolveRef(ref: string): any {
    if (!ref.startsWith('#/$defs/')) {
      console.warn('SchemaParser: Cannot resolve non-local ref:', ref);
      return null;
    }

    const defName = ref.replace('#/$defs/', '');
    return this.schema.$defs?.[defName] || null;
  }

  /**
   * Check if a component type can have children
   */
  canHaveChildren(componentType: string): boolean {
    const info = this.componentCache.get(componentType);
    return info?.acceptsChildren ?? false;
  }

  /**
   * Check if a parent component can accept a specific child type
   */
  canAcceptChild(parentType: string, childType: string): boolean {
    const parentInfo = this.componentCache.get(parentType);

    if (!parentInfo?.acceptsChildren) {
      console.log('[SchemaParser.canAcceptChild] Parent does not accept children:', parentType);
      return false;
    }

    // For layout containers (vstack, hstack, zstack), look up the "layout" definition
    const isLayoutType = ['vstack', 'hstack', 'zstack'].includes(parentType);
    const parentDefKey = isLayoutType ? 'layout' : parentType;
    const parentDef = this.schema.$defs?.[parentDefKey];

    if (!parentDef) {
      console.log('[SchemaParser.canAcceptChild] Parent definition not found:', parentDefKey);
      return false;
    }

    const childrenProp = parentInfo.childrenProperty;
    if (!childrenProp) {
      console.log('[SchemaParser.canAcceptChild] No children property:', parentType);
      return false;
    }

    const childrenSchema = parentDef.properties[childrenProp];
    if (!childrenSchema) {
      console.log('[SchemaParser.canAcceptChild] Children schema not found:', childrenProp);
      return false;
    }

    // Check if it's an array with items
    if (childrenSchema.type === 'array' && childrenSchema.items) {
      // If items has a $ref to layoutNode, any layout component is valid
      if (childrenSchema.items.$ref === '#/$defs/layoutNode') {
        const result = this.isLayoutNode(childType);
        console.log('[SchemaParser.canAcceptChild] Checking layoutNode:', {
          parentType,
          childType,
          isLayoutNode: result,
        });
        return result;
      }
    }

    // For template (forEach), check if the child matches the template type
    if (childrenProp === 'template') {
      if (childrenSchema.$ref === '#/$defs/layoutNode') {
        return this.isLayoutNode(childType);
      }
    }

    // For sections (sectionLayout), need special handling
    if (childrenProp === 'sections') {
      // Sections is more complex - each section can have header, children, footer
      return false; // Handled separately in the UI
    }

    return false;
  }

  /**
   * Check if a component type is a valid layoutNode
   */
  private isLayoutNode(componentType: string): boolean {
    // layoutNode can be: layout (vstack/hstack/zstack), component, sectionLayout, forEach, spacer
    console.log('[SchemaParser.isLayoutNode] Checking componentType:', componentType);

    const layoutNodeDef = this.schema.$defs?.layoutNode;
    if (!layoutNodeDef) {
      console.log('[SchemaParser.isLayoutNode] No layoutNode definition in schema');
      return false;
    }

    // Check oneOf array for valid types
    if (layoutNodeDef.oneOf) {
      console.log('[SchemaParser.isLayoutNode] Checking oneOf options:', layoutNodeDef.oneOf.length);
      console.log('[SchemaParser.isLayoutNode] All options:', layoutNodeDef.oneOf.map((opt: any) => opt.$ref || 'NO_REF'));

      for (const option of layoutNodeDef.oneOf) {
        if (option.$ref) {
          const refName = option.$ref.replace('#/$defs/', '');
          console.log('[SchemaParser.isLayoutNode] Checking ref:', refName, 'against:', componentType);

          // Check if componentType matches this ref (e.g., "spacer" === "spacer")
          if (refName === componentType) {
            console.log('[SchemaParser.isLayoutNode] ✓ Direct match:', componentType);
            return true;
          }

          // For layout types (vstack, hstack, zstack), check the enum
          if (refName === 'layout') {
            const layoutDef = this.schema.$defs?.layout;
            const typeEnum = layoutDef?.properties?.type?.enum || [];
            if (typeEnum.includes(componentType)) {
              console.log('[SchemaParser.isLayoutNode] ✓ Layout type match:', componentType);
              return true;
            }
          }

          // For component types, check if it's a valid component
          if (refName === 'component') {
            const isValid = this.isValidComponent(componentType);
            console.log('[SchemaParser.isLayoutNode] Component check:', {
              componentType,
              isValid,
            });
            // Only return true if valid, otherwise continue checking other refs
            if (isValid) {
              return true;
            }
          }
        }
      }
    }

    console.log('[SchemaParser.isLayoutNode] ✗ No match found for:', componentType);
    return false;
  }

  /**
   * Check if a type is a valid component (label, button, etc.)
   */
  private isValidComponent(componentType: string): boolean {
    const componentDef = this.schema.$defs?.component;
    if (!componentDef) return false;

    // Component type can be any string except the ones in the "not" enum
    const typeProperty = componentDef.properties?.type;
    if (!typeProperty) return false;

    // Check if type is in the excluded list
    const notEnum = typeProperty.not?.enum || [];
    if (notEnum.includes(componentType)) {
      return false;
    }

    // Check examples list (label, button, textfield, etc.)
    const examples = typeProperty.examples || [];
    if (examples.includes(componentType)) {
      return true;
    }

    // If not in examples but not in excluded list, assume it's valid
    // (custom components are allowed)
    return true;
  }

  /**
   * Get all valid child types for a parent component
   */
  getValidChildTypes(parentType: string): string[] {
    const parentInfo = this.componentCache.get(parentType);

    if (!parentInfo?.acceptsChildren) {
      return [];
    }

    // Return all layoutNode types
    const validTypes: string[] = [];

    // Add layout types
    validTypes.push('vstack', 'hstack', 'zstack');

    // Add component types (from examples)
    const componentDef = this.schema.$defs?.component;
    const examples = componentDef?.properties?.type?.examples || [];
    validTypes.push(...examples);

    // Add special types
    validTypes.push('sectionLayout', 'forEach', 'spacer');

    return validTypes;
  }

  /**
   * Get component information
   */
  getComponentInfo(componentType: string): ComponentSchema | null {
    return this.componentCache.get(componentType) || null;
  }

  /**
   * Get all component types from schema
   */
  getAllComponentTypes(): string[] {
    return Array.from(this.componentCache.keys());
  }
}

// Singleton instance
let schemaParserInstance: SchemaParser | null = null;

/**
 * Initialize the schema parser with the loaded schema
 */
export function initSchemaParser(schema: any): SchemaParser {
  schemaParserInstance = new SchemaParser(schema);
  return schemaParserInstance;
}

/**
 * Get the schema parser instance
 */
export function getSchemaParser(): SchemaParser {
  if (!schemaParserInstance) {
    throw new Error('SchemaParser not initialized. Call initSchemaParser() first.');
  }
  return schemaParserInstance;
}

/**
 * Load and initialize schema parser from JSON file
 */
export async function loadAndInitSchemaParser(schemaUrl: string = '/clads-schema.json'): Promise<SchemaParser> {
  try {
    const response = await fetch(schemaUrl);
    const schema = await response.json();
    return initSchemaParser(schema);
  } catch (error) {
    console.error('Failed to load schema:', error);
    throw error;
  }
}
