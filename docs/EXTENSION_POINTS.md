# Extension Points Reference

Extension points enable plugin-to-plugin extensibility without direct coupling. This document explains how to define, contribute to, and consume extension points.

---

## Table of Contents

1. [Overview](#overview)
2. [Defining Extension Points](#defining-extension-points)
3. [Contributing to Extension Points](#contributing-to-extension-points)
4. [Consuming Extension Contributions](#consuming-extension-contributions)
5. [Built-in Extension Points](#built-in-extension-points)
6. [Best Practices](#best-practices)

---

## Overview

Extension points create a contract between plugins:

- **Defining Plugin**: Creates an extension point with a schema describing what contributions should look like
- **Contributing Plugin**: Provides implementations that match the extension point's schema
- **Consuming Code**: Queries contributions and uses them at runtime

```
┌─────────────────────────────────────────────────────────────────┐
│                        Extension Flow                            │
│                                                                  │
│  ┌──────────────┐   defines   ┌──────────────┐                  │
│  │   TreeView   │────────────►│  nodeRenderer │                  │
│  │   Plugin     │             │  ext. point   │                  │
│  └──────────────┘             └───────┬───────┘                  │
│                                       │                          │
│                                       │ contributes to           │
│                                       ▼                          │
│  ┌──────────────┐             ┌──────────────┐                  │
│  │ CustomNodes  │────────────►│  contribution │                  │
│  │   Plugin     │             │  {nodeType,   │                  │
│  └──────────────┘             │   component}  │                  │
│                               └───────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Defining Extension Points

To define an extension point, declare it in your plugin manifest and provide a schema.

### Manifest Declaration

```typescript
const manifest: PluginManifest = {
  id: 'tree-view',
  version: '1.0.0',
  name: 'Tree View',
  description: 'Displays JSON as an editable tree',
  capabilities: [
    'document:read',
    'extensions:provide'  // Required to define extension points
  ],
  activationEvents: ['onStartup'],
  
  // Define extension points this plugin offers
  extensionPoints: [
    {
      id: 'tree-view.nodeRenderer',
      description: 'Custom renderers for specific node types',
      schema: {
        type: 'object',
        properties: {
          nodeType: {
            type: 'string',
            description: 'The JSON Schema type to render'
          },
          priority: {
            type: 'number',
            description: 'Higher priority renderers are used first'
          },
          component: {
            type: 'function',
            description: 'React component to render the node'
          }
        },
        required: ['nodeType', 'component']
      }
    }
  ]
};
```

### Schema Properties

The schema uses a simplified validation format:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | 'string', 'number', 'boolean', 'object', 'array', 'function' |
| `properties` | object | For objects, defines property schemas |
| `items` | object | For arrays, defines item schema |
| `required` | string[] | Required property names |
| `description` | string | Human-readable description |

### Programmatic Definition

Extension points are typically defined via manifest, but can also be defined programmatically:

```typescript
// In your plugin's activate function
function activate(context: PluginContext) {
  context.extensions?.define?.({
    id: 'my-plugin.customPoint',
    description: 'A custom extension point',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        handler: { type: 'function' }
      },
      required: ['name', 'handler']
    }
  });
}
```

---

## Contributing to Extension Points

To contribute to an extension point, declare the contribution in your manifest.

### Manifest Declaration

```typescript
const manifest: PluginManifest = {
  id: 'custom-nodes',
  version: '1.0.0',
  name: 'Custom Node Renderers',
  description: 'Adds custom node renderers',
  capabilities: [
    'extensions:contribute'  // Required to contribute
  ],
  activationEvents: ['onStartup'],
  
  // Contribute to extension points
  extensions: [
    {
      point: 'tree-view.nodeRenderer',
      id: 'date-renderer',
      contribution: {
        nodeType: 'date',
        priority: 100,
        component: 'DateNodeRenderer'  // Key in components
      }
    },
    {
      point: 'tree-view.nodeRenderer',
      id: 'color-renderer',
      contribution: {
        nodeType: 'color',
        priority: 100,
        component: 'ColorNodeRenderer'
      }
    }
  ]
};
```

### Component References

The `component` field typically references a key in your plugin definition's `components`:

```typescript
const definition: PluginDefinition = {
  activate(context) {
    console.log('Custom nodes plugin activated');
  },
  
  components: {
    DateNodeRenderer: DateNodeComponent,
    ColorNodeRenderer: ColorNodeComponent
  }
};
```

### Inline Contributions

For simple data contributions (not components), you can inline the value:

```typescript
extensions: [
  {
    point: 'settings.categories',
    id: 'my-category',
    contribution: {
      id: 'my-plugin-settings',
      label: 'My Plugin Settings',
      order: 50
    }
  }
]
```

---

## Consuming Extension Contributions

### Using the React Hook

The easiest way to consume contributions is via the `useExtensions` hook:

```typescript
import { useExtensions } from '@/core/hooks';

function TreeView() {
  // Get all contributions to this extension point
  const nodeRenderers = useExtensions('tree-view.nodeRenderer');
  
  function renderNode(node: TreeNode) {
    // Find a matching renderer
    const renderer = nodeRenderers
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .find(r => r.nodeType === node.type);
    
    if (renderer?.component) {
      const Component = renderer.component;
      return <Component node={node} />;
    }
    
    // Fall back to default rendering
    return <DefaultNodeRenderer node={node} />;
  }
  
  return <div>{nodes.map(renderNode)}</div>;
}
```

### Using PluginContext

For non-React contexts, use the PluginContext directly:

```typescript
function activate(context: PluginContext) {
  const contributions = context.extensions?.getContributions?.(
    'tree-view.nodeRenderer'
  ) ?? [];
  
  contributions.forEach(contrib => {
    console.log('Found renderer for:', contrib.nodeType);
  });
}
```

### Typed Contributions

For type safety, define an interface for your contributions:

```typescript
interface NodeRendererContribution {
  nodeType: string;
  priority?: number;
  component: React.ComponentType<{ node: TreeNode }>;
}

function TreeView() {
  const renderers = useExtensions('tree-view.nodeRenderer') as NodeRendererContribution[];
  // Now renderers is properly typed
}
```

---

## Built-in Extension Points

These extension points are defined by core plugins:

### `tree-view.nodeRenderer`

Custom renderers for tree node types.

**Schema:**
```typescript
{
  nodeType: string;      // JSON Schema type or custom type
  priority?: number;     // Higher = tried first (default: 0)
  component: Component;  // React component
}
```

**Component Props:**
```typescript
interface NodeRendererProps {
  node: {
    path: string;
    value: unknown;
    schema: JSONSchema;
  };
  onChange: (value: unknown) => void;
}
```

### `tree-view.contextMenu`

Context menu items for tree nodes.

**Schema:**
```typescript
{
  id: string;
  label: string;
  icon?: string;          // Icon name
  order?: number;         // Menu position
  condition?: string;     // When to show (e.g., 'nodeType:array')
  action: (node) => void;
}
```

### `preview.renderer`

Custom preview renderers.

**Schema:**
```typescript
{
  id: string;
  name: string;
  icon?: string;
  component: Component;
}
```

### `toolbar.items`

Toolbar button items.

**Schema:**
```typescript
{
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  order?: number;
  action: () => void;
}
```

### `settings.sections`

Settings panel sections.

**Schema:**
```typescript
{
  id: string;
  label: string;
  icon?: string;
  order?: number;
  component: Component;
}
```

---

## Best Practices

### 1. Namespace Your Extension Points

Always prefix extension point IDs with your plugin ID:

```typescript
// ✅ Good
extensionPoints: [
  { id: 'my-plugin.customPoint', ... }
]

// ❌ Bad - could conflict
extensionPoints: [
  { id: 'customPoint', ... }
]
```

### 2. Provide Comprehensive Schemas

Good schemas enable validation and documentation:

```typescript
// ✅ Good - detailed schema
{
  id: 'tree-view.nodeRenderer',
  description: 'Custom renderers for tree nodes',
  schema: {
    type: 'object',
    properties: {
      nodeType: {
        type: 'string',
        description: 'JSON Schema type to match'
      },
      priority: {
        type: 'number',
        description: 'Higher priority = tried first'
      },
      component: {
        type: 'function',
        description: 'React component receiving node props'
      }
    },
    required: ['nodeType', 'component']
  }
}

// ❌ Bad - minimal schema
{
  id: 'tree-view.nodeRenderer',
  schema: { type: 'object' }
}
```

### 3. Handle Missing Contributions

Always provide fallback behavior:

```typescript
const renderers = useExtensions('tree-view.nodeRenderer');

function renderNode(node: TreeNode) {
  const renderer = renderers.find(r => r.nodeType === node.type);
  
  // ✅ Good - fallback behavior
  if (renderer?.component) {
    return <renderer.component node={node} />;
  }
  return <DefaultRenderer node={node} />;
}
```

### 4. Document Extension Points

Include JSDoc or markdown documentation:

```typescript
/**
 * Extension point: tree-view.nodeRenderer
 * 
 * Allows plugins to provide custom renderers for specific node types.
 * 
 * @example
 * ```typescript
 * extensions: [{
 *   point: 'tree-view.nodeRenderer',
 *   id: 'my-date-renderer',
 *   contribution: {
 *     nodeType: 'date',
 *     component: MyDateRenderer
 *   }
 * }]
 * ```
 */
```

### 5. Use Priority for Ordering

When multiple contributions exist, use priority:

```typescript
// Core renderer - lower priority
{ nodeType: 'string', priority: 0, component: StringNode }

// Plugin override - higher priority
{ nodeType: 'string', priority: 100, component: EnhancedStringNode }

// Consumer code
const sorted = renderers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
const winner = sorted[0]; // EnhancedStringNode wins
```

### 6. Version Your Extension Points

When making breaking changes, create a new extension point:

```typescript
// Original
extensionPoints: [
  { id: 'tree-view.nodeRenderer', ... }
]

// Breaking change - new version
extensionPoints: [
  { id: 'tree-view.nodeRenderer', ... },        // Keep for compatibility
  { id: 'tree-view.nodeRenderer.v2', ... }      // New version
]
```

---

## Error Handling

### Invalid Contributions

Contributions that don't match the schema are rejected:

```typescript
// Extension point expects { nodeType: string, component: function }
extensions: [
  {
    point: 'tree-view.nodeRenderer',
    contribution: {
      // Missing nodeType - will be rejected
      component: MyComponent
    }
  }
]
```

Check console for validation errors during development.

### Missing Extension Points

Contributing to a non-existent extension point logs a warning but doesn't crash:

```typescript
extensions: [
  {
    point: 'nonexistent.point',  // Warning: extension point not found
    contribution: { ... }
  }
]
```

### Circular Dependencies

Avoid extension points that require each other:

```typescript
// ❌ Bad - circular dependency
// Plugin A defines point that Plugin B extends
// Plugin B defines point that Plugin A extends

// ✅ Good - one-directional flow
// Core defines points, plugins extend them
```

---

## See Also

- [API Reference](./API_REFERENCE.md) - Full API documentation
- [Services Reference](./SERVICES.md) - Service-based extensibility
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) - Creating plugins
