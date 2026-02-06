# Layer Content Preview Feature

## Overview

Enhanced the layers panel to show content previews for components that have text content (labels, buttons, textfields). This makes it much easier to identify which component is which without having to select them first.

## What Changed

### Files Modified

1. **`src/plugins/layers-panel/components/LayerItem.tsx`**
   - Added `getContentPreview()` function to extract text content
   - Shows preview text next to layer name in gray text
   - Includes preview in drag data

2. **`src/plugins/drag-drop-service/DragPreview.tsx`**
   - Updated to show content preview when dragging layers
   - Uses proper component icon instead of generic folder icon

## Supported Component Types

### Labels
- **Property:** `text`
- **Example:** `{"type": "label", "text": "Hello World"}`
- **Display:** `label "Hello World"`

### Buttons
- **Property:** `label`
- **Example:** `{"type": "button", "label": "Click Me"}`
- **Display:** `button "Click Me"`

### Text Fields
- **Property:** `placeholder`
- **Example:** `{"type": "textfield", "placeholder": "Enter name"}`
- **Display:** `textfield "Enter name"`

## Visual Design

### In Layers Panel
```
📝 label "Welcome to the app"
🔘 button "Sign In"
📄 textfield "username@example.com"
⬇️ vstack
  📝 label "Title"
  📝 label "Subtitle"
```

### During Drag
The drag preview also shows the content:
```
┌─────────────────────────┐
│ 📝 label "Welcome..."   │
└─────────────────────────┘
```

### Text Truncation
- Content longer than 20 characters is truncated
- Adds "..." to indicate truncation
- Example: `"This is a very long label text that..."` → `"This is a very long..."`

### Styling
- Content preview appears in **muted gray** next to the layer name
- When layer is selected, preview shows in **white/60** (slightly transparent)
- Quoted for clarity: `"text content"`

## Implementation Details

### Content Preview Function

```typescript
const getContentPreview = (): string | null => {
  if (nodeType === 'label' && node.text) {
    const text = String(node.text);
    return text.length > 20 ? text.substring(0, 20) + '...' : text;
  }
  if (nodeType === 'button' && node.label) {
    const label = String(node.label);
    return label.length > 20 ? label.substring(0, 20) + '...' : label;
  }
  if (nodeType === 'textfield' && node.placeholder) {
    const placeholder = String(node.placeholder);
    return placeholder.length > 20 ? placeholder.substring(0, 20) + '...' : placeholder;
  }
  return null;
};
```

### Display in Layer Item

```typescript
<span className={`flex-1 min-w-0 truncate ${...}`}>
  {nodeName}
  {contentPreview && (
    <span className={`ml-1.5 ${
      isSelected ? 'text-white/60' : 'text-[var(--text-tertiary)]'
    }`}>
      "{contentPreview}"
    </span>
  )}
</span>
```

### Drag Data Enhancement

```typescript
const { isDragging, dragProps } = useDragSource({
  type: 'layer-node',
  data: {
    path,
    type: nodeType,
    name: nodeName,
    contentPreview,  // Added
  },
});
```

## User Benefits

### Before
```
Layer Panel:
📁 label
📁 label
📁 button
📁 label
```
❌ Hard to tell which label is which
❌ Must select each one to see content
❌ Generic folder icon for all layers

### After
```
Layer Panel:
📝 label "Welcome!"
📝 label "Sign in to continue"
🔘 button "Get Started"
📝 label "Terms and Conditions"
```
✅ **Instantly see what each component contains**
✅ **No need to select to identify**
✅ **Proper component icons**
✅ **Content shown in drag preview too**

## Examples

### Simple Form
```
Layers Panel Display:
📄 textfield "Email address"
📄 textfield "Password"
🔘 button "Sign In"
📝 label "Forgot password?"
```

### Article Layout
```
Layers Panel Display:
📝 label "Breaking News"
📝 label "Lorem ipsum dolor sit a..."  (truncated)
🖼️ image
📝 label "Read more"
```

### Settings Screen
```
Layers Panel Display:
⬇️ vstack
  📝 label "Notifications"
  🔘 toggle
  📝 label "Enable push notificati..."  (truncated)
⬇️ vstack
  📝 label "Privacy"
  🔘 toggle
  📝 label "Share analytics data"
```

## Testing

All tests continue to pass (14/14 Phase 5 tests).

No breaking changes - components without content simply don't show preview.

## Future Enhancements

Potential additions:
- Show `value` for textfields with pre-filled text
- Show image filename for image components
- Show action name for buttons with actions
- Configurable truncation length in settings
- Show full text on hover (tooltip)

## Related Features

This enhancement works seamlessly with:
- **Drag thresholds** - Content visible during entire drag operation
- **Drop line indicators** - Content helps identify drop targets
- **Layer selection** - Content helps find the right layer faster

---

**Result:** Much easier to work with labels and other text-based components in the layers panel!
