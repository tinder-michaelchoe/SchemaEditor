# Enhanced Drag and Drop System - Implementation Documentation

## Overview

This document describes the implementation of the enhanced drag and drop system across Phases 1-3. The system provides a comprehensive, schema-driven approach to drag-drop operations in the Schema Editor.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (App.tsx - initializes SchemaParser & DragDropRegistry)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  SchemaParser    │  │  DragDropRegistry            │   │
│  │  - Validates     │  │  - Component capabilities    │   │
│  │    relationships │  │  - Drop zone calculation     │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Drag Drop Service Plugin                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DragDropManager (Zustand Store)                    │   │
│  │  - Tracks drag state                                │   │
│  │  - Event coordination                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Visual Components:                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ DragPreview  │ │ DropZoneLine │ │ DropZoneHighlight│  │
│  └──────────────┘ └──────────────┘ └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           DropZoneOverlay                            │  │
│  │  (Orchestrates visual feedback)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Canvas Integration                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CanvasView                                          │  │
│  │  - useCanvasDropZones hook                           │  │
│  │  - Drop zone rendering                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Foundation

### Files Created/Modified

- **`src/plugins/drag-drop-service/DragDropManager.ts`** - Enhanced
- **`src/services/schemaParser.ts`** - Created
- **`src/plugins/drag-drop-service/DragDropRegistry.ts`** - Created
- **`src/plugins/drag-drop-service/DragPreview.tsx`** - Enhanced
- **`src/plugins/drag-drop-service/__tests__/phase1.test.ts`** - Created (27 tests)

### Key Features

#### 1. New Drag Source Types

```typescript
type DragSourceType =
  | 'layer-node'        // Existing layer in tree
  | 'palette-component' // New component from palette
  | 'canvas-node'       // Component on canvas
  | 'file'              // External file (images, etc.)
  | 'component'         // Legacy (backwards compat)
  | 'node'              // Legacy (backwards compat)
  | 'template';         // Legacy (backwards compat)
```

#### 2. Enhanced DragSource Interface

```typescript
interface DragSource {
  type: DragSourceType;
  data: unknown;
  preview?: React.ReactNode;
  sourcePluginId?: string;
  sourceId?: string;              // NEW: Unique identifier
  onDragEnd?: (success: boolean) => void;  // NEW: Callback
}
```

#### 3. Custom Validators

```typescript
interface DropTarget {
  path: string;
  position: 'before' | 'after' | 'inside';
  accepts?: DragSourceType[];
  validator?: (source: DragSource) => boolean;  // NEW
  priority?: number;    // NEW: For overlapping zones
}
```

### SchemaParser API

```typescript
class SchemaParser {
  // Check if component can have children
  canHaveChildren(componentType: string): boolean;

  // Validate parent-child relationship
  canAcceptChild(parentType: string, childType: string): boolean;

  // Get component metadata
  getComponentInfo(componentType: string): ComponentSchema | null;

  // Get all valid child types
  getValidChildTypes(parentType: string): string[];

  // Get all component types
  getAllComponentTypes(): string[];
}
```

### DragDropRegistry API

```typescript
class DragDropRegistry {
  // Register custom component
  registerComponent(config: ComponentDragConfig): void;

  // Check if drop is valid
  canAcceptDrop(parentType: string, childType: string): boolean;

  // Get drop zones for component
  getDropZones(
    componentType: string,
    element: HTMLElement,
    dragType: DragSourceType,
    componentData: any
  ): DropZoneVisual[];

  // Check if drag source can drop on target
  canDrop(source: DragSource, targetComponentType: string): boolean;
}
```

## Phase 2: Visual Feedback System

### Files Created

- **`src/plugins/drag-drop-service/components/DropZoneLine.tsx`** - Created
- **`src/plugins/drag-drop-service/components/DropZoneHighlight.tsx`** - Created
- **`src/plugins/drag-drop-service/components/DropZoneOverlay.tsx`** - Created
- **`src/plugins/drag-drop-service/__tests__/phase2.test.tsx`** - Created (17 tests)

### Components

#### DropZoneLine

Renders thin line indicators for insert positions.

```typescript
<DropZoneLine
  bounds={bounds}              // DOMRect position
  orientation="horizontal"     // or "vertical"
  isHovered={false}
  isActive={false}
/>
```

**Features:**
- 2-3px thickness based on state
- Circular end markers
- Blue color with hover/active states
- Smooth transitions (0.15s ease)
- Glow effect on hover

#### DropZoneHighlight

Renders highlight boxes for empty containers.

```typescript
<DropZoneHighlight
  bounds={bounds}
  isHovered={false}
  isActive={false}
  label="Drop here"  // Optional
/>
```

**Features:**
- Dashed border (2px)
- Semi-transparent background
- Optional label display
- Animated background pattern
- Smooth opacity transitions (0.2s ease)

#### DropZoneOverlay

Main orchestrator for all drop zones.

```typescript
<DropZoneOverlay
  zones={dropZones}
  visible={isDragging}
  onZoneHover={(zoneId) => {...}}
  onZoneDrop={(zoneId) => {...}}
/>
```

**Features:**
- Manages multiple zones simultaneously
- Mouse hover detection with expanded hit areas (8px for lines, 4px for highlights)
- Auto-shows when dragging
- Fixed positioning above canvas
- Z-index: 999 (below drag preview at 1000)

### Visual Design Specifications

**Color Palette:**
- Base: `rgb(59, 130, 246)` (Blue-500)
- Hover: `rgb(37, 99, 235)` (Blue-600)
- Active: `rgb(29, 78, 216)` (Blue-700)

**Line Indicators:**
- Thickness: 2px (base), 2.5px (hover), 3px (active)
- End markers: 6px circles
- Box shadow: `0 0 8px rgba(59, 130, 246, 0.5)` on hover

**Highlight Boxes:**
- Background: `rgba(59, 130, 246, 0.08-0.15)`
- Border: `2px dashed`
- Border radius: `6px`
- Box shadow: `0 0 16px rgba(59, 130, 246, 0.3)` on hover

## Phase 3: Canvas Drop Zones

### Files Created/Modified

- **`src/plugins/canvas-view/hooks/useCanvasDropZones.ts`** - Created
- **`src/plugins/canvas-view/components/CanvasView.tsx`** - Modified
- **`src/App.tsx`** - Modified (initialization)
- **`src/plugins/canvas-view/__tests__/phase3.test.ts`** - Created (20 tests)

### useCanvasDropZones Hook

Calculates drop zones dynamically based on component structure.

```typescript
const dropZones = useCanvasDropZones({
  nodeBoundsMap,      // Map<string, DOMRect>
  componentData,      // Component tree structure
  enabled: isDragging // Only calculate when dragging
});
```

### Drop Zone Rules by Container Type

#### VStack (Vertical Stack)
- **Empty:** Single highlight box
- **With children:** Horizontal lines between children
- **Line positioning:** 4px above/below child elements
- **Insert indices:** 0 to children.length

#### HStack (Horizontal Stack)
- **Empty:** Single highlight box
- **With children:** Vertical lines between children
- **Line positioning:** 4px left/right of child elements
- **Insert indices:** 0 to children.length

#### ZStack (Layered Stack)
- **Always:** Highlight box overlay
- **Behavior:** Adds new items on top (layered)
- **No lines:** Items stack on z-axis

#### ForEach
- **Empty template:** Highlight box
- **Has template:** No zones (template already set)

#### Leaf Components
- **No zones:** label, button, textfield, etc. cannot accept drops

### Integration Flow

1. **App Initialization:**
   ```typescript
   // App.tsx
   useEffect(() => {
     const parser = initSchemaParser(schema);
     initDragDropRegistry(parser);
   }, [schema]);
   ```

2. **Canvas Drop Zones:**
   ```typescript
   // CanvasView.tsx
   const dropZones = useCanvasDropZones({
     nodeBoundsMap: nodeBoundsRef.current,
     componentData: data,
     enabled: isDragging,
   });
   ```

3. **Visual Rendering:**
   ```typescript
   {isDragging && (
     <DropZoneOverlay
       zones={dropZones}
       visible={isDragging}
     />
   )}
   ```

## Testing Summary

### Phase 1: Foundation (27 tests)
- New drag source types
- onDragEnd callbacks
- Custom validators
- Self-drop prevention
- SchemaParser methods
- DragDropRegistry capabilities
- Backwards compatibility

### Phase 2: Visual Feedback (17 tests)
- DropZoneLine rendering
- DropZoneHighlight rendering
- DropZoneOverlay functionality
- Integration scenarios

### Phase 3: Canvas Integration (20 tests)
- Container validation
- Drop zone generation
- Acceptance rules
- Component type registration
- Canvas integration scenarios

**Total: 64 tests, all passing ✅**

## Usage Examples

### Basic Palette → Canvas Drop

```typescript
// 1. Start drag from palette
const handleDragStart = (componentType: string) => {
  dragDropManager.startDrag({
    type: 'palette-component',
    data: { type: componentType, name: 'New Component' },
    onDragEnd: (success) => {
      if (success) {
        console.log('Component added to canvas');
      }
    }
  }, { x: e.clientX, y: e.clientY });
};

// 2. Drop zones automatically calculated
// 3. User sees visual feedback
// 4. On drop, component inserted at correct position
```

### Custom Component Registration

```typescript
const registry = getDragDropRegistry();

registry.registerComponent({
  componentType: 'custom-grid',
  canAccept: (childType) => {
    return ['label', 'button', 'image'].includes(childType);
  },
  getDropZones: (element, dragType, componentData) => {
    // Calculate grid cell drop zones
    return cellZones;
  }
});
```

## Performance Considerations

1. **Drop Zone Calculation:**
   - Only runs when `isDragging === true`
   - Memoized with useEffect dependencies
   - Cleans up when drag ends

2. **Visual Rendering:**
   - Fixed positioning (GPU accelerated)
   - Smooth CSS transitions
   - Minimal re-renders

3. **Bounds Tracking:**
   - RefMap instead of state (no re-renders)
   - Updated only when components mount/unmount

## Next Steps (Phases 4-5)

### Phase 4: Palette Integration
- Make palette items draggable
- Generate drag previews
- Handle drop on canvas
- Auto-select inserted components

### Phase 5: Layer Panel Enhancement
- Migrate to centralized drag system
- Cross-parent movement
- Enhanced visual feedback

## API Reference

See individual component files for detailed API documentation:
- `/src/services/schemaParser.ts`
- `/src/plugins/drag-drop-service/DragDropRegistry.ts`
- `/src/plugins/drag-drop-service/DragDropManager.ts`
- `/src/plugins/canvas-view/hooks/useCanvasDropZones.ts`
