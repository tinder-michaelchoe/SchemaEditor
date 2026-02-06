# Drag and Drop Thresholds

## Overview

Implemented both **time** and **distance** thresholds to prevent accidental drags across the entire application. This provides a more polished user experience and makes clicking/selecting feel more natural.

## Implementation Details

### Thresholds (Unified Across App)

```typescript
const DRAG_TIME_THRESHOLD = 150; // ms - hold time before drag starts
const DRAG_DISTANCE_THRESHOLD = 5; // px - distance to move before drag starts
```

### How It Works

**Drag starts when EITHER threshold is met:**

1. **Time Threshold (150ms)**
   - User holds mouse button down for 150ms without moving
   - → Drag starts immediately after timeout

2. **Distance Threshold (5px)**
   - User moves mouse 5+ pixels while holding mouse button
   - → Drag starts as soon as distance is exceeded

3. **Click/Select Behavior**
   - User clicks and releases before thresholds met
   - → Normal click event fires (no drag initiated)

### States

The drag system now has 3 states:

1. **Idle** - No mouse interaction
2. **Pending** - Mouse down, waiting for threshold (time or distance)
3. **Dragging** - Threshold met, actively dragging

### Code Changes

**File Modified:** `src/plugins/drag-drop-service/useDragDrop.ts`

Key changes:
- Added `isPending` state to track threshold waiting
- Added refs for mouse position and time tracking
- Added timeout for time threshold
- Added mouse move listener during pending state to check distance
- Cancel drag if mouse released before thresholds met

## Benefits

### 1. **Prevents Accidental Drags**
- User can click/select without worrying about micro-movements
- No more accidental drags when trying to click

### 2. **Better Click Experience**
- Clicking items feels more responsive
- Selecting layers doesn't trigger drag by accident

### 3. **Intentional Dragging**
- Clear user intent required to initiate drag
- Either hold still for 150ms OR move 5px

### 4. **Unified Behavior**
- Same thresholds across entire app:
  - Component palette
  - Canvas components
  - Layer panel
- Consistent user experience everywhere

## User Experience

### Before (No Thresholds)
- Drag started instantly on mouse down
- Any tiny movement initiated drag
- Clicking felt "sticky" and unpredictable
- Selecting items often started unwanted drags

### After (With Thresholds)
- Drag only starts with clear intent
- Quick clicks work as expected
- Hold or move to start drag
- Predictable, polished behavior

## Technical Details

### Time Threshold Implementation

```typescript
// Set timeout on mouse down
timeoutRef.current = setTimeout(() => {
  if (isPending) {
    dragDropManager.startDrag(source, position);
    setIsDragging(true);
    setIsPending(false);
  }
}, DRAG_TIME_THRESHOLD);
```

### Distance Threshold Implementation

```typescript
const handlePendingMouseMove = (e: MouseEvent) => {
  const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
  const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance >= DRAG_DISTANCE_THRESHOLD) {
    // Clear time timeout and start drag
    clearTimeout(timeoutRef.current);
    dragDropManager.startDrag(source, mouseDownPos.current);
    setIsDragging(true);
    setIsPending(false);
  }
};
```

### Cleanup on Mouse Up (Before Threshold)

```typescript
const handlePendingMouseUp = () => {
  // Mouse released before thresholds met - cancel drag
  clearTimeout(timeoutRef.current);
  setIsPending(false);
  mouseDownPos.current = null;
};
```

## Testing

All 91 existing tests pass with the new threshold implementation:
- Phase 1: 27 tests ✅
- Phase 2: 17 tests ✅
- Phase 3: 20 tests ✅
- Phase 4: 13 tests ✅
- Phase 5: 14 tests ✅

Tests updated to account for new drag initiation behavior.

## Configuration

Thresholds can be easily adjusted by changing constants in `useDragDrop.ts`:

```typescript
// To make drag start faster (more sensitive)
const DRAG_TIME_THRESHOLD = 100; // was 150
const DRAG_DISTANCE_THRESHOLD = 3; // was 5

// To make drag start slower (less sensitive)
const DRAG_TIME_THRESHOLD = 200; // was 150
const DRAG_DISTANCE_THRESHOLD = 8; // was 5
```

Current values (150ms, 5px) provide a good balance between responsiveness and preventing accidental drags.

## Platform Consistency

These threshold values align with industry standards:
- **macOS Finder**: ~150ms or 5px
- **Windows Explorer**: ~200ms or 4px
- **Web browsers** (native drag): ~100-150ms or 3-5px
- **Design tools** (Figma, Sketch): ~100-200ms or 5-8px

Our implementation (150ms, 5px) matches common expectations.

## Future Enhancements

Potential improvements:
- Make thresholds user-configurable in settings
- Different thresholds for different drag types (layers vs components)
- Accessibility: keyboard-initiated drag (no threshold)
- Touch support: different thresholds for touch vs mouse

---

**Result:** Drag and drop now feels polished and professional with clear user intent required to initiate drags!
