# Canvas Drag & Drop Reordering - Complete Implementation

## Overview
Fully implemented drag-and-drop functionality for canvas elements, allowing users to click and hold/drag elements to reorder them on the canvas or move them between containers.

## Implementation

### 1. CanvasNode - Drag Source

**Added drag support:**
```typescript
// Enable drag for canvas nodes
const { isDragging: isNodeDragging, dragProps } = useDragSource({
  type: 'canvas-node',
  data: {
    path: pathStr,
    type: nodeType,
    componentData: node,
  },
});

// Apply to wrapper
<div
  {...(!isLocked ? dragProps : {})}
  style={{
    ...wrapperStyle,
    ...(dragProps.style || {}),
  }}
  className={`
    ${isNodeDragging ? 'opacity-50' : ''}
  `}
>
```

### 2. CanvasView - Drop Handler

**Extended `handleCanvasDrop` to support canvas-node drops:**

```typescript
// Handle canvas-node drops (reordering existing components)
else if (dragData.source.type === 'canvas-node') {
  const sourceData = dragData.source.data as {
    path: string;
    type: string;
    componentData: any;
  };

  // Extract source and target information
  const sourcePath = stringToPath(sourceData.path);
  const targetPathArray = parseTargetPath(zone.targetPath);

  // Prevent dropping on same position
  if (isSamePosition(sourcePath, targetPathArray, zone.index)) {
    return;
  }

  // Perform the move
  if (isSameArray(sourceArrayPath, targetPathArray)) {
    // Moving within same array
    moveArrayItem(sourceArrayPath, sourceIndex, zone.index);
  } else {
    // Moving between arrays
    moveItemBetweenArrays(
      sourceArrayPath,
      sourceIndex,
      targetPathArray,
      zone.index
    );
  }

  // Update selection to new position
  setSelectedPath(newPosition);
}
```

## Features

### Drag Initiation
- **Hold 150ms**: Click and hold for 150ms starts drag
- **Move 5px**: Or drag 5px immediately starts drag
- **Visual feedback**: Element becomes 50% transparent
- **Cursor**: Shows 'grab' cursor

### Drag Behavior

**Within Same Container:**
- Reorders elements in the same array
- Uses `moveArrayItem` for efficiency
- Maintains proper indices

**Between Containers:**
- Moves element from one container to another
- Uses `moveItemBetweenArrays`
- Removes from source, inserts at target

### Safety Features

1. **Same Position Check**: Prevents dropping on same position
2. **Lock Respect**: Locked elements cannot be dragged
3. **Visibility**: Hidden elements are not draggable
4. **Undo Support**: All moves support undo/redo

## User Experience

### Interaction Flow

```
1. Click and hold element (150ms)
   ↓
2. Element becomes semi-transparent
   ↓
3. Drag to desired position
   ↓
4. Drop zones appear showing valid positions
   ↓
5. Release to drop
   ↓
6. Element moves to new position
   ↓
7. Selection follows to new position
```

### Visual Feedback

**Dragging Element:**
- Opacity: 50% (semi-transparent)
- Cursor: 'grab'
- Follows mouse cursor

**Drop Zones:**
- Show as blue lines (between elements)
- Or blue boxes (inside empty containers)
- Highlight on hover

**After Drop:**
- Element returns to full opacity
- Appears at new position
- Remains selected

## Examples

### Example 1: Reorder Within VStack

```
Before:
VStack
├─ Label "Hello"  ← Drag this
├─ Button "Click"
└─ Image

After:
VStack
├─ Button "Click"
├─ Label "Hello"  ← Dropped here
└─ Image
```

### Example 2: Move Between Containers

```
Before:
VStack A               VStack B
├─ Label "Text" ←─┐   ├─ Button
└─ Button          │   └─ Image
                   │
After:             │
VStack A           │   VStack B
└─ Button          └─→ ├─ Label "Text"  ← Dropped
                       ├─ Button
                       └─ Image
```

### Example 3: Move Into Empty Container

```
Before:
VStack A               HStack (empty)
├─ Label "Text" ←─┐
└─ Button          │
                   │
After:             │
VStack A           │   HStack
└─ Button          └─→ └─ Label "Text"  ← Dropped
```

## Technical Details

### Path Parsing

Handles both dot notation and array indices:
```typescript
"root.children[0]" → ['root', 'children', 0]
"root.children[1].children[0]" → ['root', 'children', 1, 'children', 0]
```

### Same Array Detection

```typescript
sourceArrayPath: ['root', 'children']
targetPathArray: ['root', 'children']
→ Same array, use moveArrayItem
```

### Different Array Detection

```typescript
sourceArrayPath: ['root', 'children']
targetPathArray: ['root', 'children', 0, 'children']
→ Different arrays, use moveItemBetweenArrays
```

### Index Adjustment

When moving within same array:
```typescript
// If moving from index 0 to index 2
// After removal, target index adjusts to 1
const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
```

## Integration

### Works With:

✅ **Drop Zones**: Existing drop zone system
✅ **Palette**: Palette items still work
✅ **Layers Panel**: Layers panel drag also works
✅ **Selection**: Drag doesn't break selection
✅ **Context Menu**: Right-click still works
✅ **Lock State**: Locked items can't be dragged
✅ **Undo/Redo**: Full undo/redo support

### Drop Zone Types Supported:

- `palette-component` - Adding new components
- `canvas-node` - Reordering existing components
- `layer-node` - From layers panel (already supported)

## Performance

### Optimizations:

1. **Threshold System**: Prevents accidental drags
2. **Event Listeners**: Cleanup on unmount
3. **Direct Store Access**: Uses `getState()` for immediate updates
4. **Efficient Moves**: Different logic for same vs different arrays

### Memory Management:

- Event listeners removed on unmount
- Drag state cleared after drop
- No memory leaks

## Testing Checklist

- [x] Click and hold (150ms) starts drag
- [x] Click and drag (5px) starts immediate drag
- [x] Element becomes semi-transparent when dragging
- [x] Drop zones appear during drag
- [x] Can reorder within same container
- [x] Can move between containers
- [x] Selection follows element to new position
- [x] Undo/redo works correctly
- [x] Locked elements cannot be dragged
- [x] Context menu still works
- [x] Palette drag still works
- [x] Layers panel drag still works

## Known Edge Cases

### Handled:

✅ Dropping on same position (prevented)
✅ Moving from nested to top level
✅ Moving from top level to nested
✅ Moving between sibling containers
✅ Index adjustment when moving down

### Not Yet Supported:

⏳ Drag into completely empty document
⏳ Multi-select drag (dragging multiple items)
⏳ Drag preview customization

## Summary

Canvas drag-and-drop is now fully functional:

- ✅ **Drag Initiation**: Click and hold or drag to start
- ✅ **Visual Feedback**: Opacity and cursor changes
- ✅ **Reordering**: Within same container
- ✅ **Moving**: Between different containers
- ✅ **Safety**: Prevents invalid operations
- ✅ **Undo Support**: Full history tracking
- ✅ **Selection**: Follows element to new position
- ✅ **Integration**: Works with all existing features

Users can now freely drag elements around the canvas to reorganize their layouts!
