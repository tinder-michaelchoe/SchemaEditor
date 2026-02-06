# Phase 3: Visual Canvas Mode - Detailed Plan

## Overview

Create a true visual editing experience where users can directly manipulate UI components on a canvas, similar to design tools like Figma.

## Plugin: `canvas-view`

**Manifest**:
```typescript
manifest: {
  id: 'canvas-view',
  name: 'Canvas View',
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'selection:write',
    'ui:slots',
    'events:emit',
    'events:subscribe',
    'extensions:provide',
    'services:consume',
  ],
  slots: [
    { slot: 'main:view', component: 'CanvasView', priority: 80 }
  ],
  extensionPoints: [
    {
      id: 'canvas-view.nodeRenderer',
      description: 'Custom canvas renderers for component types',
    },
    {
      id: 'canvas-view.overlay',
      description: 'Overlay widgets (rulers, guides, etc.)',
    }
  ],
  emits: [
    'canvas:zoom-changed',
    'canvas:pan-changed',
    'canvas:node-moved',
    'canvas:node-resized',
  ],
  consumes: ['drag-drop-manager', 'style-resolver'],
}
```

## Components

### 1. `CanvasView.tsx`

Main container with:
- Virtual canvas with zoom/pan
- Node rendering
- Selection overlay
- Drop zone handling

```typescript
function CanvasView() {
  const { data, schema } = useDocumentStore();
  const { selectedPath } = useSelectionStore();
  const { canvasZoom, canvasPan } = useUIStore();
  
  return (
    <div className="canvas-container" ref={containerRef}>
      <CanvasToolbar />
      <div 
        className="canvas-viewport"
        style={{ 
          transform: `scale(${canvasZoom}) translate(${canvasPan.x}px, ${canvasPan.y}px)` 
        }}
      >
        <CanvasNode 
          data={data} 
          schema={schema} 
          path="root" 
        />
        <SelectionOverlay selectedPath={selectedPath} />
        <DropIndicator />
      </div>
      <CanvasMinimap />
    </div>
  );
}
```

### 2. `CanvasNode.tsx`

Renders individual CLADS components as canvas nodes:

```typescript
interface CanvasNodeProps {
  data: unknown;
  schema: JSONSchema;
  path: string;
  parentLayout?: 'horizontal' | 'vertical' | 'absolute';
}

function CanvasNode({ data, schema, path, parentLayout }: CanvasNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { setSelectedPath } = useSelectionStore();
  const customRenderers = useExtensions('canvas-view.nodeRenderer');
  
  // Find custom renderer
  const type = getComponentType(data);
  const customRenderer = customRenderers.find(r => r.nodeType === type);
  
  if (customRenderer) {
    return <customRenderer.component data={data} path={path} />;
  }
  
  // Default rendering based on type
  return (
    <div
      ref={nodeRef}
      className="canvas-node"
      onClick={(e) => { e.stopPropagation(); setSelectedPath(path); }}
      data-path={path}
    >
      {/* Render based on component type */}
      {renderComponentByType(data, schema, path)}
    </div>
  );
}
```

### 3. `SelectionOverlay.tsx`

Shows selection rectangle and resize handles:

```typescript
function SelectionOverlay({ selectedPath }: { selectedPath: string | null }) {
  if (!selectedPath) return null;
  
  const bounds = useNodeBounds(selectedPath);
  
  return (
    <div 
      className="selection-overlay"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    >
      {/* Selection border */}
      <div className="selection-border" />
      
      {/* Resize handles (if applicable) */}
      {bounds.resizable && (
        <>
          <ResizeHandle position="nw" />
          <ResizeHandle position="n" />
          <ResizeHandle position="ne" />
          <ResizeHandle position="e" />
          <ResizeHandle position="se" />
          <ResizeHandle position="s" />
          <ResizeHandle position="sw" />
          <ResizeHandle position="w" />
        </>
      )}
      
      {/* Move handle */}
      <MoveHandle bounds={bounds} />
    </div>
  );
}
```

### 4. `CanvasToolbar.tsx`

Canvas-specific controls:

```typescript
function CanvasToolbar() {
  const { canvasZoom, setCanvasZoom, canvasPan, resetCanvasPan } = useUIStore();
  
  return (
    <div className="canvas-toolbar">
      {/* View mode toggle */}
      <ViewModeToggle />
      
      {/* Zoom controls */}
      <ZoomControl value={canvasZoom} onChange={setCanvasZoom} />
      
      {/* Fit to screen */}
      <Button onClick={fitToScreen}>Fit</Button>
      
      {/* Reset pan */}
      <Button onClick={resetCanvasPan}>Center</Button>
      
      {/* Grid toggle */}
      <GridToggle />
      
      {/* Snap to grid */}
      <SnapToggle />
    </div>
  );
}
```

### 5. `DragGhost.tsx`

Visual feedback during drag operations:

```typescript
function DragGhost() {
  const { isDragging, dragData, position } = useDragDropManager();
  
  if (!isDragging || !dragData) return null;
  
  return (
    <div
      className="drag-ghost"
      style={{
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
      }}
    >
      {dragData.preview || <DefaultDragPreview type={dragData.type} />}
    </div>
  );
}
```

## Interactions

### Click to Select
```typescript
// In CanvasNode
onClick={(e) => {
  e.stopPropagation();
  setSelectedPath(path);
  api.emit('canvas:node-selected', { path });
}}
```

### Drag to Move
```typescript
// Enable for items in stacks
const handleDragStart = (e: DragEvent) => {
  dragDropManager.startDrag({
    type: 'node',
    data: { path, parentPath: getParentPath(path) },
    preview: <NodePreview data={data} />,
  });
};

const handleDrop = (targetPath: string, position: 'before' | 'after') => {
  // Move node within or between parents
  api.moveNode(path, targetPath, position);
};
```

### Resize (for fixed dimensions)
```typescript
const handleResize = (direction: string, delta: { width: number; height: number }) => {
  const current = api.getValueAtPath(`${path}.frame`);
  
  api.setValueAtPath(`${path}.frame`, {
    ...current,
    width: Math.max(10, current.width + delta.width),
    height: Math.max(10, current.height + delta.height),
  });
};
```

### Zoom and Pan
```typescript
// Mouse wheel zoom
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Zoom
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCanvasZoom(Math.max(0.1, Math.min(3, canvasZoom + delta)));
  } else {
    // Pan
    setCanvasPan({
      x: canvasPan.x - e.deltaX,
      y: canvasPan.y - e.deltaY,
    });
  }
};

// Fit to content
const fitToScreen = () => {
  const contentBounds = calculateContentBounds();
  const viewportBounds = getViewportBounds();
  
  const scaleX = viewportBounds.width / contentBounds.width;
  const scaleY = viewportBounds.height / contentBounds.height;
  const scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% fit
  
  setCanvasZoom(scale);
  setCanvasPan({
    x: (viewportBounds.width - contentBounds.width * scale) / 2,
    y: (viewportBounds.height - contentBounds.height * scale) / 2,
  });
};
```

## Rendering Strategy

### Component Type Mapping

```typescript
const CANVAS_RENDERERS: Record<string, React.ComponentType<CanvasNodeProps>> = {
  // Layout
  'VStack': VStackRenderer,
  'HStack': HStackRenderer,
  'ZStack': ZStackRenderer,
  'Spacer': SpacerRenderer,
  'ScrollView': ScrollViewRenderer,
  
  // Content
  'Text': TextRenderer,
  'Image': ImageRenderer,
  'Icon': IconRenderer,
  
  // Input
  'Button': ButtonRenderer,
  'TextField': TextFieldRenderer,
  'Toggle': ToggleRenderer,
  
  // Containers
  'Card': CardRenderer,
  'List': ListRenderer,
};
```

### Stack Rendering

```typescript
function VStackRenderer({ data, path }: CanvasNodeProps) {
  const children = data.children || [];
  const spacing = data.spacing || 0;
  
  return (
    <div 
      className="canvas-vstack"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing}px`,
        padding: formatPadding(data.padding),
        background: resolveStyle(data.background),
      }}
    >
      {children.map((child, index) => (
        <CanvasNode
          key={index}
          data={child}
          schema={getChildSchema(schema)}
          path={`${path}.children.${index}`}
          parentLayout="vertical"
        />
      ))}
    </div>
  );
}
```

## Performance Optimizations

### Virtual Rendering
Only render nodes visible in viewport:

```typescript
function useVisibleNodes(allNodes: string[], viewportBounds: Bounds) {
  return useMemo(() => {
    return allNodes.filter(path => {
      const nodeBounds = getNodeBounds(path);
      return boundsIntersect(nodeBounds, viewportBounds);
    });
  }, [allNodes, viewportBounds]);
}
```

### Memoization
```typescript
const MemoizedCanvasNode = React.memo(CanvasNode, (prev, next) => {
  return (
    prev.path === next.path &&
    prev.data === next.data &&
    prev.parentLayout === next.parentLayout
  );
});
```

### Debounced Updates
```typescript
const debouncedEmit = useMemo(
  () => debounce((event, data) => api.emit(event, data), 16),
  []
);
```

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Tree] [Canvas] [Split]        │ 100%  │ [Fit] [Grid] [Snap]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌────────────────────────────────────────────┐                   │
│    │ ╔════════════════════════════════════════╗ │                   │
│    │ ║            App Header                   ║ │                   │
│    │ ╠════════════════════════════════════════╣ │                   │
│    │ ║                                        ║ │                   │
│    │ ║   ┌─────────────────────────────────┐  ║ │  ← Selection     │
│    │ ║   │ ▣  Selected VStack            ◢ │  ║ │    overlay       │
│    │ ║   │  ┌────────────────────────────┐ │  ║ │                   │
│    │ ║   │  │ Text: Welcome              │ │  ║ │  ← Child node    │
│    │ ║   │  └────────────────────────────┘ │  ║ │                   │
│    │ ║   │  ┌────────────────────────────┐ │  ║ │                   │
│    │ ║   │  │ [Button: Get Started]      │ │  ║ │                   │
│    │ ║   │  └────────────────────────────┘ │  ║ │                   │
│    │ ║   │                       ↕ resize │  ║ │                   │
│    │ ║   └─────────────────────────────────┘  ║ │                   │
│    │ ║                                        ║ │                   │
│    │ ╚════════════════════════════════════════╝ │                   │
│    └────────────────────────────────────────────┘                   │
│                                                                      │
│  ┌──────┐                                                           │
│  │ Mini │  ← Minimap                                                │
│  │ map  │                                                           │
│  └──────┘                                                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Split View Mode

Shows tree and canvas side by side with synchronized selection:

```typescript
function SplitView() {
  return (
    <div className="split-view">
      <div className="split-pane" style={{ width: '40%' }}>
        <TreeView />
      </div>
      <div className="split-divider" />
      <div className="split-pane" style={{ width: '60%' }}>
        <CanvasView />
      </div>
    </div>
  );
}
```

## Dependencies

- Phase 1 complete (app shell)
- Phase 2 complete (drag-drop service)
- Style resolver service

## Estimated Effort

| Task | Estimate |
|------|----------|
| Canvas container + viewport | 1 day |
| Node rendering system | 2 days |
| Selection overlay + handles | 1 day |
| Drag-to-move implementation | 1 day |
| Resize implementation | 1 day |
| Zoom/pan controls | 0.5 days |
| Minimap | 0.5 days |
| Split view | 0.5 days |
| Performance optimization | 1 day |
| Testing and polish | 1.5 days |
| **Total** | **10 days** |

## Success Criteria

- [ ] Canvas renders all CLADS component types
- [ ] Click to select works with proper hierarchy
- [ ] Drag to reorder within stacks
- [ ] Resize handles work for fixed-dimension components
- [ ] Zoom/pan is smooth at 60fps
- [ ] Selection syncs between tree and canvas
- [ ] Split view works correctly
- [ ] Performance is acceptable with 100+ nodes
