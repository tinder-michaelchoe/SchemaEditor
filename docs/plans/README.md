# Visual Editor Development Phases

This directory contains detailed plans for each development phase, updated to leverage the **plugin architecture** implemented in the core.

## Architecture Summary

Every feature is now a plugin. The core provides:

| Core Component | Purpose |
|----------------|---------|
| `PluginRegistry` | Plugin lifecycle management |
| `ExtensionRegistry` | Plugin-to-plugin extensibility |
| `ServiceRegistry` | Shared functionality |
| `EventBus` | Cross-plugin communication |
| `ActionAPI` | Safe state mutations |
| `SlotManager` | UI composition |
| `SimpleAPI` | Simplified plugin API |

## Phase Overview

```
Phase 1: App Shell        ✅ Complete (core architecture)
    │
    ▼
Phase 2: Palette + Inspector ──────────┐
    │                                   │
    ▼                                   ▼
Phase 3: Canvas View            Phase 4: Design System
    │                                   │
    ▼                                   │
Phase 5: Debug + Actions ◄──────────────┘
    │
    ▼
Phase 6: Collaboration
```

## Phase Details

### [Phase 1: App Shell](./PHASE_1_APP_SHELL.md) ✅ Complete

**Status**: Core architecture implemented

| Deliverable | Status |
|-------------|--------|
| Plugin system | ✅ Complete |
| UI slots | ✅ Complete |
| Selection store | ✅ Complete |
| Event bus | ✅ Complete |
| Panel resize | ⏳ Remaining |
| Keyboard shortcuts | ⏳ Remaining |

**Remaining effort**: ~2 days

---

### [Phase 2: Component Palette + Property Inspector](./PHASE_2_PALETTE_INSPECTOR.md)

**Plugins to implement**:
- `component-palette` - Drag-and-drop component creation
- `property-inspector` - Visual property editing
- `drag-drop-service` - Coordination service

**Key features**:
- Component categories with search
- Drag to tree/canvas
- Schema-driven form generation
- Type-specific editors
- Style picker integration

**Estimated effort**: ~8 days

---

### [Phase 3: Visual Canvas Mode](./PHASE_3_CANVAS_VIEW.md)

**Plugin to implement**:
- `canvas-view` - True visual editing

**Key features**:
- Visual component rendering
- Click-to-select with bounding boxes
- Drag-to-reorder within stacks
- Resize handles for fixed dimensions
- Zoom/pan controls
- Split view (tree + canvas)

**Extension points**:
- `canvas-view.nodeRenderer` - Custom component rendering
- `canvas-view.overlay` - Overlay widgets

**Estimated effort**: ~10 days

---

### [Phase 4: Design System Browser + Templates](./PHASE_4_DESIGN_SYSTEM.md)

**Plugins to implement**:
- `design-system-browser` - Token browsing and application
- `template-library` - Reusable pattern library

**Services provided**:
- `style-resolver` - Resolve style IDs to definitions
- `design-system` - Token access

**Key features**:
- Color/typography/spacing token browsers
- Click to apply tokens
- Save selection as template
- Built-in pattern library

**Estimated effort**: ~10 days

---

### [Phase 5: State Debugger + Action Flow Editor](./PHASE_5_DEBUG_ACTIONS.md)

**Plugins to implement**:
- `state-debugger` - Runtime state inspection
- `action-flow-editor` - Visual action authoring

**Key features**:
- Interactive state tree
- Action execution log
- Visual flow diagram editor
- Breakpoints and simulation
- API response mocking

**Extension points**:
- `action-flow.nodeType` - Custom action types

**Estimated effort**: ~11 days

---

### [Phase 6: Collaboration Features](./PHASE_6_COLLABORATION.md)

**Plugins to implement**:
- `comments` - Component-anchored comments
- `presence` - Real-time collaborator presence
- `version-history` - Document versioning

**Backend required**: Yes (WebSocket server, database)

**Key features**:
- Comments anchored to components
- Real-time cursors
- Version history with diff
- Restore previous versions

**Estimated effort**: 
- Frontend MVP: ~9 days
- Full implementation: ~20 days

---

## Timeline Summary

| Phase | Plugins | Effort | Dependencies |
|-------|---------|--------|--------------|
| 1 | Core ✅ | 2d remaining | - |
| 2 | 3 plugins | 8d | Phase 1 |
| 3 | 1 plugin | 10d | Phase 2 |
| 4 | 2 plugins | 10d | Phase 2 |
| 5 | 2 plugins | 11d | Phase 3 |
| 6 | 3 plugins | 9-20d | Phase 5 |

**Total estimate**: ~50-60 days (not including Phase 6 backend)

## Plugin Ecosystem Map

After all phases, the plugin ecosystem will include:

```
Core Plugins (Phase 1):
├── tree-view           # Tree-based editor
├── preview             # Device preview
├── error-console       # Validation errors
└── playground          # Developer tools

Phase 2 Plugins:
├── component-palette   # Drag-and-drop
├── property-inspector  # Property editing
└── drag-drop-service   # Coordination

Phase 3 Plugins:
└── canvas-view         # Visual editor

Phase 4 Plugins:
├── design-system-browser
└── template-library

Phase 5 Plugins:
├── state-debugger
└── action-flow-editor

Phase 6 Plugins:
├── comments
├── presence
└── version-history
```

## Extension Points (All Phases)

| Extension Point | Provider | Purpose |
|-----------------|----------|---------|
| `tree-view.nodeRenderer` | tree-view | Custom tree nodes |
| `tree-view.contextMenu` | tree-view | Context menu items |
| `tree-view.toolbar` | tree-view | Toolbar buttons |
| `property-inspector.editor` | property-inspector | Custom editors |
| `canvas-view.nodeRenderer` | canvas-view | Custom canvas nodes |
| `canvas-view.overlay` | canvas-view | Canvas overlays |
| `action-flow.nodeType` | action-flow-editor | Action types |

## Services (All Phases)

| Service | Provider | Consumers |
|---------|----------|-----------|
| `drag-drop-manager` | drag-drop-service | palette, tree-view, canvas-view |
| `style-resolver` | design-system-browser | property-inspector, canvas-view |
| `design-system` | design-system-browser | palette, templates |
| `state-debugger` | state-debugger | preview, action-flow |
| `collaboration-service` | Backend | comments, presence, versions |

## Next Steps

1. Complete Phase 1 remaining work (2 days)
2. Begin Phase 2 implementation
3. Phases 3 and 4 can be done in parallel after Phase 2

## Related Documentation

- [Architecture Overview](../ARCHITECTURE.md)
- [Plugin Development Guide](../PLUGIN_DEVELOPMENT.md)
- [API Reference](../API_REFERENCE.md)
- [Extension Points Reference](../EXTENSION_POINTS.md)
- [Services Reference](../SERVICES.md)
