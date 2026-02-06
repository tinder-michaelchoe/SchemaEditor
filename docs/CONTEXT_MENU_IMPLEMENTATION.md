# Context Menu System - Implementation Summary

## Overview
Implemented a complete context menu system for the canvas that allows right-clicking on components to access actions like enclosing elements in containers (vstack, hstack, zstack, forEach).

## Architecture

### Pattern: ContextMenuRegistry (similar to DragDropRegistry)
- **Registry**: Uses a Map to store available actions per component type
- **Auto-registration**: Initializes from SchemaParser to determine component capabilities
- **Singleton pattern**: `initContextMenuRegistry()` and `getContextMenuRegistry()`
- **Validation**: Uses SchemaParser to validate operations

### Files Created

```
src/plugins/context-menu/
├── types.ts                          # TypeScript interfaces
├── ContextMenuRegistry.ts            # Core registry with singleton pattern
├── actions/
│   └── encloseActions.ts            # 4 enclose actions (vstack/hstack/zstack/forEach)
├── components/
│   ├── ContextMenu.tsx              # Main menu UI with keyboard nav & portals
│   └── ContextMenuItem.tsx          # Individual menu item component
├── hooks/
│   └── useContextMenu.ts            # Menu state and action execution hook
└── index.ts                         # Public exports
```

### Files Modified

```
src/App.tsx                          # Initialize registry after SchemaParser
src/plugins/canvas-view/components/
├── CanvasNode.tsx                   # Added onContextMenu prop and handler
└── CanvasView.tsx                   # Integrated useContextMenu and rendered menu
```

## Implementation Details

### 1. Core Registry (`ContextMenuRegistry.ts`)

The registry manages actions and their availability:

- **Action Registration**: Automatically registers all component types from schema
- **Container Detection**: Identifies containers (vstack, hstack, zstack, forEach, sectionLayout)
- **Action Filtering**: Containers get limited actions (no enclose), leaf components get all enclose actions
- **Action Execution**: Validates action availability before executing

### 2. Enclose Actions (`actions/encloseActions.ts`)

Four actions for wrapping components:

- **Enclose in VStack**: Wraps component in vertical stack with spacing: 8
- **Enclose in HStack**: Wraps component in horizontal stack with spacing: 8
- **Enclose in ZStack**: Wraps component in layered stack
- **Enclose in ForEach**: Wraps component as template for iteration

Each action:
- Checks if component is not already a container (`isAvailable`)
- Creates wrapper with original component as child
- Uses `updateValue` to replace component with wrapper
- Selection stays on same path (now points to wrapper)

### 3. UI Components

#### ContextMenu (`components/ContextMenu.tsx`)

Features:
- **Portal Rendering**: Uses `createPortal()` to render at document root
- **Smart Positioning**: Calculates position to keep menu in viewport
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Focus Management**: Tracks focused item, focuses first item on open
- **Click Outside**: Closes menu when clicking elsewhere
- **Auto-positioning**: Adjusts position if menu would overflow viewport

#### ContextMenuItem (`components/ContextMenuItem.tsx`)

Features:
- Hover and focus states with proper CSS transitions
- Accessibility: `role="menuitem"`, proper tabIndex
- Keyboard support: Enter and Space to activate
- Visual feedback using CSS custom properties

### 4. Integration Hook (`hooks/useContextMenu.ts`)

The hook manages context menu state:

```typescript
const {
  visible,          // Menu visibility state
  position,         // { x, y } position
  actions,          // Available actions for component
  showMenu,         // (path, x, y) => void
  hideMenu,         // () => void
  handleAction,     // (actionId) => void
} = useContextMenu();
```

**Action Execution Flow**:
1. Get component data from path using `getValueAtPath`
2. Build action context with component data and parent path
3. Execute action via registry (validates availability first)
4. Hide menu on successful execution

### 5. Canvas Integration

#### CanvasNode.tsx
- Added `onContextMenu` prop to interface
- Added `handleContextMenu` callback that prevents default, stops propagation
- Checks if component is locked before showing menu
- Passes callback to container renderers for child nodes

#### CanvasView.tsx
- Imports `useContextMenu` hook and `ContextMenu` component
- Uses hook to manage menu state
- Passes `showMenu` to CanvasNode as `onContextMenu`
- Renders `ContextMenu` at root level (after delete dialog)

### 6. App Initialization

In `App.tsx`, after schema loads:
```typescript
const parser = initSchemaParser(schema);
initDragDropRegistry(parser);
initContextMenuRegistry(parser);  // ← New
```

## How It Works

### Right-Click Flow

1. **User right-clicks on component**
   - `CanvasNode.handleContextMenu` is triggered
   - Calls `onContextMenu(pathStr, clientX, clientY)`

2. **Menu opens**
   - `useContextMenu.showMenu` is called
   - Gets component data from path
   - Queries registry for available actions
   - Sets menu visible at mouse position

3. **Menu displays**
   - `ContextMenu` renders via portal
   - Calculates adjusted position to stay in viewport
   - Displays available actions
   - Focuses first item

4. **User selects action**
   - Clicks or presses Enter on action
   - `handleAction(actionId)` is called
   - Builds action context with component data
   - Registry executes action
   - Action uses `updateValue` to wrap component
   - Menu closes

### Wrap Operation

To wrap a component in a container:

```typescript
// Original component data at path
const componentData = { type: 'label', text: 'Hello' };

// Create wrapper
const wrapper = {
  type: 'vstack',
  spacing: 8,
  children: [componentData]  // Original becomes child
};

// Replace component with wrapper at same path
updateValue(path, wrapper);

// Selection stays on same path (now points to container)
```

## Key Features

### Extensibility

Adding new actions is simple:

```typescript
export const duplicateAction: ContextMenuAction = {
  id: 'duplicate',
  label: 'Duplicate',
  category: 'edit',
  isAvailable: () => true,
  execute: (context) => {
    // Clone and insert after current
  }
};

// Register in ContextMenuRegistry constructor
this.registerAction(duplicateAction);
```

### Accessibility

- Proper ARIA roles (`menu`, `menuitem`)
- Keyboard navigation (Arrow keys, Enter, Escape)
- Focus management (focus trap within menu)
- Visual focus indicators

### Smart Positioning

- Calculates menu dimensions
- Adjusts position if would overflow viewport
- Maintains minimum margins from edges

### Schema Integration

- Automatically registers all component types
- Uses SchemaParser for validation
- Respects schema constraints (e.g., containers can't be enclosed)

## Testing

### Manual Test Cases

1. ✅ **Right-click label** → Menu shows 4 enclose options
2. ✅ **Enclose in VStack** → Label wrapped in vstack with spacing: 8
3. ✅ **Right-click container** → Menu shows (containers excluded from enclose)
4. ✅ **Keyboard navigation** → Arrow keys, Enter works
5. ✅ **Click outside** → Menu closes
6. ✅ **Viewport edge** → Menu repositions correctly
7. ✅ **Locked component** → No menu appears

### Verification Steps

1. Right-click label on canvas → menu appears at cursor
2. Select "Enclose in VStack" → label wrapped in vstack
3. Verify data structure: `{ type: 'vstack', spacing: 8, children: [originalLabel] }`
4. Verify selection stays on same path (now points to wrapper)
5. Check schema validation passes
6. Verify undo/redo works correctly
7. Test all 4 enclose actions

## Future Enhancements

Potential actions to add:
- **Duplicate**: Clone component and insert after
- **Delete**: Remove component with confirmation
- **Copy/Paste**: Copy component data to clipboard
- **Convert To**: Change component type (e.g., label → button)
- **Extract**: Extract child from container
- **Group/Ungroup**: Wrap/unwrap multiple selected components
- **Lock/Unlock**: Toggle component lock state
- **Hide/Show**: Toggle visibility

## Performance Considerations

- Menu only renders when visible (conditional rendering)
- Portal rendering prevents layout recalculations
- Action filtering happens once when menu opens
- Event listeners cleaned up on unmount
- Uses `useCallback` for stable function references

## Accessibility Notes

- Screen reader friendly with proper ARIA roles
- Keyboard-only navigation fully supported
- Visual focus indicators for keyboard users
- Escape key to dismiss
- Focus trap prevents tabbing out of menu

## Integration with Existing Systems

- **SchemaParser**: Used to validate wrap operations
- **EditorStore**: Uses `updateValue` for state updates
- **DragDropRegistry**: Similar pattern for consistency
- **Path Utils**: Uses `stringToPath`, `pathToString`, `getValueAtPath`
- **Undo/Redo**: Automatic via `updateValue` (creates history entry)

## Summary

The context menu system provides an intuitive way to perform transformations on canvas components. It follows the existing plugin architecture patterns, integrates seamlessly with the schema system, and is designed for extensibility. The implementation is complete and ready for use.
