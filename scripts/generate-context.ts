#!/usr/bin/env npx ts-node

/**
 * Context File Generator
 * 
 * Generates a single markdown file with everything an LLM needs to develop plugins.
 * Run: npm run generate-context
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface ExtensionPoint {
  id: string;
  pluginId: string;
  description: string;
  schema: Record<string, unknown>;
}

interface Service {
  id: string;
  pluginId: string;
  interface: string;
  description: string;
}

// ============================================================================
// Content Generators
// ============================================================================

function generateCapabilitiesSection(): string {
  return `## Capabilities

Capabilities control what a plugin can access. Always request the minimum needed.

| Capability | Description | Use Case |
|------------|-------------|----------|
| \`document:read\` | Read schema, data, errors | Displaying document data |
| \`document:write\` | Modify document via actions | Editing values |
| \`selection:read\` | Read selected/editing path | Highlighting selected items |
| \`selection:write\` | Change selection | Selecting nodes on click |
| \`ui:read\` | Read theme, view mode | Adapting to dark mode |
| \`ui:write\` | Toggle theme, change view | Theme toggle button |
| \`events:emit\` | Emit custom events | Notifying other plugins |
| \`events:subscribe\` | Listen to events | Reacting to changes |
| \`extensions:define\` | Define extension points | Making your plugin extensible |
| \`extensions:contribute\` | Contribute to extension points | Extending other plugins |
| \`services:provide\` | Provide services | Sharing functionality |
| \`services:consume\` | Use services | Using shared functionality |
| \`storage:local\` | Plugin-specific storage | Persisting preferences |
`;
}

function generateSlotsSection(): string {
  return `## UI Slots

Slots are predefined areas where plugins render their UI.

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│ [header:left]     [header:center]              [header:right]   │
├─────────────┬───────────────────────────┬───────────────────────┤
│             │                           │                       │
│ [sidebar:   │      [main:view]          │    [sidebar:right]    │
│   left]     │                           │                       │
│             │                           │                       │
├─────────────┴───────────────────────────┴───────────────────────┤
│                      [panel:bottom]                             │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

| Slot | Description | Example Use |
|------|-------------|-------------|
| \`header:left\` | Left side of header | Logo, navigation |
| \`header:center\` | Center of header | Title, breadcrumbs |
| \`header:right\` | Right side of header | Actions, settings |
| \`sidebar:left\` | Left sidebar | Component palette, file tree |
| \`sidebar:right\` | Right sidebar | Property inspector |
| \`main:view\` | Main content area | Tree view, canvas |
| \`panel:bottom\` | Bottom panel | Console, errors |
| \`toolbar:main\` | Toolbar area | Action buttons |
| \`context-menu\` | Right-click menu | Context actions |
`;
}

function generateEventsSection(): string {
  return `## Core Events

These events are always available for subscription.

| Event | Payload | Description |
|-------|---------|-------------|
| \`document:loaded\` | \`{ schema, data }\` | Schema/document loaded |
| \`document:changed\` | \`{ path, value, previousValue }\` | Data changed |
| \`selection:changed\` | \`{ path, previousPath }\` | Selection changed |
| \`validation:completed\` | \`{ isValid, errorCount, errorPaths }\` | Validation ran |
| \`theme:changed\` | \`{ isDarkMode }\` | Theme toggled |
| \`plugin:activated\` | \`{ pluginId }\` | Plugin activated |
| \`plugin:deactivated\` | \`{ pluginId }\` | Plugin deactivated |
| \`service:registered\` | \`{ serviceId, pluginId }\` | Service registered |
`;
}

function generateSimpleAPISection(): string {
  return `## Simple API (usePluginAPI)

The Simple API covers 80% of plugin use cases with a minimal interface.

\`\`\`typescript
const api = usePluginAPI();

// Read-only properties
api.schema       // JSONSchema | null
api.data         // unknown
api.isValid      // boolean
api.selectedPath // string | null
api.isDarkMode   // boolean

// Methods
api.getValue(path: string): unknown
api.setValue(path: string, value: unknown): void
api.select(path: string | null): void
api.notify(message: string, type: 'info' | 'success' | 'warning' | 'error'): void
api.on(event: string, handler: (payload: unknown) => void): () => void
api.emit(event: string, payload?: unknown): void
\`\`\`

### Example Usage

\`\`\`typescript
function MyPlugin() {
  const api = usePluginAPI();
  
  const handleUpdate = () => {
    api.setValue('root.title', 'New Title');
    api.notify('Updated!', 'success');
  };
  
  useEffect(() => {
    // Subscribe to selection changes
    return api.on('selection:changed', (payload) => {
      console.log('Selected:', payload);
    });
  }, []);
  
  return (
    <div>
      <p>Selected: {api.selectedPath}</p>
      <p>Valid: {api.isValid ? 'Yes' : 'No'}</p>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
\`\`\`
`;
}

function generateFullContextSection(): string {
  return `## Full Context (usePluginContext)

For advanced use cases, use the full context.

\`\`\`typescript
const ctx = usePluginContext();

// Document (requires document:read)
ctx.document?.schema
ctx.document?.data
ctx.document?.errors
ctx.document?.isValid

// Actions (requires document:write)
ctx.actions?.updateValue(path, value)
ctx.actions?.addArrayItem(path, value?)
ctx.actions?.removeArrayItem(path, index)
ctx.actions?.addObjectProperty(path, key, value?)
ctx.actions?.removeObjectProperty(path, key)
ctx.actions?.setData(data)
ctx.actions?.resetData()

// Selection (requires selection:read / selection:write)
ctx.selection?.selectedPath
ctx.selection?.editingPath
ctx.selection?.setSelectedPath?(path)

// UI (requires ui:read / ui:write)
ctx.ui?.isDarkMode
ctx.ui?.viewMode
ctx.ui?.expandedPaths
ctx.ui?.toggleDarkMode?()
ctx.ui?.expandAll?()

// Events (requires events:emit / events:subscribe)
ctx.events?.emit(event, payload)
ctx.events?.subscribe(event, handler)

// Extensions (requires extensions:define / extensions:contribute)
ctx.extensions?.getExtensions<T>(pointId)
ctx.extensions?.defineExtensionPoint?(declaration)

// Services (requires services:provide / services:consume)
ctx.services?.get<T>(serviceId)
ctx.services?.register?(declaration)

// Storage (requires storage:local)
ctx.storage?.get<T>(key, defaultValue)
ctx.storage?.set<T>(key, value)
\`\`\`
`;
}

function generateTemplatesSection(): string {
  return `## Plugin Templates

### Minimal Plugin

\`\`\`typescript
import { definePlugin } from '@/core';

export default definePlugin({
  manifest: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    apiVersion: '1.0',
    activation: 'lazy',
    activationEvents: ['onSlot:sidebar:left'],
    capabilities: ['document:read'],
    slots: [
      { slot: 'sidebar:left', component: MyComponent, priority: 50 }
    ],
  },
});

function MyComponent() {
  const api = usePluginAPI();
  return <div>Data: {JSON.stringify(api.data)}</div>;
}
\`\`\`

### Extension Contributor

\`\`\`typescript
import { definePlugin } from '@/core';

export default definePlugin({
  manifest: {
    id: 'custom-renderer',
    name: 'Custom Renderer',
    version: '1.0.0',
    apiVersion: '1.0',
    activation: 'lazy',
    activationEvents: ['onExtensionPoint:tree-view.nodeRenderer'],
    capabilities: ['extensions:contribute'],
    extensions: [{
      point: 'tree-view.nodeRenderer',
      contribution: {
        nodeType: 'my-custom-type',
        component: CustomRenderer,
        priority: 100,
      },
    }],
  },
});

function CustomRenderer({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
\`\`\`

### Service Provider

\`\`\`typescript
import { definePlugin } from '@/core';

const myService = {
  doSomething: () => 'result',
};

export default definePlugin({
  manifest: {
    id: 'my-service',
    name: 'My Service',
    version: '1.0.0',
    apiVersion: '1.0',
    activation: 'eager',
    capabilities: ['services:provide'],
    provides: [{
      id: 'my-service',
      interface: 'IMyService',
      implementation: myService,
    }],
  },
});
\`\`\`

### Service Consumer

\`\`\`typescript
import { definePlugin, useService } from '@/core';

export default definePlugin({
  manifest: {
    id: 'consumer',
    name: 'Consumer',
    version: '1.0.0',
    apiVersion: '1.0',
    activation: 'lazy',
    activationEvents: ['onSlot:sidebar:right'],
    capabilities: ['services:consume'],
    consumes: ['my-service'],
    slots: [
      { slot: 'sidebar:right', component: ConsumerComponent }
    ],
  },
});

function ConsumerComponent() {
  const service = useService<IMyService>('my-service');
  
  if (!service) return <div>Loading service...</div>;
  
  return <div>{service.doSomething()}</div>;
}
\`\`\`
`;
}

function generateAntiPatternsSection(): string {
  return `## Anti-Patterns to Avoid

### ❌ Direct Plugin Imports

\`\`\`typescript
// BAD
import { TreeView } from '../tree-view/TreeView';

// GOOD - use extension points or services
const renderers = ctx.extensions?.getExtensions('tree-view.nodeRenderer');
\`\`\`

### ❌ Global State

\`\`\`typescript
// BAD
window.myData = data;

// GOOD
ctx.storage?.set('myData', data);
\`\`\`

### ❌ Undeclared Capabilities

\`\`\`typescript
// BAD - using actions without document:write capability
ctx.actions?.updateValue(path, value);

// GOOD - declare in manifest first
capabilities: ['document:write'],
\`\`\`

### ❌ Eager Activation

\`\`\`typescript
// BAD - loads immediately
activation: 'eager',

// GOOD - loads when needed
activation: 'lazy',
activationEvents: ['onSlot:sidebar:left'],
\`\`\`

### ❌ Blocking Operations

\`\`\`typescript
// BAD
const result = heavyComputation(); // Blocks UI

// GOOD
useEffect(() => {
  computeAsync().then(setResult);
}, []);
\`\`\`
`;
}

// ============================================================================
// Main Generator
// ============================================================================

function generateContextFile(): string {
  const sections = [
    '# SchemaEditor Plugin Development Context',
    '',
    'This file contains everything needed to develop plugins for SchemaEditor.',
    '',
    generateCapabilitiesSection(),
    generateSlotsSection(),
    generateEventsSection(),
    generateSimpleAPISection(),
    generateFullContextSection(),
    generateTemplatesSection(),
    generateAntiPatternsSection(),
  ];

  return sections.join('\n');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const content = generateContextFile();
  
  const outputDir = path.join(process.cwd(), '.cursor');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'plugin-context.md');
  fs.writeFileSync(outputPath, content);
  
  console.log(`✅ Generated context file: ${outputPath}`);
  console.log(`   ${content.split('\n').length} lines`);
  console.log(`   ${content.length} characters`);
}

main().catch(console.error);
