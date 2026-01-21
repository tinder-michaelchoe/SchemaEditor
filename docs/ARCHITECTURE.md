# Architecture Overview

This document provides a comprehensive overview of the Schema Editor's plugin-based architecture. It serves as a guide for understanding how the system is structured, why certain design decisions were made, and how all the pieces fit together.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [High-Level Architecture](#high-level-architecture)
3. [Core Components](#core-components)
4. [Plugin System](#plugin-system)
5. [Data Flow](#data-flow)
6. [Security Model](#security-model)
7. [LLM-Safety Design](#llm-safety-design)

---

## Design Philosophy

### Everything is a Plugin

The Schema Editor follows a **"everything is a plugin"** philosophy. This means that beyond a minimal, stable core, all features are implemented as modular plugins. This design provides several benefits:

1. **Isolation**: Plugins cannot directly affect each other or the core, making the system more robust
2. **Extensibility**: New features can be added without modifying existing code
3. **LLM-Safety**: AI assistants can develop new functionality without risk of breaking core systems
4. **Maintainability**: Each feature has a clear boundary and can be maintained independently
5. **Testability**: Features can be tested in isolation with mock contexts

### Capability-Based Security

Rather than giving plugins unrestricted access to the system, each plugin must declare the capabilities it needs in its manifest. The core system enforces these declarations at runtime, ensuring plugins can only access what they've explicitly requested.

### Declarative Configuration

Plugins are configured declaratively through manifests. This approach:
- Makes plugin behavior predictable and auditable
- Enables static analysis of plugin configurations
- Allows tooling to validate plugins before runtime
- Provides clear documentation of what each plugin does

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Shell                        │
│  ┌─────────────┬─────────────────────────┬─────────────────┐   │
│  │  Header     │       Main View         │    Sidebar      │   │
│  │  (Slots)    │       (Slots)           │    (Slots)      │   │
│  └─────────────┴─────────────────────────┴─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Plugin Layer                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ TreeView │ │ Preview  │ │ Errors   │ │ Export   │  ...     │
│  │ Plugin   │ │ Plugin   │ │ Plugin   │ │ Plugin   │          │
│  └──────────┴─┴──────────┴─┴──────────┴─┴──────────┴──────────┤
├─────────────────────────────────────────────────────────────────┤
│                         Core Layer                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Plugin Registry  │  Event Bus  │  Action API            │   │
│  ├───────────────────┼─────────────┼────────────────────────┤   │
│  │  Extension Reg.   │ Service Reg.│  Slot Manager          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Document Store   │ Selection Store │  UI Store          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

The architecture consists of three layers:

1. **Application Shell**: The visual container that defines UI slots where plugins render their components
2. **Plugin Layer**: All feature implementations, each in its own isolated module
3. **Core Layer**: The minimal, stable foundation that manages plugins and provides shared services

---

## Core Components

### Plugin Registry

The **Plugin Registry** is responsible for the lifecycle management of all plugins:

- **Registration**: Validates plugin manifests and registers plugins
- **Dependency Resolution**: Ensures plugins are activated in correct order based on dependencies
- **Lazy Activation**: Defers plugin activation until trigger events occur
- **Lifecycle Management**: Handles activation, deactivation, and cleanup

```typescript
// Plugin registration flow
PluginRegistry.register(manifest, definition)
  → Validate manifest (Zod schema)
  → Check version compatibility
  → Store plugin definition
  → If eager activation → activate immediately
  → Else → wait for activation event
```

### Extension Registry

The **Extension Registry** enables plugin-to-plugin extensibility without direct coupling:

- Plugins can **define extension points** that other plugins can contribute to
- Plugins can **contribute extensions** to points defined by other plugins
- All contributions are validated against the extension point's schema

Example: The TreeView plugin defines a `tree-view.nodeRenderer` extension point. A custom plugin can contribute a renderer for a specific node type without modifying TreeView.

### Service Registry

The **Service Registry** implements a producer/consumer pattern for shared functionality:

- Plugins can **provide services** that other plugins consume
- Services can be resolved by ID, with optional fallback to default implementations
- The registry supports **availability notifications** for late-binding scenarios

### Event Bus

The **Event Bus** provides typed, decoupled communication between plugins:

- Plugins can **emit events** (must declare in manifest)
- Other plugins can **subscribe** to events
- **Strict mode** validates that plugins only emit events they've declared
- Events are automatically scoped to prevent cross-plugin pollution

### Action API

The **Action API** is the safe mutation layer for the document state:

- All state changes go through actions
- Actions are **validated** before execution
- Actions are **logged** with plugin attribution
- Provides **undo/redo** support (planned)

### Slot Manager

The **Slot Manager** handles rendering plugins into the UI:

- Defines **UI slots** (e.g., `sidebar:left`, `main:view`, `header:left`)
- Manages **priority** for slot rendering order
- Provides **error boundaries** to isolate plugin failures

### Plugin Context

The **Plugin Context** is a hierarchical, capability-gated object provided to each plugin:

- Access to core services is **gated by declared capabilities**
- Provides a **consistent API** for plugins to interact with the system
- **Hierarchical structure** allows for scoped context inheritance

---

## Plugin System

### Plugin Manifest

Every plugin must provide a manifest that declares:

```typescript
interface PluginManifest {
  id: string;              // Unique identifier (e.g., 'tree-view')
  version: string;         // Semver version
  name: string;            // Human-readable name
  description: string;     // What the plugin does
  
  // Capabilities this plugin needs
  capabilities: PluginCapability[];
  
  // When to activate (lazy loading)
  activationEvents: ActivationEvent[];
  
  // UI slots this plugin renders to
  slots?: SlotRegistration[];
  
  // Extension points this plugin defines
  extensionPoints?: ExtensionPointDeclaration[];
  
  // Extensions this plugin contributes
  extensions?: ExtensionContribution[];
  
  // Services this plugin provides
  provides?: ServiceDeclaration[];
  
  // Services this plugin consumes
  consumes?: string[];
  
  // Events this plugin emits
  emits?: string[];
  
  // Plugin dependencies
  dependencies?: PluginDependency[];
}
```

### Plugin Definition

The definition contains the runtime implementation:

```typescript
interface PluginDefinition {
  // Called when plugin activates
  activate(context: PluginContext): void | Promise<void>;
  
  // Called when plugin deactivates
  deactivate?(): void | Promise<void>;
  
  // React components for slots
  components?: Record<string, React.ComponentType>;
  
  // Extension implementations
  extensionImplementations?: Record<string, unknown>;
  
  // Service implementations
  serviceImplementations?: Record<string, unknown>;
}
```

### Activation Events

Plugins support lazy activation through various triggers:

| Event Type | Description | Example |
|------------|-------------|---------|
| `onStartup` | Activate when app starts | Core plugins |
| `onView` | Activate when view becomes visible | `onView:preview` |
| `onCommand` | Activate when command is invoked | `onCommand:export` |
| `onEvent` | Activate when event fires | `onEvent:document:loaded` |
| `onService` | Activate when service is requested | `onService:style-resolver` |

### Capabilities

Plugins must declare the capabilities they need:

| Capability | Description |
|------------|-------------|
| `document:read` | Read document content |
| `document:write` | Modify document content |
| `schema:read` | Read schema definition |
| `selection:read` | Read current selection |
| `selection:write` | Modify selection |
| `ui:notifications` | Show notifications |
| `ui:slots` | Render to UI slots |
| `events:emit` | Emit events |
| `events:subscribe` | Subscribe to events |
| `extensions:provide` | Define extension points |
| `extensions:contribute` | Contribute to extension points |
| `services:provide` | Provide services |
| `services:consume` | Consume services |

---

## Data Flow

### Document Editing Flow

```
User Action (click, type, etc.)
       │
       ▼
┌─────────────────┐
│  Plugin UI      │  (e.g., TreeView component)
│  Component      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SimpleAPI /    │  api.setValueAtPath(path, value)
│  Action API     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Document       │  State is validated and updated
│  Store          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Event Bus      │  Emits 'document:changed' event
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Subscribers    │  Preview, validators, etc.
│  (Plugins)      │
└─────────────────┘
```

### Extension Point Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Defining Plugin (e.g., TreeView)                           │
│                                                             │
│  manifest: {                                                │
│    extensionPoints: [{                                      │
│      id: 'tree-view.nodeRenderer',                         │
│      schema: { type: 'object', ... }                       │
│    }]                                                       │
│  }                                                          │
│                                                             │
│  // Uses extensions:                                        │
│  const renderers = useExtensions('tree-view.nodeRenderer'); │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Contributes to
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Contributing Plugin (e.g., CustomNodes)                    │
│                                                             │
│  manifest: {                                                │
│    extensions: [{                                           │
│      point: 'tree-view.nodeRenderer',                      │
│      contribution: {                                        │
│        nodeType: 'custom-type',                            │
│        component: CustomNodeRenderer                        │
│      }                                                      │
│    }]                                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Capability Enforcement

The core enforces capabilities at multiple levels:

1. **Manifest Validation**: Invalid capability requests are rejected at registration
2. **Context Gating**: Plugin context only exposes APIs for declared capabilities
3. **Runtime Checks**: Actions validate the calling plugin has required permissions

### Error Boundaries

Each plugin renders within an error boundary:

- Plugin crashes don't take down the entire application
- Error boundaries show a fallback UI for failed plugins
- Errors are logged with plugin attribution for debugging

### Immutability

- Document state is treated as immutable
- All updates produce new state objects
- Plugins receive snapshots, not direct references

---

## LLM-Safety Design

The architecture was designed with AI-assisted development in mind:

### Clear Boundaries

- Well-defined interfaces make it easy for LLMs to understand what's allowed
- Type definitions provide strong contracts
- Capability system prevents unintended side effects

### Declarative Configuration

- Manifests can be validated statically
- Configuration errors are caught before runtime
- LLMs can generate manifests from natural language descriptions

### Tooling Support

- **Plugin Validator**: CLI tool for validating plugins (`npm run validate-plugin`)
- **Context Generator**: Generates comprehensive context files for LLMs
- **.cursorrules**: Embedded guidelines for AI assistants

### Fail-Safe Defaults

- Plugins are sandboxed by default
- Missing capabilities result in no-ops, not crashes
- The core provides safe defaults for all operations

---

## Component Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                        initializeCore()                           │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  Document   │    │  Selection  │    │    UI       │          │
│  │   Store     │    │   Store     │    │   Store     │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Event     │◄───│   Action    │    │  Extension  │          │
│  │    Bus      │    │    API      │    │  Registry   │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
│                            ▼                                      │
│                    ┌─────────────┐                                │
│                    │   Plugin    │                                │
│                    │  Registry   │                                │
│                    └──────┬──────┘                                │
│                           │                                       │
│                           ▼                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Plugin    │    │   Plugin    │    │   Slot      │          │
│  │  Context    │    │  Validator  │    │  Manager    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── core/                     # Core layer
│   ├── types/               # Type definitions
│   │   ├── plugin.ts        # Plugin-related types
│   │   ├── events.ts        # Event types
│   │   ├── extensions.ts    # Extension point types
│   │   ├── services.ts      # Service types
│   │   └── slots.ts         # UI slot types
│   ├── store/               # Zustand stores
│   │   ├── documentStore.ts # Document state
│   │   ├── selectionStore.ts# Selection state
│   │   └── uiStore.ts       # UI state
│   ├── hooks/               # React hooks
│   │   ├── usePluginAPI.ts  # Simple API hook
│   │   ├── usePluginContext.ts
│   │   ├── useExtensions.ts
│   │   └── useService.ts
│   ├── PluginRegistry.ts    # Plugin lifecycle
│   ├── ExtensionRegistry.ts # Extension points
│   ├── ServiceRegistry.ts   # Service registry
│   ├── EventBus.ts          # Event system
│   ├── ActionAPI.ts         # Mutation layer
│   ├── SlotManager.tsx      # UI slot rendering
│   ├── PluginContext.ts     # Context factory
│   ├── SimpleAPI.ts         # Simplified API
│   └── index.ts             # Core entry point
├── plugins/                  # Plugin implementations
│   ├── tree-view/           # TreeView plugin
│   ├── preview/             # Preview plugin
│   └── ...
└── ...
```

---

## Next Steps

For developing with this architecture:

1. **Plugin Development**: See [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
2. **API Reference**: See [API Reference](./API_REFERENCE.md)
3. **Extension Points**: See [Extension Points Reference](./EXTENSION_POINTS.md)
4. **Contributing**: See [Contributing Guide](./CONTRIBUTING.md)
