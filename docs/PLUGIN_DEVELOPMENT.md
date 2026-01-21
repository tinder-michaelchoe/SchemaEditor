# Plugin Development Guide

This guide walks you through creating plugins for the Schema Editor. Whether you're building a new feature, customizing the UI, or integrating with external systems, plugins are the way to do it.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Structure](#plugin-structure)
3. [Creating Your First Plugin](#creating-your-first-plugin)
4. [Working with the API](#working-with-the-api)
5. [UI Integration](#ui-integration)
6. [Extension Points](#extension-points)
7. [Services](#services)
8. [Events](#events)
9. [Testing Plugins](#testing-plugins)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Familiarity with TypeScript and React
- Basic understanding of JSON Schema

### Quick Start with CLI

The fastest way to create a plugin is using the scaffolding CLI:

```bash
# Create a sidebar plugin
npx ts-node scripts/create-plugin.ts my-plugin --template=sidebar

# Create a view plugin
npx ts-node scripts/create-plugin.ts custom-preview --template=view

# Create a service plugin
npx ts-node scripts/create-plugin.ts validation-service --template=service

# Create an extension contributor
npx ts-node scripts/create-plugin.ts custom-nodes --template=extension-contributor
```

### Manual Creation

Alternatively, copy a template from `src/plugins/templates/` and customize it.

---

## Plugin Structure

Every plugin consists of two parts:

### 1. Manifest (`manifest.ts`)

Declares what the plugin does and needs:

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',           // Unique identifier
  version: '1.0.0',          // Semver version
  name: 'My Plugin',         // Display name
  description: 'Does X',     // What it does
  
  capabilities: [...],       // What it needs access to
  activationEvents: [...],   // When to activate
  slots: [...],              // Where to render UI
  extensionPoints: [...],    // Extension points it defines
  extensions: [...],         // Extensions it contributes
  provides: [...],           // Services it provides
  consumes: [...],           // Services it uses
  emits: [...],              // Events it emits
  dependencies: [...],       // Other plugins it requires
};
```

### 2. Definition (`index.ts`)

Contains the runtime implementation:

```typescript
export const definition: PluginDefinition = {
  activate(context) { ... },   // Called on activation
  deactivate() { ... },        // Called on deactivation
  components: { ... },         // React components
  extensionImplementations: { ... },
  serviceImplementations: { ... },
};
```

---

## Creating Your First Plugin

Let's create a simple property inspector plugin that shows details about the selected node.

### Step 1: Create the Plugin Files

```bash
mkdir -p src/plugins/property-inspector/components
```

### Step 2: Define the Manifest

```typescript
// src/plugins/property-inspector/manifest.ts
import type { PluginManifest } from '../../core/types';

export const manifest: PluginManifest = {
  id: 'property-inspector',
  version: '1.0.0',
  name: 'Property Inspector',
  description: 'Shows details about the selected node',
  
  capabilities: [
    'document:read',
    'selection:read',
    'ui:slots',
    'ui:theme',
  ],
  
  activationEvents: ['onStartup'],
  
  slots: [
    {
      slot: 'sidebar:right',
      component: 'InspectorPanel',
      priority: 100,
    },
  ],
};
```

### Step 3: Create the Component

```typescript
// src/plugins/property-inspector/components/InspectorPanel.tsx
import React from 'react';
import { usePluginAPI } from '../../../core/hooks';

export function InspectorPanel() {
  const api = usePluginAPI();
  
  const selectedPath = api.getSelectedPath();
  const selectedValue = api.getSelectedValue();
  const schema = api.getSchema();
  
  if (!selectedPath) {
    return (
      <div className="p-4 text-[var(--text-secondary)]">
        Select a node to inspect
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Inspector</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Path</label>
          <div className="font-mono text-sm bg-[var(--bg-secondary)] p-2 rounded">
            {selectedPath}
          </div>
        </div>
        
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Value</label>
          <pre className="text-sm bg-[var(--bg-secondary)] p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(selectedValue, null, 2)}
          </pre>
        </div>
        
        <div>
          <label className="text-sm text-[var(--text-secondary)]">Type</label>
          <div className="text-sm">
            {typeof selectedValue}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Create the Entry Point

```typescript
// src/plugins/property-inspector/index.ts
import type { PluginDefinition, PluginContext } from '../../core/types';
import { manifest } from './manifest';
import { InspectorPanel } from './components/InspectorPanel';

export const definition: PluginDefinition = {
  activate(context: PluginContext) {
    context.log.info('Property Inspector activated');
  },
  
  deactivate() {
    // Cleanup if needed
  },
  
  components: {
    InspectorPanel,
  },
};

export { manifest };
export default { manifest, definition };
```

### Step 5: Register the Plugin

In your app initialization:

```typescript
import propertyInspector from './plugins/property-inspector';

// Register with the plugin registry
pluginRegistry.register(
  propertyInspector.manifest,
  propertyInspector.definition
);
```

---

## Working with the API

### SimpleAPI (Recommended)

For most use cases, use the SimpleAPI through the `usePluginAPI` hook:

```typescript
import { usePluginAPI } from '@/core/hooks';

function MyComponent() {
  const api = usePluginAPI();
  
  // Read document
  const doc = api.getDocument();
  const value = api.getValueAtPath('user.name');
  
  // Modify document
  api.setValueAtPath('user.name', 'New Name');
  api.deleteAtPath('user.temp');
  api.addArrayItem('users', { name: 'New User' });
  
  // Selection
  const selected = api.getSelectedPath();
  api.setSelectedPath('user.email');
  
  // UI
  api.showNotification('Saved!', 'success');
  const isDark = api.isDarkMode();
  
  // Events
  api.emit('my-plugin:action', { data: 123 });
  api.on('document:changed', (data) => { ... });
  
  // Logging
  api.log('info', 'Something happened');
}
```

### PluginContext (Advanced)

For advanced use cases, use the full context:

```typescript
import { usePluginContext } from '@/core/hooks';

function MyComponent() {
  const ctx = usePluginContext();
  
  // Check capabilities
  if (ctx.hasCapability('document:write')) {
    ctx.actions?.setValueAtPath('path', value);
  }
  
  // Access extensions
  const renderers = ctx.extensions?.getContributions?.('tree-view.nodeRenderer');
  
  // Access services
  const validator = ctx.services?.consume<Validator>('validator');
}
```

---

## UI Integration

### Slots

Plugins render UI by registering components to slots:

```typescript
// In manifest
slots: [
  {
    slot: 'sidebar:left',    // Where to render
    component: 'MyPanel',    // Component key
    priority: 50,            // Order (higher = first)
  },
]

// In definition
components: {
  MyPanel: MyPanelComponent,
}
```

**Available Slots:**
- `header:left`, `header:center`, `header:right`
- `sidebar:left`, `sidebar:right`
- `main:view`, `main:overlay`
- `footer:left`, `footer:center`, `footer:right`
- `panel:top`, `panel:bottom`

### Styling

Use CSS variables for consistent theming:

```tsx
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  <span className="text-[var(--text-secondary)]">Secondary text</span>
  <div className="border-[var(--border-color)]">Bordered</div>
</div>
```

**Common Variables:**
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-tertiary`
- `--border-color`
- `--primary-color`, `--error-color`, `--warning-color`, `--success-color`

---

## Extension Points

### Defining an Extension Point

Allow other plugins to extend your functionality:

```typescript
// In manifest
extensionPoints: [
  {
    id: 'my-plugin.actions',
    description: 'Custom actions for my plugin',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        label: { type: 'string' },
        handler: { type: 'function' },
      },
      required: ['id', 'label', 'handler'],
    },
  },
]

// Consuming contributions
import { useExtensions } from '@/core/hooks';

const actions = useExtensions('my-plugin.actions');
actions.forEach(action => {
  console.log(action.label);
});
```

### Contributing to Extension Points

```typescript
// In manifest
extensions: [
  {
    point: 'tree-view.nodeRenderer',
    id: 'date-renderer',
    contribution: {
      nodeType: 'date',
      priority: 100,
      component: 'DateRenderer',
    },
  },
]

// In definition
components: {
  DateRenderer: DateNodeComponent,
}
```

---

## Services

### Providing a Service

```typescript
// In manifest
provides: [
  {
    id: 'my-service',
    description: 'Does something useful',
  },
]

// In activate
activate(context) {
  const service = new MyServiceImpl();
  context.services?.provide?.('my-service', service);
}
```

### Consuming a Service

```typescript
import { useService } from '@/core/hooks';

interface MyService {
  doSomething(input: string): Result;
}

function MyComponent() {
  const myService = useService<MyService>('my-service');
  
  const handleClick = () => {
    const result = myService?.doSomething('test');
  };
}
```

---

## Events

### Emitting Events

Declare events in manifest, then emit:

```typescript
// In manifest
emits: ['my-plugin:item-selected']

// In code
api.emit('my-plugin:item-selected', { itemId: 123 });
```

### Subscribing to Events

```typescript
// In component
useEffect(() => {
  const unsubscribe = api.on('document:changed', (data) => {
    console.log('Document changed:', data);
  });
  return () => unsubscribe();
}, []);

// In activate
activate(context) {
  context.events?.subscribe?.('selection:changed', (data) => {
    context.log.debug('Selection:', data);
  });
}
```

**Core Events:**
- `document:loaded`, `document:changed`, `document:saved`
- `selection:changed`
- `validation:complete`
- `plugin:activated`, `plugin:deactivated`

---

## Testing Plugins

### Using the Test Harness

```typescript
import { createPluginTestHarness } from '@/core/testing';
import { manifest, definition } from './my-plugin';

describe('My Plugin', () => {
  it('should activate correctly', async () => {
    const harness = createPluginTestHarness({
      manifest,
      definition,
    });
    
    await harness.activate();
    expect(harness.isActive()).toBe(true);
    expect(harness.getLogs('info')).toContainEqual(
      expect.objectContaining({ args: ['My plugin activated'] })
    );
  });
  
  it('should emit events', async () => {
    const harness = createPluginTestHarness({
      manifest: { ...manifest, capabilities: [...manifest.capabilities, 'events:emit'] },
      definition,
    });
    
    await harness.activate();
    // Trigger action that emits event
    
    harness.assertEventEmitted('my-plugin:action');
  });
});
```

### Testing Components

```typescript
import { renderWithPluginContext } from '@/core/testing';

describe('InspectorPanel', () => {
  it('should show selected path', () => {
    const { context, container } = renderWithPluginContext(
      <InspectorPanel />,
      {
        capabilities: ['document:read', 'selection:read'],
        selectedPath: 'user.name',
        documentData: { user: { name: 'John' } },
      }
    );
    
    expect(container.textContent).toContain('user.name');
  });
});
```

---

## Best Practices

### 1. Declare All Capabilities

Only request what you need, and declare everything you use:

```typescript
// ✅ Good
capabilities: ['document:read', 'document:write']

// ❌ Bad - using undeclared capability
capabilities: ['document:read']
// Then using api.setValueAtPath() // Won't work!
```

### 2. Use Lazy Activation

Don't activate on startup unless necessary:

```typescript
// ✅ Good - activates only when needed
activationEvents: ['onView:my-plugin']

// ❌ Bad - always activates
activationEvents: ['*']
```

### 3. Clean Up Resources

Always clean up in deactivate:

```typescript
definition: {
  activate(context) {
    this.subscription = context.events?.subscribe?.(...);
  },
  
  deactivate() {
    this.subscription?.();
    this.cleanup();
  },
}
```

### 4. Handle Missing Capabilities

Gracefully handle when capabilities aren't available:

```typescript
if (ctx.hasCapability('document:write')) {
  ctx.actions?.setValueAtPath(path, value);
} else {
  ctx.log.warn('Cannot edit - no write capability');
}
```

### 5. Namespace Everything

Prefix IDs to avoid conflicts:

```typescript
// ✅ Good
id: 'company.my-plugin'
emits: ['company.my-plugin:action']

// ❌ Bad
id: 'plugin'
emits: ['action']
```

---

## Troubleshooting

### Plugin Not Activating

1. Check `activationEvents` - is the trigger happening?
2. Verify all `dependencies` are registered and active
3. Check console for manifest validation errors

### Capabilities Not Working

1. Ensure capability is declared in manifest
2. Check for typos in capability names
3. Verify using correct API (`actions` requires `document:write`)

### Component Not Rendering

1. Check slot registration matches component key
2. Verify component is exported in `definition.components`
3. Look for React errors in console

### Events Not Received

1. Declare `events:subscribe` capability
2. Ensure emitter has `events:emit` capability
3. Check event type name matches exactly

---

## Next Steps

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Extension Points Reference](./EXTENSION_POINTS.md) - Built-in extension points
- [Services Reference](./SERVICES.md) - Available services
- [Architecture Overview](./ARCHITECTURE.md) - System design
