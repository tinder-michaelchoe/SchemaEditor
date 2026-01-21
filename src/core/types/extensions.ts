/**
 * Extension Point Types
 * 
 * Extension points enable plugin-to-plugin extensibility without tight coupling.
 * A plugin defines an extension point (a contract), and other plugins can
 * contribute implementations.
 */

import type { ExtensionPointSchema, ExtensionPointDeclaration, ExtensionContribution } from './plugin';

// ============================================================================
// Extension Point Registry Types
// ============================================================================

/**
 * Internal representation of a registered extension point
 */
export interface RegisteredExtensionPoint {
  /** Full extension point ID (e.g., "tree-view.nodeRenderer") */
  id: string;
  /** Plugin that defined this extension point */
  pluginId: string;
  /** The declaration */
  declaration: ExtensionPointDeclaration;
  /** All contributions to this extension point */
  contributions: RegisteredContribution[];
}

/**
 * Internal representation of a contribution to an extension point
 */
export interface RegisteredContribution {
  /** Plugin that made this contribution */
  pluginId: string;
  /** The contribution data */
  contribution: Record<string, unknown>;
  /** Priority for ordering (higher = first) */
  priority: number;
}

// ============================================================================
// Extension Point Validation
// ============================================================================

/**
 * Result of validating a contribution against an extension point schema
 */
export interface ExtensionValidationResult {
  valid: boolean;
  errors: ExtensionValidationError[];
}

/**
 * Validation error for extension contributions
 */
export interface ExtensionValidationError {
  property: string;
  message: string;
  expected?: string;
  received?: string;
}

/**
 * Validate a contribution against an extension point schema
 */
export function validateContribution(
  contribution: Record<string, unknown>,
  schema: ExtensionPointSchema
): ExtensionValidationResult {
  const errors: ExtensionValidationError[] = [];

  // Check all required properties exist
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    if (propSchema.required && !(propName in contribution)) {
      errors.push({
        property: propName,
        message: `Missing required property "${propName}"`,
      });
      continue;
    }

    if (propName in contribution) {
      const value = contribution[propName];
      const actualType = getValueType(value);

      if (actualType !== propSchema.type) {
        errors.push({
          property: propName,
          message: `Property "${propName}" has wrong type`,
          expected: propSchema.type,
          received: actualType,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get the type of a value for validation
 */
function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'function') return 'function';
  return typeof value;
}

// ============================================================================
// Common Extension Point Types
// ============================================================================

/**
 * Node renderer extension for TreeView
 * Example of a commonly-defined extension point
 */
export interface NodeRendererExtension {
  /** Node type to render (matched against schema type or component type) */
  nodeType: string;
  /** React component to render the node */
  component: React.ComponentType<NodeRendererProps>;
  /** Priority (higher = checked first) */
  priority?: number;
}

/**
 * Props passed to node renderer extensions
 */
export interface NodeRendererProps {
  /** The node value */
  value: unknown;
  /** Path to this node */
  path: string;
  /** Schema for this node */
  schema: unknown;
  /** Whether this node is selected */
  isSelected: boolean;
  /** Callback to update the value */
  onChange: (value: unknown) => void;
}

/**
 * Component source extension for ComponentPalette
 */
export interface ComponentSourceExtension {
  /** Unique ID for this source */
  id: string;
  /** Display name */
  name: string;
  /** Icon (optional) */
  icon?: React.ReactNode;
  /** Function to get components from this source */
  getComponents: () => ComponentDefinition[];
}

/**
 * Component definition for the palette
 */
export interface ComponentDefinition {
  /** Unique component type */
  type: string;
  /** Display name */
  name: string;
  /** Category for grouping */
  category: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Description */
  description?: string;
  /** Default properties when added */
  defaultProps?: Record<string, unknown>;
}

/**
 * Property editor extension for PropertyInspector
 */
export interface PropertyEditorExtension {
  /** Property type to handle */
  propertyType: string;
  /** React component for editing */
  component: React.ComponentType<PropertyEditorProps>;
  /** Priority */
  priority?: number;
}

/**
 * Props passed to property editor extensions
 */
export interface PropertyEditorProps {
  /** Property name */
  name: string;
  /** Current value */
  value: unknown;
  /** Schema for this property */
  schema: unknown;
  /** Callback to update */
  onChange: (value: unknown) => void;
  /** Whether editing is disabled */
  disabled?: boolean;
}

// ============================================================================
// Extension Point IDs (Well-Known)
// ============================================================================

/**
 * Well-known extension point IDs
 * Plugins should use these constants instead of hardcoding strings
 */
export const EXTENSION_POINTS = {
  /** Custom node renderers for TreeView */
  TREE_VIEW_NODE_RENDERER: 'tree-view.nodeRenderer',
  /** Custom property editors for PropertyInspector */
  INSPECTOR_PROPERTY_EDITOR: 'property-inspector.propertyEditor',
  /** Component sources for ComponentPalette */
  PALETTE_COMPONENT_SOURCE: 'component-palette.componentSource',
} as const;

export type WellKnownExtensionPoint =
  (typeof EXTENSION_POINTS)[keyof typeof EXTENSION_POINTS];
