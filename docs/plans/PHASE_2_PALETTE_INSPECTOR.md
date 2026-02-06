# Phase 2: Component Palette + Property Inspector - Detailed Plan

## Overview

Add drag-and-drop component creation and visual property editing through two new plugins.

## Plugins to Implement

### Plugin 1: `component-palette`

**Purpose**: Sidebar panel with draggable CLADS components

**Manifest**:
```typescript
manifest: {
  id: 'component-palette',
  name: 'Component Palette',
  capabilities: [
    'document:read',
    'document:write',
    'schema:read',
    'ui:slots',
    'events:emit',
    'services:consume',
  ],
  slots: [
    { slot: 'sidebar:left', component: 'PalettePanel', priority: 100 }
  ],
  emits: [
    'palette:drag-start',
    'palette:drag-end',
    'palette:component-dropped',
  ],
  consumes: ['design-system'],
}
```

**Features**:
- Component categories (Layout, Content, Input, Media)
- Search/filter components
- Drag-to-tree insertion
- Drag-to-canvas placement (Phase 3)
- Preview thumbnails from design system
- Recently used components

**Tasks**:
- [ ] Create `component-palette` plugin scaffold
- [ ] Build component category data from CLADS schema
- [ ] Implement drag source with component data
- [ ] Create drop targets in tree view
- [ ] Add component search/filter
- [ ] Style with thumbnails and descriptions

### Plugin 2: `property-inspector`

**Purpose**: Right sidebar panel for editing selected node properties

**Manifest**:
```typescript
manifest: {
  id: 'property-inspector',
  name: 'Property Inspector',
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'ui:slots',
    'ui:theme',
    'events:subscribe',
    'extensions:provide',
    'services:consume',
  ],
  slots: [
    { slot: 'sidebar:right', component: 'InspectorPanel', priority: 100 }
  ],
  extensionPoints: [
    {
      id: 'property-inspector.editor',
      description: 'Custom property editors for specific types',
      schema: { type: 'object', properties: { ... } }
    }
  ],
  consumes: ['style-resolver'],
}
```

**Features**:
- Auto-generated form from schema
- Type-specific editors (string, number, boolean, enum, array, object)
- Style picker integration
- Constraint visualization (min, max, pattern)
- Validation feedback inline
- Collapse/expand sections
- Quick actions (copy path, reset to default)

**Extension Point**: `property-inspector.editor`

Allows other plugins to contribute custom editors:

```typescript
// Example: Color picker plugin contributes
extensions: [{
  point: 'property-inspector.editor',
  contribution: {
    propertyType: 'color',
    component: ColorPickerEditor,
    priority: 100,
  }
}]
```

**Tasks**:
- [ ] Create `property-inspector` plugin scaffold
- [ ] Build schema-driven form generator
- [ ] Implement type-specific editor components:
  - [ ] `StringEditor` (text, textarea, date, color)
  - [ ] `NumberEditor` (input, slider, stepper)
  - [ ] `BooleanEditor` (toggle, checkbox)
  - [ ] `EnumEditor` (select, radio, button group)
  - [ ] `ArrayEditor` (list with add/remove/reorder)
  - [ ] `ObjectEditor` (collapsible sections)
- [ ] Define `property-inspector.editor` extension point
- [ ] Add style picker integration
- [ ] Add validation feedback

### Service: `drag-drop-manager`

**Purpose**: Coordinate drag-drop across plugins

**Plugin**: `drag-drop-service`

```typescript
interface DragDropManager {
  startDrag(source: DragSource): void;
  endDrag(): void;
  getDragData(): DragData | null;
  isDragging(): boolean;
  
  // For drop targets
  canDrop(target: DropTarget): boolean;
  handleDrop(target: DropTarget): void;
}

interface DragSource {
  type: 'component' | 'node' | 'template';
  data: unknown;
  preview?: React.ReactNode;
}

interface DropTarget {
  path: string;
  position: 'before' | 'after' | 'inside';
}
```

**Tasks**:
- [ ] Create `drag-drop-service` plugin
- [ ] Implement `DragDropManager` service
- [ ] Add visual drag ghost/preview
- [ ] Handle drop validation against schema
- [ ] Emit events for drag lifecycle

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────┐                              ┌──────────────────┐  │
│  │  Component  │  drag-start                  │     Property     │  │
│  │   Palette   │ ─────────────┐               │    Inspector     │  │
│  │             │              │               │                  │  │
│  │ [VStack]    │              │               │ ┌──────────────┐ │  │
│  │ [HStack]    │              ▼               │ │ type: VStack │ │  │
│  │ [Text]      │       ┌─────────────┐        │ ├──────────────┤ │  │
│  │ [Button]    │       │  DragDrop   │        │ │ spacing: 8   │ │  │
│  │ [Image]     │       │   Service   │        │ │ padding: 16  │ │  │
│  │             │       └─────────────┘        │ │ background   │ │  │
│  │ [search]    │              │               │ │   ↳ [picker] │ │  │
│  └─────────────┘              │               │ └──────────────┘ │  │
│                               │               │                  │  │
│                               ▼               │  [extension pts] │  │
│                   ┌───────────────────────┐   └──────────────────┘  │
│                   │                       │                         │
│                   │      Tree View        │   selection:read        │
│                   │   (drop targets)      │ ◄────────────────────── │
│                   │                       │                         │
│                   │   VStack              │   document:write        │
│                   │    ├─ Text            │ ◄────────────────────── │
│                   │    ├─ [drop here]     │                         │
│                   │    └─ Button          │                         │
│                   │                       │                         │
│                   └───────────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## UI Mockup: Component Palette

```
┌────────────────────────────┐
│ 🎨 Components              │
├────────────────────────────┤
│ [🔍 Search components... ] │
├────────────────────────────┤
│ ▼ Layout                   │
│   ┌──────┐ ┌──────┐       │
│   │VStack│ │HStack│       │
│   └──────┘ └──────┘       │
│   ┌──────┐ ┌──────┐       │
│   │ZStack│ │Spacer│       │
│   └──────┘ └──────┘       │
├────────────────────────────┤
│ ▶ Content                  │
├────────────────────────────┤
│ ▶ Input                    │
├────────────────────────────┤
│ ▶ Media                    │
├────────────────────────────┤
│ ─────────────────────────  │
│ Recently Used              │
│   VStack  Text  Button     │
└────────────────────────────┘
```

## UI Mockup: Property Inspector

```
┌────────────────────────────┐
│ 📝 Properties              │
│ VStack                     │
├────────────────────────────┤
│ ▼ Layout                   │
│ ┌────────────────────────┐ │
│ │ Spacing                │ │
│ │ ├──○────────┤ 8        │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Padding                │ │
│ │ [16] [16] [16] [16]    │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Alignment              │ │
│ │ [⬅] [⬆] [➡]          │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│ ▼ Appearance               │
│ ┌────────────────────────┐ │
│ │ Background             │ │
│ │ [🎨 primary.surface ]  │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Corner Radius          │ │
│ │ ├──○──────┤ 4          │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│ ▶ Actions (2)              │
├────────────────────────────┤
│ [📋 Copy Path] [↩ Reset]   │
└────────────────────────────┘
```

## Dependencies

- Phase 1 complete (app shell, slots)
- Design system service (for style picker)

## Estimated Effort

| Task | Estimate |
|------|----------|
| Component palette plugin | 2 days |
| Property inspector plugin | 3 days |
| Drag-drop service | 1 day |
| Custom editors (color, style) | 1 day |
| Testing and polish | 1 day |
| **Total** | **8 days** |

## Success Criteria

- [ ] Can drag component from palette to tree
- [ ] Dropped component creates valid schema node
- [ ] Inspector shows all properties of selected node
- [ ] Property changes reflect immediately in preview
- [ ] Custom editors work for colors and styles
- [ ] Validation errors show inline in inspector
