# Services Reference

Services provide a producer/consumer pattern for sharing functionality between plugins. Unlike extension points (which collect contributions), services provide a single implementation that others consume.

---

## Table of Contents

1. [Overview](#overview)
2. [Providing Services](#providing-services)
3. [Consuming Services](#consuming-services)
4. [Built-in Services](#built-in-services)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Services enable decoupled functionality sharing:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Service Flow                              │
│                                                                  │
│  ┌──────────────┐             ┌──────────────┐                  │
│  │   Provider   │  provides   │   Service    │                  │
│  │   Plugin     │────────────►│   Registry   │                  │
│  └──────────────┘             └───────┬──────┘                  │
│                                       │                          │
│                                       │ consumes                 │
│                                       ▼                          │
│  ┌──────────────┐             ┌──────────────┐                  │
│  │   Consumer   │◄────────────│  Service     │                  │
│  │   Plugin     │             │  Instance    │                  │
│  └──────────────┘             └──────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**

- **Single Provider**: Each service ID has one provider (last registration wins)
- **Multiple Consumers**: Any plugin can consume a service
- **Late Binding**: Consumers can wait for services to become available
- **Decoupled**: Provider and consumer don't need to know each other

---

## Providing Services

### Manifest Declaration

Declare services you provide in your manifest:

```typescript
const manifest: PluginManifest = {
  id: 'style-plugin',
  version: '1.0.0',
  name: 'Style Plugin',
  description: 'Provides style resolution',
  capabilities: [
    'services:provide'  // Required capability
  ],
  activationEvents: ['onStartup'],
  
  // Services this plugin provides
  provides: [
    {
      id: 'style-resolver',
      description: 'Resolves style IDs to style definitions'
    }
  ]
};
```

### Implementing the Service

Provide the implementation in your plugin definition:

```typescript
// Define the service interface (for type safety)
interface StyleResolver {
  resolveStyle(id: string): Style | undefined;
  getAllStyles(): Style[];
  registerStyle(style: Style): void;
}

// Implement the service
class StyleResolverImpl implements StyleResolver {
  private styles = new Map<string, Style>();
  
  resolveStyle(id: string): Style | undefined {
    return this.styles.get(id);
  }
  
  getAllStyles(): Style[] {
    return Array.from(this.styles.values());
  }
  
  registerStyle(style: Style): void {
    this.styles.set(style.id, style);
  }
}

// Plugin definition
const definition: PluginDefinition = {
  activate(context) {
    // Register the service implementation
    context.services?.provide?.('style-resolver', new StyleResolverImpl());
  },
  
  deactivate() {
    // Cleanup if needed
  }
};
```

### Programmatic Registration

Services can also be registered after activation:

```typescript
function activate(context: PluginContext) {
  // Initialize service
  const service = createMyService();
  
  // Register when ready
  context.services?.provide?.('my-service', service);
}
```

---

## Consuming Services

### Using the React Hook

The `useService` hook is the easiest way to consume services:

```typescript
import { useService } from '@/core/hooks';

interface StyleResolver {
  resolveStyle(id: string): Style | undefined;
}

function MyComponent() {
  const styleResolver = useService<StyleResolver>('style-resolver');
  
  if (!styleResolver) {
    return <div>Loading style service...</div>;
  }
  
  const style = styleResolver.resolveStyle('heading');
  return <div style={style}>Content</div>;
}
```

### Using PluginContext

For non-React code, use the context directly:

```typescript
function activate(context: PluginContext) {
  // Immediate consumption (might be undefined)
  const service = context.services?.consume<StyleResolver>('style-resolver');
  
  if (service) {
    useService(service);
  }
}
```

### Waiting for Services

Use `onAvailable` for late-binding scenarios:

```typescript
function activate(context: PluginContext) {
  // Wait for service to become available
  const unsubscribe = context.services?.onAvailable?.(
    'style-resolver',
    (service: StyleResolver) => {
      console.log('Style resolver now available');
      initializeWithService(service);
    }
  );
  
  // Store unsubscribe for cleanup
  return () => unsubscribe?.();
}
```

### Manifest Declaration

Declare services you consume for documentation:

```typescript
const manifest: PluginManifest = {
  id: 'my-plugin',
  // ...
  capabilities: [
    'services:consume'  // Required capability
  ],
  
  // Document what services you need
  consumes: ['style-resolver', 'validation-service']
};
```

---

## Built-in Services

These services are provided by core plugins:

### `document-validator`

Validates document data against the schema.

```typescript
interface DocumentValidator {
  validate(data: unknown, schema: JSONSchema): ValidationResult;
  validateAtPath(data: unknown, path: string, schema: JSONSchema): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Usage
const validator = useService<DocumentValidator>('document-validator');
const result = validator.validate(myData, mySchema);
if (!result.valid) {
  result.errors.forEach(err => console.log(err.message));
}
```

### `style-resolver`

Resolves style IDs to style definitions.

```typescript
interface StyleResolver {
  resolveStyle(id: string): Style | undefined;
  getAllStyles(): Style[];
}

interface Style {
  id: string;
  name: string;
  properties: Record<string, unknown>;
}

// Usage
const resolver = useService<StyleResolver>('style-resolver');
const headingStyle = resolver?.resolveStyle('heading');
```

### `schema-resolver`

Resolves `$ref` references in schemas.

```typescript
interface SchemaResolver {
  resolve(ref: string): JSONSchema | undefined;
  resolveAll(schema: JSONSchema): ResolvedSchema;
}

// Usage
const resolver = useService<SchemaResolver>('schema-resolver');
const resolved = resolver?.resolve('#/$defs/Address');
```

### `clipboard-service`

System clipboard operations.

```typescript
interface ClipboardService {
  copy(data: unknown): Promise<void>;
  paste(): Promise<unknown>;
  canPaste(): Promise<boolean>;
}

// Usage
const clipboard = useService<ClipboardService>('clipboard-service');
await clipboard?.copy({ name: 'John' });
const data = await clipboard?.paste();
```

### `history-service`

Undo/redo functionality.

```typescript
interface HistoryService {
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}

// Usage
const history = useService<HistoryService>('history-service');
if (history?.canUndo()) {
  history.undo();
}
```

### `notification-service`

UI notifications.

```typescript
interface NotificationService {
  show(message: string, options?: NotificationOptions): void;
  dismiss(id: string): void;
  dismissAll(): void;
}

interface NotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;  // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Usage
const notifications = useService<NotificationService>('notification-service');
notifications?.show('Document saved', { type: 'success', duration: 3000 });
```

---

## Best Practices

### 1. Define TypeScript Interfaces

Always define interfaces for your services:

```typescript
// ✅ Good - typed interface
interface MyService {
  doSomething(input: string): Result;
  configure(options: Options): void;
}

const service = useService<MyService>('my-service');
service?.doSomething('test'); // TypeScript knows the types

// ❌ Bad - untyped
const service = useService('my-service');
service?.doSomething('test'); // No type safety
```

### 2. Handle Undefined Gracefully

Services may not be available:

```typescript
function MyComponent() {
  const service = useService<MyService>('my-service');
  
  // ✅ Good - handle missing service
  if (!service) {
    return <Fallback />;
  }
  
  // ✅ Also good - optional chaining
  const result = service?.doSomething('test');
  
  // ❌ Bad - assumes service exists
  const result = service.doSomething('test'); // Could crash
}
```

### 3. Namespace Service IDs

Use plugin ID as prefix:

```typescript
// ✅ Good
provides: [{ id: 'my-plugin.custom-service', ... }]

// ❌ Bad - could conflict
provides: [{ id: 'custom-service', ... }]
```

### 4. Document Service Contracts

Include JSDoc for consumers:

```typescript
/**
 * Service: style-resolver
 * 
 * Resolves style IDs to complete style definitions.
 * 
 * @example
 * ```typescript
 * const resolver = useService<StyleResolver>('style-resolver');
 * const style = resolver?.resolveStyle('heading');
 * ```
 */
interface StyleResolver {
  /**
   * Resolves a style ID to its definition.
   * @param id - The style ID to resolve
   * @returns The style definition, or undefined if not found
   */
  resolveStyle(id: string): Style | undefined;
}
```

### 5. Lazy Initialization

Defer heavy initialization:

```typescript
class MyServiceImpl implements MyService {
  private initialized = false;
  private cache: Map<string, Result>;
  
  private ensureInitialized() {
    if (!this.initialized) {
      this.cache = this.loadData(); // Expensive operation
      this.initialized = true;
    }
  }
  
  doSomething(input: string): Result {
    this.ensureInitialized();
    return this.cache.get(input);
  }
}
```

### 6. Use Activation Events

Activate on service request:

```typescript
const manifest: PluginManifest = {
  // ...
  activationEvents: ['onService:my-service'],
  provides: [{ id: 'my-service', ... }]
};
```

This delays plugin activation until the service is actually needed.

---

## Troubleshooting

### Service Not Found

**Symptom:** `useService` returns `undefined`

**Causes:**
1. Provider plugin not activated yet
2. Service ID misspelled
3. Provider missing `services:provide` capability

**Solutions:**
```typescript
// 1. Use onAvailable for late binding
context.services?.onAvailable?.('my-service', (svc) => {
  // Now available
});

// 2. Check service ID spelling
// 3. Check provider manifest has capability
```

### Service Available Too Late

**Symptom:** Consumer initializes before provider

**Solution:** Use activation events to control order:

```typescript
// Provider activates first
{ activationEvents: ['onStartup'] }

// Consumer activates when service available
{ activationEvents: ['onService:my-service'] }
```

Or use `onAvailable` for reactive binding.

### Multiple Providers

**Symptom:** Unexpected service implementation

**Cause:** Multiple plugins provide the same service ID

**Solution:** Only one plugin should provide each service. The last registration wins.

```typescript
// If you need multiple implementations, use extension points instead:
extensionPoints: [
  { id: 'my-plugin.handlers', ... }
]

// Then collect all contributions
const handlers = useExtensions('my-plugin.handlers');
```

### Service Not Updating

**Symptom:** Service state seems stale

**Cause:** React component not re-rendering on service changes

**Solution:** Services should use observable state or emit events:

```typescript
// Option 1: Use Zustand inside service
class MyService {
  private store = create((set) => ({ ... }));
  
  getState() {
    return this.store.getState();
  }
  
  subscribe(listener: () => void) {
    return this.store.subscribe(listener);
  }
}

// Option 2: Emit events on changes
class MyService {
  constructor(private eventBus: EventBus) {}
  
  update(data: Data) {
    this.data = data;
    this.eventBus.emit('my-service:updated', data);
  }
}
```

---

## See Also

- [Extension Points Reference](./EXTENSION_POINTS.md) - Collection-based extensibility
- [API Reference](./API_REFERENCE.md) - Full API documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design
