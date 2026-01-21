# Phase 4: Design System Browser + Templates - Detailed Plan

## Overview

Integrate design system tokens and provide a template library for reusable UI patterns.

## Plugin 1: `design-system-browser`

**Purpose**: Browse and apply design system tokens (colors, typography, spacing)

**Manifest**:
```typescript
manifest: {
  id: 'design-system-browser',
  name: 'Design System Browser',
  capabilities: [
    'document:read',
    'document:write',
    'selection:write',
    'ui:slots',
    'services:provide',
    'services:consume',
    'events:emit',
  ],
  slots: [
    { slot: 'sidebar:left', component: 'DesignSystemPanel', priority: 50 }
  ],
  provides: [
    { id: 'style-resolver', description: 'Resolves style IDs to definitions' },
    { id: 'design-system', description: 'Design system token access' }
  ],
  emits: [
    'design-system:loaded',
    'design-system:token-applied',
  ],
}
```

### Service: `style-resolver`

```typescript
interface StyleResolver {
  // Resolve a style ID to its definition
  resolveStyle(styleId: string): StyleDefinition | undefined;
  
  // Get all styles of a type
  getStylesByType(type: 'color' | 'typography' | 'spacing' | 'shadow'): StyleDefinition[];
  
  // Search styles
  searchStyles(query: string): StyleDefinition[];
  
  // Get style categories
  getCategories(): StyleCategory[];
}

interface StyleDefinition {
  id: string;
  name: string;
  type: 'color' | 'typography' | 'spacing' | 'shadow';
  category: string;
  value: unknown;
  cssValue: string;
  preview?: string;
}
```

### Service: `design-system`

```typescript
interface DesignSystemService {
  // Load a design system definition
  loadDesignSystem(url: string): Promise<void>;
  
  // Get current design system
  getDesignSystem(): DesignSystemDefinition | null;
  
  // List available design systems
  listDesignSystems(): DesignSystemMeta[];
  
  // Get tokens by category
  getTokens(category: string): Token[];
  
  // Resolve token value
  resolveToken(tokenPath: string): unknown;
}
```

### UI Components

#### `DesignSystemPanel.tsx`

```typescript
function DesignSystemPanel() {
  const designSystem = useService<DesignSystemService>('design-system');
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'shadows'>('colors');
  
  return (
    <div className="design-system-panel">
      <PanelHeader title="Design System" />
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="colors" icon={<Palette />}>Colors</Tab>
        <Tab value="typography" icon={<Type />}>Typography</Tab>
        <Tab value="spacing" icon={<Space />}>Spacing</Tab>
        <Tab value="shadows" icon={<Shadow />}>Shadows</Tab>
      </Tabs>
      
      <TabContent value="colors">
        <ColorTokenBrowser />
      </TabContent>
      
      <TabContent value="typography">
        <TypographyBrowser />
      </TabContent>
      
      {/* ... other tabs */}
    </div>
  );
}
```

#### `ColorTokenBrowser.tsx`

```typescript
function ColorTokenBrowser() {
  const styleResolver = useService<StyleResolver>('style-resolver');
  const colors = styleResolver?.getStylesByType('color') || [];
  const categories = groupBy(colors, 'category');
  
  return (
    <div className="color-browser">
      {Object.entries(categories).map(([category, tokens]) => (
        <div key={category} className="color-category">
          <h4>{category}</h4>
          <div className="color-grid">
            {tokens.map(token => (
              <ColorSwatch
                key={token.id}
                token={token}
                onClick={() => handleApplyColor(token)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorSwatch({ token, onClick }) {
  return (
    <button 
      className="color-swatch"
      onClick={onClick}
      title={`${token.name}\n${token.id}`}
    >
      <div 
        className="swatch-preview" 
        style={{ background: token.cssValue }} 
      />
      <span className="swatch-name">{token.name}</span>
    </button>
  );
}
```

### UI Mockup: Design System Browser

```
┌────────────────────────────────┐
│ 🎨 Design System               │
├────────────────────────────────┤
│ [Colors] [Type] [Space] [Shadow]│
├────────────────────────────────┤
│ ▼ Brand                        │
│ ┌──────────────────────────┐   │
│ │ ██ ██ ██ ██ ██ ██ ██ ██ │   │
│ │ Primary colors            │   │
│ └──────────────────────────┘   │
│                                │
│ ▼ Semantic                     │
│ ┌──────────────────────────┐   │
│ │ ██ Success  ██ Warning   │   │
│ │ ██ Error    ██ Info      │   │
│ └──────────────────────────┘   │
│                                │
│ ▼ Surface                      │
│ ┌──────────────────────────┐   │
│ │ ░░ Background            │   │
│ │ ▓▓ Surface               │   │
│ │ ██ Card                  │   │
│ └──────────────────────────┘   │
│                                │
│ Click a color to apply to      │
│ selected component             │
└────────────────────────────────┘
```

## Plugin 2: `template-library`

**Purpose**: Save and reuse component patterns

**Manifest**:
```typescript
manifest: {
  id: 'template-library',
  name: 'Template Library',
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'ui:slots',
    'storage:local',
    'events:emit',
  ],
  slots: [
    { slot: 'sidebar:left', component: 'TemplatePanel', priority: 40 }
  ],
  emits: [
    'template:saved',
    'template:applied',
    'template:deleted',
  ],
}
```

### Template Storage

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  data: unknown;
  schema?: JSONSchema;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

interface TemplateStorage {
  // Save current selection as template
  saveAsTemplate(name: string, options?: SaveOptions): Promise<Template>;
  
  // Get all templates
  getTemplates(): Template[];
  
  // Get templates by category
  getTemplatesByCategory(category: string): Template[];
  
  // Apply template at path
  applyTemplate(templateId: string, targetPath: string): Promise<void>;
  
  // Delete template
  deleteTemplate(templateId: string): Promise<void>;
  
  // Import/export
  exportTemplates(): string;
  importTemplates(json: string): Promise<void>;
}
```

### UI Components

#### `TemplatePanel.tsx`

```typescript
function TemplatePanel() {
  const templates = useTemplateStorage();
  const { selectedPath } = useSelectionStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  
  return (
    <div className="template-panel">
      <PanelHeader title="Templates" />
      
      {/* Save button */}
      {selectedPath && (
        <Button onClick={() => handleSaveTemplate()}>
          Save Selection as Template
        </Button>
      )}
      
      {/* Search */}
      <SearchInput value={search} onChange={setSearch} />
      
      {/* Category filter */}
      <CategoryTabs value={category} onChange={setCategory} />
      
      {/* Template grid */}
      <div className="template-grid">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onApply={() => handleApplyTemplate(template)}
            onDelete={() => handleDeleteTemplate(template)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Built-in Templates

Provide starter templates for common patterns:

```typescript
const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'builtin:hero-section',
    name: 'Hero Section',
    category: 'Sections',
    description: 'Full-width hero with title, subtitle, and CTA',
    data: {
      type: 'VStack',
      children: [
        { type: 'Text', content: 'Welcome', style: 'heading.xl' },
        { type: 'Text', content: 'Subtitle goes here', style: 'body.lg' },
        { type: 'Button', title: 'Get Started', style: 'primary' },
      ],
    },
  },
  {
    id: 'builtin:card-list',
    name: 'Card List',
    category: 'Lists',
    description: 'Scrollable list of cards',
    // ...
  },
  {
    id: 'builtin:form-group',
    name: 'Form Group',
    category: 'Forms',
    // ...
  },
];
```

### UI Mockup: Template Library

```
┌────────────────────────────────┐
│ 📚 Templates                   │
├────────────────────────────────┤
│ [💾 Save Selection as Template]│
├────────────────────────────────┤
│ [🔍 Search templates...      ] │
├────────────────────────────────┤
│ [All] [Sections] [Lists] [Forms]│
├────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐│
│ │ ┌─────────┐ │ │ ┌─────────┐ ││
│ │ │ Hero    │ │ │ │ Card    │ ││
│ │ │ Section │ │ │ │ List    │ ││
│ │ └─────────┘ │ │ └─────────┘ ││
│ │ Hero Section│ │ Card List   ││
│ │ [Apply] [×] │ │ [Apply] [×] ││
│ └─────────────┘ └─────────────┘│
│                                │
│ ┌─────────────┐ ┌─────────────┐│
│ │ Form Group  │ │ Nav Bar     ││
│ │ [Apply] [×] │ │ [Apply] [×] ││
│ └─────────────┘ └─────────────┘│
├────────────────────────────────┤
│ My Templates                   │
│ ┌─────────────┐                │
│ │ Custom Card │                │
│ │ [Apply] [×] │                │
│ └─────────────┘                │
└────────────────────────────────┘
```

## Design System Loading

### From JSON Definition

```typescript
interface DesignSystemDefinition {
  name: string;
  version: string;
  tokens: {
    colors: Record<string, ColorToken>;
    typography: Record<string, TypographyToken>;
    spacing: Record<string, SpacingToken>;
    shadows: Record<string, ShadowToken>;
    borders: Record<string, BorderToken>;
  };
  components: Record<string, ComponentStyle>;
}

// Load from URL or embedded
async function loadDesignSystem(source: string | DesignSystemDefinition) {
  if (typeof source === 'string') {
    const response = await fetch(source);
    return response.json();
  }
  return source;
}
```

### Integration with CLADS

The design system tokens map to CLADS style references:

```typescript
// CLADS document
{
  type: 'Text',
  content: 'Hello',
  style: 'body.medium',  // Reference to design system
}

// Design system resolution
styleResolver.resolveStyle('body.medium');
// Returns: { fontSize: 16, fontWeight: 400, lineHeight: 24, ... }
```

## Dependencies

- Phase 1 complete (app shell)
- Phase 2 complete (property inspector for style picker)

## Estimated Effort

| Task | Estimate |
|------|----------|
| Design system service | 1.5 days |
| Style resolver service | 1 day |
| Design system browser UI | 2 days |
| Template storage | 1 day |
| Template library UI | 1.5 days |
| Built-in templates | 1 day |
| Style picker integration | 1 day |
| Testing and polish | 1 day |
| **Total** | **10 days** |

## Success Criteria

- [ ] Design system loads from JSON definition
- [ ] Color/typography/spacing tokens display correctly
- [ ] Click token applies to selected component
- [ ] Templates can be saved from selection
- [ ] Templates can be applied to any valid location
- [ ] Template thumbnails generate automatically
- [ ] Style picker integrates with property inspector
- [ ] Built-in templates provide useful starting points
