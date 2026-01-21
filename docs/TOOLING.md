# Tooling Guide

This guide covers the development tools available for plugin development, with a focus on tools designed to support LLM-assisted development.

---

## Table of Contents

1. [Overview](#overview)
2. [Plugin Scaffolding CLI](#plugin-scaffolding-cli)
3. [Plugin Validator](#plugin-validator)
4. [Static Analysis](#static-analysis)
5. [Context Generator](#context-generator)
6. [Test Harness](#test-harness)
7. [LLM Development Guidelines](#llm-development-guidelines)

---

## Overview

The Schema Editor provides several tools to support plugin development:

| Tool | Purpose | Command |
|------|---------|---------|
| `create-plugin` | Scaffold new plugins | `npm run create-plugin` |
| `validate-plugin` | Validate plugin manifests | `npm run validate-plugin` |
| `analyze-plugin` | Static code analysis | `npx ts-node scripts/analyze-plugin.ts` |
| `generate-context` | Generate LLM context | `npm run generate-context` |

---

## Plugin Scaffolding CLI

The `create-plugin` CLI generates plugin boilerplate from templates.

### Usage

```bash
npm run create-plugin <plugin-name> [--template=<type>]
```

### Templates

| Template | Description | Use When |
|----------|-------------|----------|
| `sidebar` | Panel in the sidebar | Adding property inspectors, tools, navigation |
| `view` | Main content view | Creating custom editors, previews |
| `service` | Background service | Providing functionality to other plugins |
| `extension-contributor` | Extension contributions | Adding to existing plugins |

### Examples

```bash
# Create a sidebar plugin
npm run create-plugin style-inspector --template=sidebar

# Create a view plugin
npm run create-plugin markdown-preview --template=view

# Create a service plugin
npm run create-plugin validation-service --template=service
```

### Generated Structure

```
src/plugins/my-plugin/
├── manifest.ts          # Plugin manifest
├── index.ts             # Entry point with definition
└── components/          # React components (if UI plugin)
    └── SidebarPanel.tsx # or MainView.tsx
```

---

## Plugin Validator

The `validate-plugin` CLI validates plugin manifests against the schema.

### Usage

```bash
npm run validate-plugin <plugin-path>
```

### What It Validates

- **Required fields**: id, version, name, description, capabilities, activationEvents
- **Capability declarations**: Valid capability names
- **Slot registrations**: Valid slot names, component references
- **Extension points**: Valid schemas
- **Semantic versioning**: Valid semver format
- **Dependency declarations**: Valid plugin IDs

### Example Output

```
🔍 Validating plugin: src/plugins/my-plugin

✅ Manifest validation passed
✅ Component references valid
✅ Capability declarations valid
⚠️ Warning: Event 'custom:event' emitted but not declared in manifest.emits
❌ Error: Extension point 'invalid.point' references non-existent schema property

Validation: FAILED (1 error, 1 warning)
```

### Integration with CI

```yaml
# In your CI pipeline
- name: Validate plugins
  run: |
    for plugin in src/plugins/*/; do
      npm run validate-plugin "$plugin" || exit 1
    done
```

---

## Static Analysis

The `analyze-plugin` script performs static code analysis to detect common mistakes.

### Usage

```bash
npx ts-node scripts/analyze-plugin.ts <plugin-path> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON |
| `--strict` | Fail on warnings (not just errors) |

### Rules Detected

| Rule | Severity | Description |
|------|----------|-------------|
| `no-direct-store-import` | Warning | Direct store imports bypass plugin system |
| `no-global-state` | Error | Global state mutations cause conflicts |
| `no-cross-plugin-import` | Error | Direct imports between plugins |
| `check-capability-before-use` | Warning | Missing capability checks |
| `use-context-logger` | Info | Using console instead of context.log |
| `cleanup-subscriptions` | Warning | Missing useEffect cleanup |
| `explicit-types` | Info | Using explicit `any` type |

### Example Output

```
📊 Static Analysis Report
──────────────────────────────────────────────────
Plugin: src/plugins/my-plugin

🔴 Errors (1)
──────────────────────────────
❌ src/plugins/my-plugin/index.ts:15:1
   Direct imports between plugins create tight coupling.
   Rule: no-cross-plugin-import
   💡 Use extension points or services for plugin communication

🟡 Warnings (2)
──────────────────────────────
⚠️ src/plugins/my-plugin/components/Panel.tsx:23:5
   Event subscription in useEffect may not be cleaned up.
   Rule: cleanup-subscriptions
   💡 Return unsubscribe function from useEffect

──────────────────────────────────────────────────
Summary: 1 errors, 2 warnings, 0 info
```

---

## Context Generator

The `generate-context` script creates a comprehensive context file for LLM consumption.

### Usage

```bash
npm run generate-context [output-file]
```

### What It Generates

The output file contains:

1. **Architecture Overview**: High-level system description
2. **Capabilities List**: All available capabilities with descriptions
3. **UI Slots**: Available slots and their purposes
4. **Extension Points**: Defined extension points with schemas
5. **Services**: Available services with interfaces
6. **Event Types**: Core and plugin events
7. **Example Plugins**: Complete working examples

### Output Format

```markdown
# Schema Editor Plugin Development Context

## Architecture
[Description of plugin architecture...]

## Available Capabilities
- document:read - Read document data and schema
- document:write - Modify document content
[...]

## UI Slots
- sidebar:left - Left sidebar panel
- main:view - Primary content area
[...]

## Extension Points
### tree-view.nodeRenderer
Custom renderers for tree nodes.
Schema: { nodeType: string, component: Component }
[...]

## Available Services
### style-resolver
Resolves style IDs to definitions.
Interface: StyleResolver
[...]

## Example: Sidebar Plugin
[Complete working example...]
```

### Using with LLMs

Include the generated context in your LLM prompt:

```
I'm developing a plugin for the Schema Editor. Here's the context:

[paste generated-context.md]

I want to create a plugin that [description]. Please provide:
1. The manifest
2. The main component
3. The entry point
```

---

## Test Harness

The test harness provides utilities for testing plugins in isolation.

### Components

| Component | Purpose |
|-----------|---------|
| `createMockContext` | Creates mock PluginContext |
| `createMockEventBus` | Creates mock event bus |
| `createMockStore` | Creates mock Zustand stores |
| `createPluginTestHarness` | Complete test environment |
| `renderWithPluginContext` | React testing with context |

### Basic Usage

```typescript
import { createPluginTestHarness } from '@/core/testing';
import { manifest, definition } from './my-plugin';

describe('My Plugin', () => {
  let harness: PluginTestHarness;
  
  beforeEach(() => {
    harness = createPluginTestHarness({
      manifest,
      definition,
    });
  });
  
  afterEach(() => {
    harness.reset();
  });
  
  it('should activate successfully', async () => {
    await harness.activate();
    expect(harness.isActive()).toBe(true);
  });
  
  it('should emit events', async () => {
    await harness.activate();
    // Trigger action...
    harness.assertEventEmitted('my-plugin:event');
  });
  
  it('should execute actions', async () => {
    await harness.activate();
    // Trigger action...
    harness.assertActionExecuted('setValueAtPath', 'user.name');
  });
});
```

### Testing Components

```typescript
import { renderWithPluginContext } from '@/core/testing';
import { MyPanel } from './components/MyPanel';

describe('MyPanel', () => {
  it('should render with document data', () => {
    const { context, container } = renderWithPluginContext(
      <MyPanel />,
      {
        capabilities: ['document:read'],
        documentData: { name: 'Test' },
      }
    );
    
    expect(container.textContent).toContain('Test');
  });
});
```

---

## LLM Development Guidelines

### .cursorrules Integration

The `.cursorrules` file provides guidelines for AI assistants:

```markdown
# Plugin Development Rules

## Creating a New Plugin
1. Always use scaffolding CLI or templates
2. Declare ALL capabilities you use in manifest
3. Use usePluginAPI() for simple cases
4. Every plugin must have lazy activation unless core

## Common Patterns
[Templates for common operations...]

## Anti-Patterns to Avoid
- ❌ Don't import from other plugins directly
- ❌ Don't use global state outside plugin system
- ❌ Don't emit events not declared in manifest
```

### Best Practices for LLM-Generated Plugins

1. **Start with scaffolding**: Use `create-plugin` to get proper structure
2. **Validate early**: Run `validate-plugin` after generating manifest
3. **Analyze code**: Run `analyze-plugin` before committing
4. **Generate context**: Include context file in LLM prompts
5. **Test thoroughly**: Use test harness to verify behavior

### Workflow for LLM Development

```bash
# 1. Generate context for the LLM
npm run generate-context

# 2. Create plugin scaffold
npm run create-plugin my-new-feature --template=sidebar

# 3. Have LLM implement the plugin
# (paste context + requirements)

# 4. Validate the manifest
npm run validate-plugin src/plugins/my-new-feature

# 5. Run static analysis
npx ts-node scripts/analyze-plugin.ts src/plugins/my-new-feature

# 6. Run tests
npm run test:core

# 7. Fix any issues and iterate
```

### Example LLM Prompt

```
I need to create a Schema Editor plugin that:
- Shows a property inspector in the right sidebar
- Displays the type and constraints of the selected node
- Allows editing string/number constraints

Requirements:
- Use the sidebar template
- Only request capabilities actually needed
- Follow the patterns in .cursorrules

Here's the plugin development context:
[paste generated-context.md]
```

---

## Package.json Scripts

All tooling scripts available:

```json
{
  "scripts": {
    "create-plugin": "npx ts-node scripts/create-plugin.ts",
    "validate-plugin": "npx ts-node scripts/validate-plugin.ts",
    "generate-context": "npx ts-node scripts/generate-context.ts",
    "test:core": "vitest run src/core/__tests__",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## See Also

- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) - How to create plugins
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design
