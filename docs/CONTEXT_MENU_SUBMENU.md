# Context Menu Submenu Implementation

## Overview
Refactored the context menu system to use a single "Enclose in" menu item with a submenu containing the four container options (VStack, HStack, ZStack, ForEach). This provides a cleaner, more organized UI.

## Changes Made

### 1. Updated Type Definitions (`types.ts`)

Added support for nested submenus:

```typescript
export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  category: 'transform' | 'edit' | 'view';
  isAvailable: (componentType: string) => boolean;
  execute?: (context: ActionContext) => void;  // Now optional for submenu parents
  submenu?: ContextMenuAction[];  // New: submenu items
}
```

### 2. Refactored Enclose Actions (`actions/encloseActions.ts`)

Changed from 4 separate actions to 1 parent action with submenu:

**Before:**
```typescript
export const encloseActions = [
  encloseInVStack,
  encloseInHStack,
  encloseInZStack,
  encloseInForEach,
];
```

**After:**
```typescript
export const encloseAction: ContextMenuAction = {
  id: 'enclose',
  label: 'Enclose in',
  category: 'transform',
  isAvailable: (type) => !isContainer(type),
  submenu: [
    { id: 'enclose-vstack', label: 'VStack', execute: ... },
    { id: 'enclose-hstack', label: 'HStack', execute: ... },
    { id: 'enclose-zstack', label: 'ZStack', execute: ... },
    { id: 'enclose-foreach', label: 'ForEach', execute: ... },
  ],
};
```

### 3. Updated Registry (`ContextMenuRegistry.ts`)

Changed registration to use single 'enclose' action:

**Before:**
```typescript
availableActions.push(
  'enclose-vstack',
  'enclose-hstack',
  'enclose-zstack',
  'enclose-foreach'
);
```

**After:**
```typescript
availableActions.push('enclose');
```

### 4. Enhanced Context Menu Item (`ContextMenuItem.tsx`)

Added submenu support with visual indicator:

- **Right arrow icon**: Displayed when item has submenu
- **Keyboard support**: ArrowRight opens submenu
- **Mouse support**: Hover triggers submenu opening
- **Click handling**: Opens submenu instead of executing action

```typescript
// Right arrow indicator
{hasSubmenu && (
  <svg className="w-3 h-3" viewBox="0 0 24 24">
    <path d="M9 5l7 7-7 7" />
  </svg>
)}
```

### 5. Enhanced Context Menu (`ContextMenu.tsx`)

Major updates to support submenu rendering and interaction:

#### State Management
```typescript
const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
```

#### Submenu Positioning
- Positions submenu to the right of parent menu item
- Calculates based on item's bounding rect
- Falls back to left side if would overflow viewport

```typescript
// Position submenu to the right of parent item
let submenuX = menuRect.right;
let submenuY = itemRect.top;

// Check if submenu would overflow right edge
if (submenuX + estimatedSubmenuWidth > window.innerWidth) {
  submenuX = menuRect.left - estimatedSubmenuWidth;
}
```

#### Keyboard Navigation
- **ArrowRight**: Opens submenu from focused item
- **ArrowLeft**: Closes submenu, returns to parent menu
- **Escape**: Closes submenu first, then closes menu
- **Enter/Space**: Opens submenu if item has one

#### Mouse Interaction
- **Hover**: Auto-opens submenu
- **Click**: Opens submenu or executes action
- **Click outside**: Closes both menu and submenu

#### Rendering
```typescript
return createPortal(
  <>
    {/* Main Menu */}
    <div ref={menuRef} ...>
      {actions.map(action => <ContextMenuItem ... />)}
    </div>

    {/* Submenu (conditionally rendered) */}
    {openSubmenuId && openSubmenu && (
      <div ref={submenuRef} ...>
        {openSubmenu.map(subAction => <ContextMenuItem ... />)}
      </div>
    )}
  </>,
  document.body
);
```

### 6. Updated Hook (`useContextMenu.ts`)

Added `findAction` helper to search through submenus:

```typescript
const findAction = useCallback((actionId: string): ContextMenuAction | null => {
  // Search top-level actions
  for (const action of actions) {
    if (action.id === actionId) return action;

    // Search submenu items
    if (action.submenu) {
      const submenuAction = action.submenu.find(sub => sub.id === actionId);
      if (submenuAction) return submenuAction;
    }
  }
  return null;
}, [actions]);
```

Updated `handleAction` to execute submenu items:

```typescript
const action = findAction(actionId);
if (action?.execute) {
  action.execute(context);
  hideMenu();
}
```

## User Experience

### Visual Improvements
- **Single "Enclose in" item** with right arrow indicator
- **Submenu appears** to the right on hover/click
- **Clean organization** - 1 menu item instead of 4

### Interaction Flow

1. **Right-click component** → Menu appears with "Enclose in ›"
2. **Hover over "Enclose in"** → Submenu opens showing VStack, HStack, ZStack, ForEach
3. **Click submenu item** → Component is wrapped in selected container
4. **Menu closes automatically**

### Keyboard Navigation

- **Tab**: Focus menu
- **Arrow Up/Down**: Navigate menu items
- **Arrow Right**: Open submenu (on "Enclose in")
- **Arrow Left**: Close submenu
- **Enter/Space**: Select item or open submenu
- **Escape**: Close submenu, then close menu

## Technical Details

### Z-Index Layers
- **Main menu**: `z-[9999]`
- **Submenu**: `z-[10000]` (appears above main menu)

### Click Outside Detection
Checks both main menu and submenu refs:

```typescript
const clickedInsideMenu = menuRef.current?.contains(e.target as Node);
const clickedInsideSubmenu = submenuRef.current?.contains(e.target as Node);

if (!clickedInsideMenu && !clickedInsideSubmenu) {
  onClose();
}
```

### Auto-open on Hover
When mouse enters a menu item:
- If item has submenu → opens it
- If item has no submenu → closes any open submenu

```typescript
onMouseEnter={() => {
  setFocusedIndex(index);
  if (action.submenu && action.submenu.length > 0) {
    handleSubmenuOpen(action.id);
  } else {
    setOpenSubmenuId(null);
  }
}}
```

## Benefits

1. **Cleaner UI**: Single menu item instead of 4 separate items
2. **Organized**: Related actions grouped together
3. **Extensible**: Easy to add more container types without cluttering main menu
4. **Accessible**: Full keyboard support maintained
5. **Intuitive**: Standard submenu pattern users expect

## Future Enhancements

The submenu pattern can be extended for other action groups:

```typescript
// Example: Transform submenu
{
  id: 'transform',
  label: 'Transform',
  category: 'transform',
  submenu: [
    { id: 'rotate', label: 'Rotate', ... },
    { id: 'flip-h', label: 'Flip Horizontal', ... },
    { id: 'flip-v', label: 'Flip Vertical', ... },
  ]
}
```

## Testing Checklist

- [x] Right-click shows "Enclose in ›" item
- [x] Hover opens submenu with 4 container options
- [x] Click submenu item wraps component correctly
- [x] Submenu positions to the right of parent
- [x] Submenu falls back to left if overflow
- [x] ArrowRight opens submenu
- [x] ArrowLeft closes submenu
- [x] Escape closes submenu then menu
- [x] Click outside closes both menus
- [x] All 4 container types work correctly

## Summary

Successfully refactored the context menu to use a cleaner submenu pattern. The "Enclose in" action now contains all 4 container options in a submenu, providing better organization and a more professional UX. The implementation supports full keyboard navigation, smart positioning, and maintains all previous functionality.
