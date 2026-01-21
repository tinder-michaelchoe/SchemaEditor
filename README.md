# Schema Editor

A plugin-based JSON schema visual editor built with React, TypeScript, and Vite. The Schema Editor provides an extensible, LLM-safe architecture for creating, editing, and managing complex JSON schemas through an intuitive visual interface.

## Features

- **Plugin-Based Architecture**: Everything is a plugin, enabling modular development and extensibility
- **Visual Editing**: Multiple editing modes including tree view, canvas view, and component palette
- **Real-Time Validation**: Live JSON schema validation with detailed error reporting
- **Type-Safe Development**: Built with TypeScript for a robust developer experience
- **Extension Points**: Plugin-to-plugin extensibility without tight coupling
- **Service Registry**: Shared functionality through a producer/consumer pattern
- **Event Bus**: Typed, decoupled communication between plugins
- **LLM-Safety**: Designed for safe AI-assisted development with clear boundaries and validation

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

The LiteLLM token is optional and only required for AI-powered features like "Generate from Image".

## Architecture Overview

The Schema Editor follows an "everything is a plugin" philosophy with three distinct layers:

1. **Application Shell**: Visual container defining UI slots for plugin rendering
2. **Plugin Layer**: All feature implementations in isolated modules
3. **Core Layer**: Minimal, stable foundation managing plugins and shared services

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
└─────────────────────────────────────────────────────────────────┘
```

For a deep dive into the architecture, see the [Architecture Documentation](./docs/ARCHITECTURE.md).

## Plugin System

The Schema Editor's plugin system provides:

| Core Component | Purpose |
|----------------|---------|
| **PluginRegistry** | Plugin lifecycle management with lazy activation |
| **ExtensionRegistry** | Plugin-to-plugin extensibility without coupling |
| **ServiceRegistry** | Shared functionality via producer/consumer pattern |
| **EventBus** | Typed, decoupled cross-plugin communication |
| **ActionAPI** | Safe state mutations with validation and logging |
| **SlotManager** | UI composition and rendering |
| **SimpleAPI** | Simplified API for common operations |

### Creating Plugins

Create a new plugin using the CLI scaffolding tool:

```bash
# Create a sidebar plugin
npm run create-plugin my-plugin -- --template=sidebar

# Create a view plugin
npm run create-plugin custom-preview -- --template=view

# Create a service plugin
npm run create-plugin validation-service -- --template=service
```

### Current Plugins

The project includes these built-in plugins:

- **app-shell**: Application shell with UI slots
- **tree-view**: Tree-based schema editor
- **preview**: Device preview for schema visualization
- **error-console**: Validation error display
- **playground**: Developer tools and testing
- **component-palette**: Drag-and-drop component creation
- **property-inspector**: Visual property editing
- **canvas-view**: Visual canvas editing mode
- **drag-drop-service**: Drag-and-drop coordination service
- **layers-panel**: Layer management
- **output-panel**: Output and export

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all tests with Vitest |
| `npm run test:core` | Run core tests only |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run validate-plugin` | Validate a plugin manifest |
| `npm run create-plugin` | Scaffold a new plugin |
| `npm run analyze-plugin` | Analyze plugin dependencies |
| `npm run generate-docs` | Generate plugin documentation |
| `npm run generate-context` | Generate context files for LLMs |

## Tech Stack

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **State Management**: Zustand 5.0.10
- **Styling**: Tailwind CSS 4.1.18
- **Validation**: AJV 8.17.1 with JSON Schema support
- **Testing**: Vitest 4.0.17 with Testing Library
- **Icons**: Lucide React 0.562.0

## Project Structure

```
SchemaEditor/
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # Architecture overview
│   ├── PLUGIN_DEVELOPMENT.md # Plugin development guide
│   ├── API_REFERENCE.md      # API documentation
│   ├── SERVICES.md           # Service registry reference
│   ├── EXTENSION_POINTS.md   # Extension points reference
│   ├── CONTRIBUTING.md       # Contributing guidelines
│   ├── CORE_MAINTAINER.md    # Core maintainer guide
│   ├── TOOLING.md            # Development tooling
│   └── plans/                # Development phase plans
│       ├── README.md         # Phase overview
│       ├── PHASE_1_APP_SHELL.md
│       ├── PHASE_2_PALETTE_INSPECTOR.md
│       ├── PHASE_3_CANVAS_VIEW.md
│       ├── PHASE_4_DESIGN_SYSTEM.md
│       ├── PHASE_5_DEBUG_ACTIONS.md
│       └── PHASE_6_COLLABORATION.md
├── src/
│   ├── core/                 # Core layer
│   │   ├── types/           # Type definitions
│   │   ├── store/           # Zustand stores
│   │   ├── hooks/           # React hooks
│   │   ├── PluginRegistry.ts
│   │   ├── ExtensionRegistry.ts
│   │   ├── ServiceRegistry.ts
│   │   ├── EventBus.ts
│   │   ├── ActionAPI.ts
│   │   └── SlotManager.tsx
│   ├── plugins/             # Plugin implementations
│   │   ├── tree-view/
│   │   ├── preview/
│   │   ├── canvas-view/
│   │   └── ...
│   └── ...
├── scripts/                  # Development scripts
│   ├── create-plugin.ts     # Plugin scaffolding
│   ├── validate-plugin.ts   # Plugin validation
│   ├── analyze-plugin.ts    # Dependency analysis
│   └── generate-plugin-docs.ts
└── public/                   # Static assets
```

## Documentation

### Core Documentation

- **[Architecture Overview](./docs/ARCHITECTURE.md)** - Comprehensive guide to the system architecture, design philosophy, and component relationships
- **[Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT.md)** - Step-by-step guide for creating and publishing plugins
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation for plugin developers
- **[Extension Points Reference](./docs/EXTENSION_POINTS.md)** - Available extension points and how to use them
- **[Services Reference](./docs/SERVICES.md)** - Service registry and available services
- **[Contributing Guidelines](./docs/CONTRIBUTING.md)** - How to contribute to the project
- **[Core Maintainer Guide](./docs/CORE_MAINTAINER.md)** - Guidelines for core maintainers
- **[Tooling Documentation](./docs/TOOLING.md)** - Development tools and utilities

### Development Plans

The project follows a phased development approach:

- **[Development Phases Overview](./docs/plans/README.md)** - High-level roadmap and phase summary
- **[Phase 1: App Shell](./docs/plans/PHASE_1_APP_SHELL.md)** ✅ Complete - Core architecture and plugin system
- **[Phase 2: Palette + Inspector](./docs/plans/PHASE_2_PALETTE_INSPECTOR.md)** - Component palette and property inspector
- **[Phase 3: Canvas View](./docs/plans/PHASE_3_CANVAS_VIEW.md)** - Visual canvas editing mode
- **[Phase 4: Design System](./docs/plans/PHASE_4_DESIGN_SYSTEM.md)** - Design system browser and templates
- **[Phase 5: Debug + Actions](./docs/plans/PHASE_5_DEBUG_ACTIONS.md)** - State debugger and action flow editor
- **[Phase 6: Collaboration](./docs/plans/PHASE_6_COLLABORATION.md)** - Real-time collaboration features

## Development Roadmap

### Completed (Phase 1)
- ✅ Plugin system with capability-based security
- ✅ UI slots and rendering system
- ✅ Event bus for cross-plugin communication
- ✅ Selection and document stores
- ✅ Core plugins (tree-view, preview, error-console)

### In Progress (Phase 2)
- ⏳ Component palette with drag-and-drop
- ⏳ Property inspector with schema-driven forms
- ⏳ Drag-drop coordination service

### Planned
- Phase 3: Visual canvas editing mode
- Phase 4: Design system browser and templates
- Phase 5: State debugger and action flow editor
- Phase 6: Collaboration features (comments, presence, version history)

For detailed timelines and estimates, see the [Development Plans](./docs/plans/README.md).

## Key Features & Capabilities

### Capability-Based Security

Plugins must explicitly declare the capabilities they need:

- `document:read` / `document:write` - Document access
- `schema:read` - Schema definition access
- `selection:read` / `selection:write` - Selection management
- `ui:notifications` / `ui:slots` - UI interaction
- `events:emit` / `events:subscribe` - Event system
- `extensions:provide` / `extensions:contribute` - Extension points
- `services:provide` / `services:consume` - Service registry

### Extension Points

Plugin-to-plugin extensibility without coupling:

- `tree-view.nodeRenderer` - Custom tree node renderers
- `tree-view.contextMenu` - Context menu contributions
- `tree-view.toolbar` - Toolbar button contributions
- `property-inspector.editor` - Custom property editors
- `canvas-view.nodeRenderer` - Custom canvas renderers
- `canvas-view.overlay` - Canvas overlay widgets

### Services

Shared functionality through the service registry:

- `drag-drop-manager` - Drag-and-drop coordination
- `style-resolver` - Style ID resolution
- `design-system` - Design token access
- `state-debugger` - Runtime state inspection

## LLM-Safety Features

The Schema Editor was designed for safe AI-assisted development:

- **Clear Boundaries**: Well-defined interfaces and type definitions
- **Declarative Configuration**: Manifests validated before runtime
- **Capability System**: Prevents unintended side effects
- **Tooling Support**: CLI validators and context generators
- **Fail-Safe Defaults**: Plugins are sandboxed by default
- **Error Isolation**: Plugin crashes don't affect the core or other plugins

Use the context generator to create comprehensive documentation for LLM tools:

```bash
npm run generate-context
```

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](./docs/CONTRIBUTING.md) for details on:

- Code style and conventions
- Plugin development workflow
- Testing requirements
- Pull request process
- Code review guidelines

### Quick Contributing Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Validate your plugin if applicable (`npm run validate-plugin`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is available under the MIT License. See the LICENSE file for details.

## Acknowledgments

Built with:
- React and the React ecosystem
- Vite for blazing-fast development
- Zustand for simple, scalable state management
- AJV for robust JSON schema validation
- Tailwind CSS for utility-first styling

---

For questions, issues, or feature requests, please open an issue on GitHub.

**Project Status**: Active Development | Phase 1 Complete

For detailed documentation, see the [docs](./docs/) directory.
