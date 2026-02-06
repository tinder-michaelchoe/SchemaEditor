# Canvas Drag & Marquee Selection Fix

## Issue
When clicking and holding on a canvas element in select mode, both the marquee selection box and drag detection were starting simultaneously, causing visual conflicts.

## Root Cause
When mouseDown occurred on a CanvasNode:
1. CanvasNode's dragProps.onMouseDown fired (started drag detection)
2. Event bubbled up to canvas container
3. Canvas container's marquee.onMouseDown fired (started marquee selection)
4. Both systems were active simultaneously

This caused the marquee selection box to appear even though the user was trying to drag an element.

## Solution

### 1. Stop Event Propagation on CanvasNode

Added `stopPropagation()` to the mouseDown handler:

```typescript
// Override dragProps to add stopPropagation
const dragPropsWithStopPropagation = isLocked ? {} : {
  ...dragProps,
  onMouseDown: (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent marquee selection from starting
    dragProps.onMouseDown(e);
  },
};
```

This prevents the mouseDown event from bubbling up to the canvas container, so marquee selection doesn't start when clicking on a node.

### 2. Tool-Based Behavior (Already Working)

The canvas already properly handles tool modes:

```typescript
{...(currentTool === 'select' && !navigation.isSpacePressed
  ? selection.marqueeHandlers
  : {})}
```

**Select Tool:**
- Marquee handlers applied
- Can select multiple elements with drag box
- But now, clicking on elements starts drag instead of marquee

**Hand Tool:**
- Marquee handlers NOT applied
- No selection box appears at all
- Pure pan/navigation mode

## Behavior Now

### Select Tool + Click on Element
```
1. MouseDown on element
   ↓
2. Drag detection starts
   ↓ (Event does NOT bubble up)
3. Marquee selection does NOT start
   ↓
4. After 150ms or 5px movement
   ↓
5. Drag operation begins
   ↓
6. Element becomes semi-transparent and follows cursor
```

### Select Tool + Click on Empty Canvas
```
1. MouseDown on canvas background
   ↓
2. Marquee selection starts
   ↓
3. Blue selection box appears
   ↓
4. Drag to select multiple elements
   ↓
5. Release to complete selection
```

### Hand Tool + Click Anywhere
```
1. MouseDown anywhere
   ↓
2. Pan navigation starts
   ↓
3. Canvas moves with cursor
   ↓
4. No selection, no marquee box
```

## Visual Feedback

### Before Fix:
```
Click & Hold Element (Select Tool)
  ↓
❌ Marquee box appears
❌ Drag also starts
❌ Confusing double feedback
```

### After Fix:
```
Click & Hold Element (Select Tool)
  ↓
✅ Only drag starts
✅ Element becomes transparent
✅ Clear single feedback

Click & Drag Empty Space (Select Tool)
  ↓
✅ Marquee box appears
✅ Can select multiple elements
```

## Testing Checklist

- [x] Click & hold element in select tool → Only drag starts, no marquee
- [x] Click & drag empty canvas in select tool → Marquee selection works
- [x] Click anywhere in hand tool → No marquee, only pan
- [x] Drag element still works correctly
- [x] Selection still works with single click
- [x] Multi-selection with shift/cmd still works
- [x] Locked elements still cannot be dragged

## Technical Details

### Event Flow (Before Fix)
```
CanvasNode mouseDown
  ├─→ dragProps.onMouseDown (starts drag detection)
  └─→ bubbles to canvas container
      └─→ marqueeHandlers.onMouseDown (starts marquee)
          ↓
      Both systems active! ❌
```

### Event Flow (After Fix)
```
CanvasNode mouseDown
  └─→ dragProps.onMouseDown (starts drag detection)
      └─→ e.stopPropagation()
          ↓
      Event does NOT bubble up ✅

Canvas background mouseDown
  └─→ marqueeHandlers.onMouseDown (starts marquee) ✅
```

### Why This Works

1. **Clicking on Node**: Event stops at node, only drag happens
2. **Clicking on Canvas**: Event reaches canvas handlers, marquee happens
3. **Hand Tool**: No marquee handlers applied at all

## Edge Cases Handled

✅ **Nested Elements**: stopPropagation works at each level
✅ **Locked Elements**: No drag props applied, events bubble normally
✅ **Container Editing Mode**: Selection still works independently
✅ **Multi-Select**: Shift/Cmd+Click still works (uses onClick, not mouseDown)

## Summary

The fix ensures clean separation between:
- **Drag operations** on elements (mouseDown on node)
- **Marquee selection** on empty space (mouseDown on canvas)
- **Pan navigation** with hand tool (no marquee handlers)

Users now get clear, predictable behavior:
- ✅ Click element → Drag it
- ✅ Click empty space → Select multiple
- ✅ Switch to hand tool → Pan around

No more conflicting visual feedback or competing interactions!
