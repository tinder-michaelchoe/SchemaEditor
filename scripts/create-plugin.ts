#!/usr/bin/env node
/**
 * Plugin Scaffolding CLI
 * 
 * Creates new plugins from templates with proper structure and boilerplate.
 * 
 * Usage:
 *   npx ts-node scripts/create-plugin.ts <plugin-name> [--template=<type>]
 * 
 * Templates:
 *   - sidebar (default): Adds a panel to the sidebar
 *   - view: Adds a main content view
 *   - service: Provides a service for other plugins
 *   - extension-contributor: Contributes to extension points
 * 
 * Examples:
 *   npx ts-node scripts/create-plugin.ts my-awesome-plugin
 *   npx ts-node scripts/create-plugin.ts style-inspector --template=sidebar
 *   npx ts-node scripts/create-plugin.ts custom-preview --template=view
 *   npx ts-node scripts/create-plugin.ts validation-service --template=service
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

type TemplateType = 'sidebar' | 'view' | 'service' | 'extension-contributor';

interface PluginConfig {
  name: string;
  id: string;
  template: TemplateType;
  outputDir: string;
}

interface TemplateInfo {
  name: string;
  description: string;
  capabilities: string[];
  hasUI: boolean;
  slot?: string;
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

const templates: Record<TemplateType, TemplateInfo> = {
  sidebar: {
    name: 'Sidebar Plugin',
    description: 'Adds a panel to the sidebar',
    capabilities: ['document:read', 'selection:read', 'ui:slots', 'ui:theme'],
    hasUI: true,
    slot: 'sidebar:left',
  },
  view: {
    name: 'View Plugin',
    description: 'Adds a main content view',
    capabilities: ['document:read', 'document:write', 'selection:read', 'selection:write', 'ui:slots', 'events:subscribe', 'events:emit'],
    hasUI: true,
    slot: 'main:view',
  },
  service: {
    name: 'Service Plugin',
    description: 'Provides a service for other plugins',
    capabilities: ['services:provide'],
    hasUI: false,
  },
  'extension-contributor': {
    name: 'Extension Contributor',
    description: 'Contributes to extension points',
    capabilities: ['extensions:contribute', 'document:read'],
    hasUI: false,
  },
};

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

function generateManifest(config: PluginConfig, info: TemplateInfo): string {
  const { id, name, template } = config;
  const displayName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  let slotsSection = '';
  if (info.slot) {
    slotsSection = `
  // UI slot registrations
  slots: [
    {
      slot: '${info.slot}',
      component: '${template === 'sidebar' ? 'SidebarPanel' : 'MainView'}',
      priority: 50,
    },
  ],`;
  }
  
  let providesSection = '';
  if (template === 'service') {
    providesSection = `
  // Services this plugin provides
  provides: [
    {
      id: '${id}-service',
      description: 'Service provided by ${displayName}',
    },
  ],`;
  }
  
  let extensionsSection = '';
  if (template === 'extension-contributor') {
    extensionsSection = `
  // Extensions this plugin contributes
  extensions: [
    // Add your extension contributions here
    // {
    //   point: 'tree-view.nodeRenderer',
    //   id: 'custom-renderer',
    //   contribution: { nodeType: 'custom', component: 'CustomRenderer' },
    // },
  ],`;
  }
  
  return `/**
 * ${displayName} Plugin Manifest
 * 
 * ${info.description}
 */

import type { PluginManifest } from '../../core/types';

export const manifest: PluginManifest = {
  id: '${id}',
  version: '1.0.0',
  name: '${displayName}',
  description: '${info.description}',
  
  capabilities: [
    ${info.capabilities.map(c => `'${c}'`).join(',\n    ')},
  ],
  
  activationEvents: ['${template === 'service' ? `onService:${id}-service` : 'onStartup'}'],
${slotsSection}${providesSection}${extensionsSection}
  // Events this plugin emits
  emits: [
    // '${id}:custom-event',
  ],
};

export default manifest;
`;
}

function generateIndex(config: PluginConfig, info: TemplateInfo): string {
  const { id, name, template } = config;
  const displayName = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  let imports = `import type { PluginDefinition, PluginContext } from '../../core/types';
import { manifest } from './manifest';`;
  
  let componentImport = '';
  let componentsSection = 'components: {},';
  
  if (info.hasUI) {
    const componentName = template === 'sidebar' ? 'SidebarPanel' : 'MainView';
    componentImport = `import { ${componentName} } from './components/${componentName}';`;
    componentsSection = `components: {
    ${componentName},
  },`;
  }
  
  let serviceSection = '';
  if (template === 'service') {
    serviceSection = `
    // Register the service
    context.services?.provide?.('${id}-service', createService(context));`;
  }
  
  return `/**
 * ${displayName} Plugin
 * 
 * ${info.description}
 */

${imports}
${componentImport}

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('${displayName} plugin activated');
    ${serviceSection}
    // Add your activation logic here
  },
  
  deactivate(): void {
    // Cleanup resources
  },
  
  ${componentsSection}
};
${template === 'service' ? `
// Service factory
function createService(context: PluginContext) {
  return {
    // Add your service methods here
    doSomething(input: unknown): unknown {
      context.log.debug('doSomething called', input);
      return input;
    },
  };
}
` : ''}
export { manifest };
export default { manifest, definition };
`;
}

function generateSidebarComponent(config: PluginConfig): string {
  const displayName = config.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return `/**
 * ${displayName} Sidebar Panel
 */

import React from 'react';
import { usePluginAPI } from '../../../core/hooks/usePluginAPI';

export function SidebarPanel() {
  const api = usePluginAPI();
  
  // Example: Get document and selection
  const doc = api.getDocument();
  const selectedPath = api.getSelectedPath();
  
  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-lg font-semibold mb-4">${displayName}</h3>
      
      <div className="space-y-4">
        {selectedPath ? (
          <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-sm text-[var(--text-secondary)]">Selected:</p>
            <p className="font-mono text-sm">{selectedPath}</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">
            Select a node to see details
          </p>
        )}
      </div>
    </div>
  );
}

export default SidebarPanel;
`;
}

function generateViewComponent(config: PluginConfig): string {
  const displayName = config.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return `/**
 * ${displayName} Main View
 */

import React from 'react';
import { usePluginAPI } from '../../../core/hooks/usePluginAPI';

export function MainView() {
  const api = usePluginAPI();
  
  // Example: Get document
  const doc = api.getDocument();
  
  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">${displayName}</h2>
        
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
          <p className="text-[var(--text-secondary)] mb-4">
            Your custom view content goes here.
          </p>
          
          {doc && (
            <pre className="text-sm font-mono bg-[var(--bg-tertiary)] p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(doc, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainView;
`;
}

// ============================================================================
// FILE GENERATION
// ============================================================================

function createPluginFiles(config: PluginConfig): void {
  const info = templates[config.template];
  const pluginDir = path.join(config.outputDir, config.id);
  
  // Create directories
  fs.mkdirSync(pluginDir, { recursive: true });
  if (info.hasUI) {
    fs.mkdirSync(path.join(pluginDir, 'components'), { recursive: true });
  }
  
  // Generate files
  const files: Array<{ path: string; content: string }> = [
    { path: path.join(pluginDir, 'manifest.ts'), content: generateManifest(config, info) },
    { path: path.join(pluginDir, 'index.ts'), content: generateIndex(config, info) },
  ];
  
  // Add component files
  if (config.template === 'sidebar') {
    files.push({
      path: path.join(pluginDir, 'components', 'SidebarPanel.tsx'),
      content: generateSidebarComponent(config),
    });
  } else if (config.template === 'view') {
    files.push({
      path: path.join(pluginDir, 'components', 'MainView.tsx'),
      content: generateViewComponent(config),
    });
  }
  
  // Write files
  for (const file of files) {
    fs.writeFileSync(file.path, file.content, 'utf-8');
    console.log(`  Created: ${path.relative(process.cwd(), file.path)}`);
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): PluginConfig | null {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Plugin Scaffolding CLI

Usage:
  npx ts-node scripts/create-plugin.ts <plugin-name> [options]

Options:
  --template=<type>  Template to use (default: sidebar)
                     Types: sidebar, view, service, extension-contributor
  --help, -h         Show this help message

Examples:
  npx ts-node scripts/create-plugin.ts my-plugin
  npx ts-node scripts/create-plugin.ts style-inspector --template=sidebar
  npx ts-node scripts/create-plugin.ts custom-preview --template=view
  npx ts-node scripts/create-plugin.ts validation-service --template=service
`);
    return null;
  }
  
  const name = args[0];
  if (!name || name.startsWith('--')) {
    console.error('Error: Plugin name is required');
    return null;
  }
  
  // Validate name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Error: Plugin name must start with a letter and contain only lowercase letters, numbers, and hyphens');
    return null;
  }
  
  // Parse template option
  let template: TemplateType = 'sidebar';
  const templateArg = args.find(a => a.startsWith('--template='));
  if (templateArg) {
    const value = templateArg.split('=')[1] as TemplateType;
    if (!templates[value]) {
      console.error(`Error: Invalid template "${value}". Valid templates: ${Object.keys(templates).join(', ')}`);
      return null;
    }
    template = value;
  }
  
  return {
    name,
    id: name,
    template,
    outputDir: path.join(process.cwd(), 'src', 'plugins'),
  };
}

function main(): void {
  console.log('🔌 Plugin Scaffolding CLI\n');
  
  const config = parseArgs();
  if (!config) {
    process.exit(1);
  }
  
  const pluginDir = path.join(config.outputDir, config.id);
  
  // Check if plugin already exists
  if (fs.existsSync(pluginDir)) {
    console.error(`Error: Plugin directory already exists: ${pluginDir}`);
    process.exit(1);
  }
  
  const info = templates[config.template];
  console.log(`Creating ${info.name} plugin: ${config.name}`);
  console.log(`Template: ${config.template}`);
  console.log(`Output: ${pluginDir}\n`);
  
  try {
    createPluginFiles(config);
    
    console.log(`
✅ Plugin created successfully!

Next steps:
  1. cd src/plugins/${config.id}
  2. Customize the manifest and implementation
  3. Register your plugin in the app
  4. Run tests: npm run test:core

Documentation:
  - Plugin Development Guide: docs/PLUGIN_DEVELOPMENT.md
  - API Reference: docs/API_REFERENCE.md
`);
  } catch (error) {
    console.error('Error creating plugin:', error);
    process.exit(1);
  }
}

main();
