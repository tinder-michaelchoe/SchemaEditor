# Phase 1: App Shell Refactor - Detailed Plan

## Status: ✅ Mostly Complete

The core plugin architecture we implemented covers most of Phase 1 requirements:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Flexible panel layout | ✅ Complete | `SlotManager` with UI slots |
| View mode switching | ✅ Complete | `UIStore.viewMode` |
| Selection system | ✅ Complete | `SelectionStore` |
| Panel resize | ⏳ Pending | Need `usePanelResize` hook |
| Keyboard navigation | ⏳ Pending | Need keyboard shortcut system |

## Remaining Work

### 1. Panel Resize System

**Plugin**: `panel-resize` (or core utility)

```typescript
// src/core/hooks/usePanelResize.ts
interface PanelConfig {
  id: string;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

function usePanelResize(config: PanelConfig) {
  // Returns drag handlers and current width
  // Persists to UIStore
}
```

**Tasks**:
- [ ] Create `usePanelResize` hook
- [ ] Add panel width state to `UIStore`
- [ ] Create resize handle component
- [ ] Persist panel sizes to localStorage

### 2. Keyboard Shortcut System

**Extension Point**: `core.keyboardShortcuts`

```typescript
// Manifest contribution
extensions: [{
  point: 'core.keyboardShortcuts',
  contribution: {
    id: 'select-all',
    key: 'mod+a',
    action: 'selection:select-all',
    when: 'focus:editor',
  }
}]
```

**Tasks**:
- [ ] Define `core.keyboardShortcuts` extension point
- [ ] Create keyboard event listener service
- [ ] Support context-aware shortcuts (`when` conditions)
- [ ] Add shortcut panel for discoverability

### 3. App Layout Plugin

**Plugin**: `app-layout`

Wraps the slot manager with proper layout structure:

```typescript
manifest: {
  id: 'app-layout',
  slots: [
    { slot: 'root', component: 'AppLayout' }
  ]
}
```

**Tasks**:
- [ ] Create responsive layout with CSS Grid
- [ ] Handle panel collapse/expand animations
- [ ] Add panel toggle buttons to header
- [ ] Support touch gestures for mobile

## Architecture Diagram (Updated)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        app-layout Plugin                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      header:center                             │  │
│  │  [logo] [view-toggle] [title]         [shortcuts] [settings]  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌─────────┬─────────────────────────────────┬─────────┬─────────┐  │
│  │ sidebar │                                 │ sidebar │ preview │  │
│  │  :left  │          main:view              │ :right  │  panel  │  │
│  │         │                                 │         │         │  │
│  │ [tree]  │  [tree-view / canvas-view]      │[inspect]│[device] │  │
│  │ [palette│                                 │[debug]  │         │  │
│  │         │                                 │         │         │  │
│  ├─────────┴─────────────────────────────────┴─────────┴─────────┤  │
│  │                       panel:bottom                             │  │
│  │              [error-console] [playground]                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Estimated Effort

| Task | Estimate |
|------|----------|
| Panel resize system | 0.5 days |
| Keyboard shortcuts | 1 day |
| App layout plugin | 0.5 days |
| **Total** | **2 days** |

## Next Step

Once Phase 1 is complete, proceed to **Phase 2: Component Palette + Property Inspector**.
