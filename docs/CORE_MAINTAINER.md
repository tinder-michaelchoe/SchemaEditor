# Core Maintainer Guide

This guide is for maintainers responsible for the Schema Editor's core architecture. It covers how to maintain, extend, and evolve the plugin system while preserving stability and backward compatibility.

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Core Components](#core-components)
3. [Making Changes to Core](#making-changes-to-core)
4. [API Versioning](#api-versioning)
5. [Adding New Features](#adding-new-features)
6. [Performance Considerations](#performance-considerations)
7. [Security Guidelines](#security-guidelines)
8. [Deprecation Process](#deprecation-process)
9. [Testing Requirements](#testing-requirements)
10. [Release Process](#release-process)

---

## Architecture Principles

The core follows these fundamental principles:

### 1. Minimal Core

The core should be as small as possible while providing:
- Plugin lifecycle management
- Capability-based security
- Communication mechanisms (events, services)
- UI slot management

**Rule**: If functionality can be a plugin, it should be a plugin.

### 2. Stability Over Features

The core API must be stable. Plugins depend on it, and breaking changes cause widespread issues.

**Rule**: Core changes require careful consideration of backward compatibility.

### 3. Explicit Contracts

All interactions between core and plugins are through explicit contracts:
- Manifest schemas
- TypeScript interfaces
- Event type definitions

**Rule**: Never add implicit behavior that plugins might depend on.

### 4. Fail-Safe Defaults

The core should handle failures gracefully:
- Missing capabilities return undefined, not throw
- Plugin errors are isolated via error boundaries
- Invalid contributions are logged and skipped

**Rule**: A misbehaving plugin should not crash the application.

---

## Core Components

### Component Hierarchy

```
initializeCore()
       │
       ├── DocumentStore (Zustand)
       ├── SelectionStore (Zustand)
       ├── UIStore (Zustand)
       │
       ├── EventBus
       ├── ActionAPI
       ├── ExtensionRegistry
       ├── ServiceRegistry
       │
       ├── PluginRegistry
       │       │
       │       ├── PluginContext factory
       │       └── SlotManager
       │
       └── SimpleAPI
```

### Component Responsibilities

| Component | Responsibility | Can Modify |
|-----------|---------------|------------|
| `DocumentStore` | Document data, schema, errors | ActionAPI only |
| `SelectionStore` | Selection state | Plugins via context |
| `UIStore` | UI state (theme, expansion) | Plugins via context |
| `EventBus` | Cross-plugin communication | Any plugin with capability |
| `ActionAPI` | Document mutations | Logged, validated |
| `ExtensionRegistry` | Extension point management | Plugin registration |
| `ServiceRegistry` | Service management | Plugin registration |
| `PluginRegistry` | Plugin lifecycle | Core only |
| `PluginContext` | Plugin API facade | Read-only after creation |
| `SlotManager` | UI rendering | Core only |
| `SimpleAPI` | Simplified plugin API | Wraps other components |

---

## Making Changes to Core

### Change Classification

| Type | Description | Requirements |
|------|-------------|--------------|
| **Patch** | Bug fixes, no API changes | Tests pass, no new exports |
| **Minor** | New features, backward compatible | Tests, docs, migration guide |
| **Major** | Breaking changes | RFC, deprecation period, migration |

### Process for Core Changes

1. **Assess Impact**
   - Which plugins might be affected?
   - Does this change any exported types?
   - Are there performance implications?

2. **Write Tests First**
   - Add tests for the new behavior
   - Ensure existing tests still pass
   - Add integration tests if cross-component

3. **Implement Change**
   - Follow existing patterns
   - Document with JSDoc
   - Update TypeScript types

4. **Update Documentation**
   - API Reference if signatures changed
   - Architecture doc if design changed
   - Migration guide if plugins need updates

5. **Review Checklist**
   - [ ] Tests pass
   - [ ] No new linter errors
   - [ ] Documentation updated
   - [ ] Backward compatible (or documented)
   - [ ] Performance acceptable

---

## API Versioning

### Semantic Versioning

Core follows strict semver:

- **Major (X.0.0)**: Breaking changes to plugin API
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes only

### Version Compatibility

The `PluginManifest` supports version constraints:

```typescript
interface PluginManifest {
  // Core version this plugin requires
  coreVersion?: string;  // e.g., "^2.0.0" or ">=1.5.0"
}
```

### API Surface

**Public API** (must be stable):
- `PluginManifest` interface
- `PluginDefinition` interface
- `PluginContext` interface
- `SimplePluginAPI` interface
- All React hooks (`usePluginAPI`, etc.)
- `UISlot` type
- `PluginCapability` type

**Internal API** (can change):
- Store implementations
- Registry internals
- Private methods
- Test utilities

---

## Adding New Features

### Adding a New Capability

1. Add to `PluginCapability` type:
   ```typescript
   type PluginCapability = 
     | 'existing:capability'
     | 'new:capability';  // Add here
   ```

2. Add gating in `PluginContext`:
   ```typescript
   // In createPluginContext
   newFeature: hasCapability('new:capability') ? {
     doThing: () => { ... },
   } : undefined,
   ```

3. Update documentation
4. Add tests for capability gating

### Adding a New UI Slot

1. Add to `UISlot` type:
   ```typescript
   type UISlot =
     | 'existing:slot'
     | 'new:slot';  // Add here
   ```

2. Add rendering in `SlotManager`:
   ```tsx
   {renderSlot('new:slot', registrations)}
   ```

3. Document the slot's purpose and constraints
4. Consider which plugins might use it

### Adding a Core Event

1. Add to `CoreEvent` type:
   ```typescript
   interface CoreEvents {
     'existing:event': { ... };
     'new:event': NewEventPayload;  // Add here
   }
   ```

2. Emit at appropriate places in core
3. Document when it's emitted and payload shape
4. Add tests for event emission

---

## Performance Considerations

### Plugin Loading

- Plugins should be lazy-loaded when possible
- Use activation events to defer loading
- Large plugins should code-split

### Rendering

- `SlotManager` uses React.memo where appropriate
- Error boundaries prevent cascading renders
- Plugins render in separate React subtrees

### State Updates

- Stores use Zustand's shallow comparison
- Batch related updates together
- Avoid unnecessary re-renders via selectors

### Memory

- Clean up subscriptions in `deactivate`
- Don't hold references to deactivated plugins
- Monitor for memory leaks in long sessions

### Monitoring

Add performance tracking:

```typescript
const startTime = performance.now();
// ... operation
const duration = performance.now() - startTime;
if (duration > THRESHOLD) {
  console.warn(`Slow operation: ${duration}ms`);
}
```

---

## Security Guidelines

### Capability Enforcement

All capability checks must happen in the core:

```typescript
// ✅ Good - core enforces
document: hasCapability('document:read') ? {
  getData: () => store.getState().data,
} : undefined,

// ❌ Bad - plugin could bypass
document: {
  getData: () => {
    if (!hasCapability('document:read')) return;  // Plugin could skip
    return store.getState().data;
  },
},
```

### Input Validation

Validate all plugin inputs:

```typescript
// Manifest validation with Zod
const result = manifestSchema.safeParse(manifest);
if (!result.success) {
  throw new Error('Invalid manifest');
}

// Action validation
setValueAtPath(path: string, value: unknown) {
  if (!isValidPath(path)) {
    return false;
  }
  // ...
}
```

### Error Isolation

Use error boundaries for all plugin UI:

```tsx
<PluginErrorBoundary pluginId={plugin.id}>
  <PluginComponent />
</PluginErrorBoundary>
```

### Audit Logging

Log security-relevant actions:

```typescript
actionLog.push({
  timestamp: Date.now(),
  pluginId,
  action: 'setValueAtPath',
  path,
  // Don't log sensitive values
});
```

---

## Deprecation Process

### When to Deprecate

- API is being replaced with better alternative
- Feature is no longer needed
- Security or performance concerns

### Deprecation Timeline

1. **Announce** (version N): Add deprecation notice
2. **Warn** (version N+1): Log warnings when used
3. **Remove** (version N+2): Remove from codebase

### Deprecation Notices

```typescript
/**
 * @deprecated Use `newMethod()` instead. Will be removed in v3.0.
 */
function oldMethod() {
  console.warn('oldMethod is deprecated, use newMethod instead');
  // Still works...
}
```

### Migration Guides

Create migration guides for breaking changes:

```markdown
# Migration Guide: v2.x to v3.x

## Breaking Changes

### `oldMethod` removed
Replace with `newMethod`:

Before:
\`\`\`typescript
context.oldMethod(arg);
\`\`\`

After:
\`\`\`typescript
context.newMethod(newArg);
\`\`\`
```

---

## Testing Requirements

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `__tests__/unit/` | Individual components |
| Integration | `__tests__/integration/` | Cross-component flows |
| Plugin | `plugins/*/tests/` | Plugin-specific |

### Coverage Requirements

- Core components: >80% coverage
- Public APIs: 100% coverage
- Critical paths: 100% coverage

### Running Tests

```bash
# Run all core tests
npm run test:core

# Run with coverage
npm run test:core:coverage

# Run specific test file
npm run test:core -- PluginRegistry
```

### Test Patterns

**Component Test**:
```typescript
describe('PluginRegistry', () => {
  let registry: PluginRegistry;
  
  beforeEach(() => {
    registry = new PluginRegistry();
  });
  
  it('should register valid plugin', () => {
    const result = registry.register(validManifest, validDef);
    expect(result.success).toBe(true);
  });
});
```

**Integration Test**:
```typescript
describe('Plugin Lifecycle', () => {
  it('should flow from registration to activation', async () => {
    const { registry, eventBus } = initializeCore();
    
    registry.register(manifest, definition);
    await registry.activatePlugin(manifest.id);
    
    expect(eventBus.emitted).toContain('plugin:activated');
  });
});
```

---

## Release Process

### Pre-Release Checklist

- [ ] All tests pass
- [ ] No linter errors
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped correctly
- [ ] Migration guide (if breaking)

### Release Steps

1. **Create Release Branch**
   ```bash
   git checkout -b release/vX.Y.Z
   ```

2. **Update Version**
   ```bash
   npm version X.Y.Z
   ```

3. **Update CHANGELOG**
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD
   ### Added
   - New feature X
   ### Changed
   - Modified behavior Y
   ### Fixed
   - Bug fix Z
   ```

4. **Create PR and Review**

5. **Merge and Tag**
   ```bash
   git tag vX.Y.Z
   git push --tags
   ```

6. **Announce**
   - Release notes
   - Migration guide (if needed)
   - Notify plugin developers

---

## See Also

- [Architecture Overview](./ARCHITECTURE.md) - System design
- [API Reference](./API_REFERENCE.md) - Public APIs
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
