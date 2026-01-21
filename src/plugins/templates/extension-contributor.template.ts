/**
 * Extension Contributor Plugin Template
 * 
 * Use this template for plugins that contribute to extension points
 * defined by other plugins (like custom node renderers for tree-view).
 * 
 * Example use cases:
 * - Custom node renderers for specific types
 * - Additional context menu items
 * - Custom toolbar buttons
 * - New settings sections
 */

import type { PluginManifest, PluginDefinition, PluginContext } from '../../core/types';
import React from 'react';

// ============================================================================
// CUSTOM COMPONENTS
// ============================================================================

/**
 * Example: Custom node renderer for date values
 * 
 * This would be contributed to the 'tree-view.nodeRenderer' extension point.
 */
interface DateNodeProps {
  node: {
    path: string;
    value: unknown;
    schema: unknown;
  };
  onChange: (value: unknown) => void;
}

function DateNodeRenderer({ node, onChange }: DateNodeProps) {
  const dateValue = node.value as string;
  
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dateValue || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)]"
      />
    </div>
  );
}

/**
 * Example: Custom node renderer for color values
 */
interface ColorNodeProps {
  node: {
    path: string;
    value: unknown;
    schema: unknown;
  };
  onChange: (value: unknown) => void;
}

function ColorNodeRenderer({ node, onChange }: ColorNodeProps) {
  const colorValue = node.value as string;
  
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={colorValue || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer"
      />
      <span className="text-sm font-mono text-[var(--text-secondary)]">
        {colorValue}
      </span>
    </div>
  );
}

// ============================================================================
// EXTENSION HANDLERS
// ============================================================================

/**
 * Example: Context menu item handler
 */
function handleCopyPath(node: { path: string }) {
  navigator.clipboard.writeText(node.path);
}

/**
 * Example: Toolbar button handler
 */
function handleExpandAll() {
  console.log('Expand all clicked');
}

// ============================================================================
// MANIFEST
// ============================================================================

export const manifest: PluginManifest = {
  id: 'my-extension-contributor',
  version: '1.0.0',
  name: 'Custom Extensions',
  description: 'Adds custom node renderers and menu items',
  
  capabilities: [
    'extensions:contribute',  // Required to contribute extensions
    'document:read',          // If components need document access
    // 'document:write',      // If components modify data
    // 'ui:notifications',    // If showing notifications
  ],
  
  // Activate on startup to register extensions early
  activationEvents: ['onStartup'],
  
  // Extensions this plugin contributes to other plugins
  extensions: [
    // Custom node renderer for date type
    {
      point: 'tree-view.nodeRenderer',
      id: 'date-renderer',
      contribution: {
        nodeType: 'date',
        priority: 100,
        component: 'DateNodeRenderer',
      },
    },
    
    // Custom node renderer for color type
    {
      point: 'tree-view.nodeRenderer',
      id: 'color-renderer',
      contribution: {
        nodeType: 'color',
        priority: 100,
        component: 'ColorNodeRenderer',
      },
    },
    
    // Context menu item
    {
      point: 'tree-view.contextMenu',
      id: 'copy-path',
      contribution: {
        id: 'copy-path',
        label: 'Copy Path',
        icon: 'copy',
        order: 10,
        handler: 'handleCopyPath',
      },
    },
    
    // Toolbar button
    {
      point: 'tree-view.toolbar',
      id: 'expand-all',
      contribution: {
        id: 'expand-all',
        icon: 'expand',
        tooltip: 'Expand All Nodes',
        order: 100,
        handler: 'handleExpandAll',
      },
    },
  ],
  
  // No direct UI slots - we contribute to others' extension points
  slots: [],
};

// ============================================================================
// DEFINITION
// ============================================================================

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('Extension contributor plugin activated');
    
    // Extensions declared in manifest are automatically registered
    // But you can also register them programmatically:
    
    // context.extensions?.contribute?.('tree-view.nodeRenderer', {
    //   nodeType: 'custom-type',
    //   priority: 50,
    //   component: CustomComponent,
    // });
  },
  
  deactivate(): void {
    // Cleanup if needed
  },
  
  // Components referenced in extension contributions
  components: {
    DateNodeRenderer,
    ColorNodeRenderer,
  },
  
  // Extension implementations (handlers referenced by name)
  extensionImplementations: {
    handleCopyPath,
    handleExpandAll,
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default { manifest, definition };
