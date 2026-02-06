# Drop Zone Calculation Fix

## Issue
Drop zones were not appearing when dragging elements on the canvas, even though the drag detection was working correctly.

## Root Cause
The `useCanvasDropZones` hook was receiving the full document object:
```typescript
{
  id: "...",
  root: {
    children: [...]
  }
}
```

But the hook was trying to extract components starting from path `'root'`, looking for `data.type` and `data.children` at the document level, which don't exist there. The actual component tree is nested under `data.root`.

Meanwhile, the bounds were being registered with paths like:
- `root.children[0]`
- `root.children[0].children[0]`
- etc.

This mismatch caused:
1. No components to be extracted (looked for `data.type` but got `undefined`)
2. No bounds lookups to succeed (looked for key `'root'` but only had `'root.children[...]'`)
3. No drop zones to be calculated

## Console Evidence
```
[extractComponents] Processing: {
  path: 'root',
  type: undefined,           // ❌ Should have a type
  hasChildren: false,        // ❌ Should be true
  childrenCount: undefined   // ❌ Should be a number
}
[extractComponents] Bounds lookup for root : false  // ❌ No bounds found
[extractComponents] Returning 0 components from root // ❌ No components extracted
```

## Solution

### Part 1: Pass Correct Data to Hook
**File:** `src/plugins/canvas-view/components/CanvasView.tsx`

Changed from:
```typescript
const dropZones = useCanvasDropZones({
  nodeBoundsMap: nodeBoundsRef.current,
  componentData: data,  // ❌ Full document
  enabled: isDragging,
});
```

To:
```typescript
const dropZones = useCanvasDropZones({
  nodeBoundsMap: nodeBoundsRef.current,
  componentData: data?.root,  // ✅ Component tree only
  enabled: isDragging,
});
```

### Part 2: Update Extraction Logic
**File:** `src/plugins/canvas-view/hooks/useCanvasDropZones.ts`

Changed from:
```typescript
// This tried to extract starting from 'root' in the full document
const components = extractComponentsWithBounds(
  componentData,  // Full document: { id, root: {...} }
  'root',         // Path: looking for data.root
  nodeBoundsMap
);
```

To:
```typescript
// Now we have data.root directly, so iterate through its children
const components: ComponentData[] = [];

if (componentData && componentData.children && Array.isArray(componentData.children)) {
  componentData.children.forEach((child: any, index: number) => {
    const childPath = `root.children[${index}]`;  // Matches bounds keys
    const childComponents = extractComponentsWithBounds(child, childPath, nodeBoundsMap);
    components.push(...childComponents);
  });
}
```

## How It Works Now

1. **CanvasView passes `data.root`**: The component tree starting at the root container
2. **Hook iterates children**: Goes through `root.children[0]`, `root.children[1]`, etc.
3. **Paths match bounds**: Keys like `root.children[0]` now match the registered bounds
4. **Extraction succeeds**: Finds components with their bounds
5. **Zones calculated**: Drop zones appear with 40% opacity, 100% on hover

## Data Flow

```
Document Structure:
{
  id: "document-id",
  root: {
    type: "sectionLayout",
    children: [
      { type: "vstack", children: [...] },  ← root.children[0]
      { type: "label", text: "..." },       ← root.children[1]
      ...
    ]
  }
}

Bounds Registration (in CanvasNode):
- root.children[0]              → DOMRect
- root.children[0].children[0]  → DOMRect
- root.children[0].children[1]  → DOMRect
- root.children[1]              → DOMRect

Component Extraction:
✅ Start with: data.root (the sectionLayout)
✅ Iterate: data.root.children
✅ Extract: root.children[0], root.children[1], etc.
✅ Lookup bounds: Keys match registered paths
✅ Result: Components with bounds found
✅ Drop zones: Calculated and displayed
```

## Testing

After the fix:
- ✅ Drop zones appear at 40% opacity when dragging
- ✅ Drop zones highlight to 100% opacity on hover
- ✅ Drop zones appear between items in VStack (horizontal lines)
- ✅ Drop zones appear between items in HStack (vertical lines)
- ✅ Drop zones appear in empty containers (highlight boxes)
- ✅ Dragged element's own position is filtered out

## Code Cleanup

Removed all debug `console.log` statements from:
- `calculateDropZonesForComponent()`
- `extractComponentsWithBounds()`
- `useCanvasDropZones()` effect

## Summary

The fix aligns the data structure passed to `useCanvasDropZones` with the registered bounds paths, allowing proper component extraction and drop zone calculation. Drop zones now appear correctly during drag operations!
