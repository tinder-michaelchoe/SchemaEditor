# API Reference

This document provides a comprehensive reference for the Schema Editor's plugin APIs. There are two main APIs available to plugins:

1. **SimpleAPI** ("The Twenty Things") - A simplified interface for common operations
2. **PluginContext** - The full-featured context for advanced use cases

---

## Table of Contents

1. [SimpleAPI (Recommended)](#simpleapi-recommended)
2. [PluginContext (Advanced)](#plugincontext-advanced)
3. [React Hooks](#react-hooks)
4. [Type Definitions](#type-definitions)

---

## SimpleAPI (Recommended)

The SimpleAPI provides the "twenty things" most plugins need. It's designed for simplicity, safety, and ease of use—especially for LLM-assisted development.

### Accessing SimpleAPI

```typescript
import { usePluginAPI } from '@/core/hooks';

function MyComponent() {
  const api = usePluginAPI();
  
  // Now use api.* methods
}
```

### Document Operations

#### `getDocument(): unknown`

Returns the current document data.

```typescript
const doc = api.getDocument();
console.log('Current document:', doc);
```

#### `getSchema(): JSONSchema | null`

Returns the current JSON schema.

```typescript
const schema = api.getSchema();
if (schema) {
  console.log('Schema type:', schema.type);
}
```

#### `getValueAtPath(path: string): unknown`

Gets a value at a specific JSON path.

```typescript
const name = api.getValueAtPath('user.name');
const items = api.getValueAtPath('items[0].title');
```

#### `setValueAtPath(path: string, value: unknown): boolean`

Sets a value at a specific JSON path. Returns `true` if successful.

**Requires**: `document:write` capability

```typescript
const success = api.setValueAtPath('user.name', 'John Doe');
if (!success) {
  console.error('Failed to update value');
}
```

#### `deleteAtPath(path: string): boolean`

Deletes a value at a specific JSON path. Returns `true` if successful.

**Requires**: `document:write` capability

```typescript
api.deleteAtPath('user.temporaryField');
```

#### `addArrayItem(arrayPath: string, item: unknown): boolean`

Adds an item to an array at the specified path.

**Requires**: `document:write` capability

```typescript
api.addArrayItem('items', { title: 'New Item', completed: false });
```

#### `removeArrayItem(arrayPath: string, index: number): boolean`

Removes an item from an array at the specified index.

**Requires**: `document:write` capability

```typescript
api.removeArrayItem('items', 2); // Remove third item
```

#### `getErrors(): ValidationError[]`

Returns current validation errors.

```typescript
const errors = api.getErrors();
errors.forEach(error => {
  console.log(`Error at ${error.path}: ${error.message}`);
});
```

### Selection Operations

#### `getSelectedPath(): string | null`

Returns the currently selected path, or null if nothing is selected.

```typescript
const selected = api.getSelectedPath();
if (selected) {
  console.log('User selected:', selected);
}
```

#### `setSelectedPath(path: string | null): void`

Sets the selected path programmatically.

**Requires**: `selection:write` capability

```typescript
api.setSelectedPath('user.profile.avatar');
```

#### `getSelectedValue(): unknown`

Convenience method to get the value at the selected path.

```typescript
const value = api.getSelectedValue();
```

### UI Operations

#### `showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void`

Shows a notification to the user.

**Requires**: `ui:notifications` capability

```typescript
api.showNotification('Document saved successfully', 'success');
api.showNotification('Invalid format', 'error');
api.showNotification('Processing...', 'info');
```

#### `isDarkMode(): boolean`

Returns whether dark mode is enabled.

```typescript
if (api.isDarkMode()) {
  // Use dark theme styles
}
```

### Event Operations

#### `emit(eventType: string, data?: unknown): void`

Emits an event for other plugins to receive.

**Requires**: `events:emit` capability and event declared in manifest's `emits` array

```typescript
api.emit('my-plugin:item-selected', { itemId: 123 });
```

#### `on(eventType: string, handler: (data: unknown) => void): () => void`

Subscribes to an event. Returns an unsubscribe function.

**Requires**: `events:subscribe` capability

```typescript
const unsubscribe = api.on('document:changed', (data) => {
  console.log('Document changed:', data);
});

// Later, to unsubscribe:
unsubscribe();
```

### Utility Operations

#### `log(level: 'debug' | 'info' | 'warn' | 'error', ...args: unknown[]): void`

Logs a message with plugin attribution.

```typescript
api.log('info', 'Plugin initialized successfully');
api.log('error', 'Failed to process data', error);
api.log('debug', 'Processing items:', items);
```

---

## PluginContext (Advanced)

The PluginContext provides full access to all core systems. Use this when you need functionality beyond what SimpleAPI offers.

### Accessing PluginContext

```typescript
import { usePluginContext } from '@/core/hooks';

function MyComponent() {
  const ctx = usePluginContext();
  
  // Access full context capabilities
}
```

### Context Structure

```typescript
interface PluginContext {
  // Plugin identity
  pluginId: string;
  
  // Declared capabilities
  capabilities: PluginCapability[];
  
  // Check if a capability is available
  hasCapability(cap: PluginCapability): boolean;
  
  // Document access (requires document:read)
  document?: {
    getData(): unknown;
    getSchema(): JSONSchema | null;
    getErrors(): ValidationError[];
    getValueAtPath(path: string): unknown;
  };
  
  // Selection access (requires selection:read or selection:write)
  selection?: {
    getSelectedPath(): string | null;
    getEditingPath(): string | null;
    getHoveredPath(): string | null;
    setSelectedPath?(path: string | null): void;  // requires selection:write
    setEditingPath?(path: string | null): void;   // requires selection:write
    setHoveredPath?(path: string | null): void;   // requires selection:write
  };
  
  // UI access (requires ui:* capabilities)
  ui?: {
    isDarkMode(): boolean;
    getExpandedPaths(): Set<string>;
    getViewMode(): 'tree' | 'json';
    showNotification?(message: string, type?: NotificationType): void;
  };
  
  // Event bus (requires events:* capabilities)
  events?: {
    emit?(type: string, data?: unknown): void;      // requires events:emit
    subscribe?(type: string, handler: EventHandler): () => void;  // requires events:subscribe
  };
  
  // Actions (requires document:write)
  actions?: ActionAPI;
  
  // Extensions (requires extensions:* capabilities)
  extensions?: {
    define?(point: ExtensionPointDeclaration): void;
    contribute?(point: string, contribution: unknown): void;
    getContributions?(point: string): unknown[];
  };
  
  // Services (requires services:* capabilities)
  services?: {
    provide?(id: string, implementation: unknown): void;
    consume?<T>(id: string): T | undefined;
    onAvailable?(id: string, callback: (service: unknown) => void): () => void;
  };
  
  // Logging (always available)
  log: Logger;
}
```

### Capability Checking

Always check for capabilities before using optional methods:

```typescript
function MyComponent() {
  const ctx = usePluginContext();
  
  // Safe pattern - check before use
  if (ctx.hasCapability('document:write') && ctx.actions) {
    ctx.actions.setValueAtPath('path', 'value');
  }
  
  // Or use optional chaining
  ctx.events?.emit?.('my-event', data);
}
```

### Logger Interface

```typescript
interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
```

All log messages are automatically attributed to the calling plugin.

---

## React Hooks

### `usePluginAPI()`

Returns the SimpleAPI instance for the current plugin context.

```typescript
import { usePluginAPI } from '@/core/hooks';

function MyComponent() {
  const api = usePluginAPI();
  const doc = api.getDocument();
  // ...
}
```

### `usePluginContext()`

Returns the full PluginContext instance.

```typescript
import { usePluginContext } from '@/core/hooks';

function MyComponent() {
  const ctx = usePluginContext();
  if (ctx.hasCapability('events:emit')) {
    // ...
  }
}
```

### `useExtensions(pointId: string)`

Returns contributions to an extension point.

```typescript
import { useExtensions } from '@/core/hooks';

function TreeView() {
  const nodeRenderers = useExtensions('tree-view.nodeRenderer');
  
  // nodeRenderers is an array of contributions
  const customRenderer = nodeRenderers.find(r => r.nodeType === 'custom');
}
```

### `useService<T>(serviceId: string)`

Consumes a service by ID.

```typescript
import { useService } from '@/core/hooks';

interface StyleResolver {
  resolveStyle(id: string): Style | undefined;
}

function MyComponent() {
  const styleResolver = useService<StyleResolver>('style-resolver');
  
  if (styleResolver) {
    const style = styleResolver.resolveStyle('heading');
  }
}
```

---

## Type Definitions

### JSONSchema

```typescript
interface JSONSchema {
  type?: JSONSchemaType | JSONSchemaType[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  $ref?: string;
  $defs?: Record<string, JSONSchema>;
  title?: string;
  description?: string;
  default?: unknown;
  // ... and more
}

type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
```

### ValidationError

```typescript
interface ValidationError {
  path: string;      // JSON path to the error
  message: string;   // Human-readable error message
  keyword: string;   // Validation keyword that failed
  schemaPath: string; // Path in the schema
}
```

### PluginCapability

```typescript
type PluginCapability =
  | 'document:read'
  | 'document:write'
  | 'schema:read'
  | 'selection:read'
  | 'selection:write'
  | 'ui:notifications'
  | 'ui:theme'
  | 'ui:slots'
  | 'events:emit'
  | 'events:subscribe'
  | 'extensions:provide'
  | 'extensions:contribute'
  | 'services:provide'
  | 'services:consume';
```

### UISlot

```typescript
type UISlot =
  | 'header:left'
  | 'header:center'
  | 'header:right'
  | 'sidebar:left'
  | 'sidebar:right'
  | 'main:view'
  | 'main:overlay'
  | 'footer:left'
  | 'footer:center'
  | 'footer:right'
  | 'panel:bottom'
  | 'panel:top';
```

### SlotRegistration

```typescript
interface SlotRegistration {
  slot: UISlot;          // Where to render
  component: string;     // Component key from definition.components
  priority?: number;     // Higher = rendered first (default: 0)
}
```

### ActivationEvent

```typescript
type ActivationEvent =
  | '*'                           // Always active (eager)
  | `onStartup`                   // Activate on app start
  | `onView:${string}`            // Activate when view opens
  | `onCommand:${string}`         // Activate on command
  | `onEvent:${string}`           // Activate on event
  | `onService:${string}`;        // Activate when service requested
```

---

## Best Practices

### 1. Use SimpleAPI When Possible

SimpleAPI is safer, simpler, and sufficient for 90% of use cases:

```typescript
// ✅ Good - using SimpleAPI
const api = usePluginAPI();
api.setValueAtPath('name', 'John');

// ❌ Unnecessary complexity
const ctx = usePluginContext();
ctx.actions?.setValueAtPath('name', 'John');
```

### 2. Always Declare Capabilities

Never try to use capabilities you haven't declared:

```typescript
// In manifest
{
  capabilities: ['document:read', 'document:write', 'ui:notifications']
}

// In code - only use what you declared
api.setValueAtPath(...);      // ✅ declared document:write
api.showNotification(...);    // ✅ declared ui:notifications
api.emit(...);                // ❌ didn't declare events:emit
```

### 3. Handle Missing Capabilities Gracefully

```typescript
const ctx = usePluginContext();

// Check before using
if (ctx.hasCapability('document:write')) {
  ctx.actions?.setValueAtPath(path, value);
} else {
  ctx.log.warn('Cannot edit - no write capability');
}
```

### 4. Clean Up Subscriptions

Always clean up event subscriptions:

```typescript
useEffect(() => {
  const unsubscribe = api.on('document:changed', handleChange);
  return () => unsubscribe();
}, []);
```

### 5. Use Logging for Debugging

Prefer the logging API over `console.log`:

```typescript
// ✅ Good - attributed logs
api.log('info', 'Processing complete', { count: 42 });

// ❌ Bad - no attribution
console.log('Processing complete', { count: 42 });
```

---

## Error Handling

### API Method Errors

Most SimpleAPI methods return `boolean` for success/failure:

```typescript
const success = api.setValueAtPath('invalid..path', value);
if (!success) {
  api.log('error', 'Failed to set value');
  api.showNotification('Could not update value', 'error');
}
```

### Validation Errors

Access validation errors through `getErrors()`:

```typescript
const errors = api.getErrors();
if (errors.length > 0) {
  errors.forEach(err => {
    api.log('warn', `Validation: ${err.message} at ${err.path}`);
  });
}
```

### Event Handler Errors

Wrap event handlers in try-catch:

```typescript
api.on('document:changed', (data) => {
  try {
    processChange(data);
  } catch (error) {
    api.log('error', 'Failed to process change', error);
  }
});
```

---

## See Also

- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) - How to create plugins
- [Extension Points Reference](./EXTENSION_POINTS.md) - Available extension points
- [Services Reference](./SERVICES.md) - Available services
- [Architecture Overview](./ARCHITECTURE.md) - System design
