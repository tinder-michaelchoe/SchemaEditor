/**
 * TreeView Plugin Manifest
 * 
 * This plugin provides the main tree-based editor view for JSON documents.
 * It renders JSON data as an editable tree structure based on a JSON Schema.
 */

import type { PluginManifest } from '../../core/types';

export const manifest: PluginManifest = {
  id: 'tree-view',
  version: '1.0.0',
  name: 'Tree View',
  description: 'Displays and edits JSON documents as an interactive tree structure',
  
  // Capabilities this plugin requires
  capabilities: [
    'document:read',      // Read the document data and schema
    'document:write',     // Modify document values
    'selection:read',     // Read current selection
    'selection:write',    // Update selection
    'ui:slots',           // Render to UI slots
    'ui:theme',           // Access theme information
    'events:emit',        // Emit events for other plugins
    'events:subscribe',   // Subscribe to document events
    'extensions:provide', // Define extension points
  ],
  
  // This is a core plugin, activates on startup
  activationEvents: ['*'],
  
  // UI slot registrations
  slots: [
    {
      slot: 'main:view',
      component: 'TreeViewPanel',
      priority: 100, // High priority - primary view
    },
  ],
  
  // Extension points this plugin offers
  extensionPoints: [
    {
      id: 'tree-view.nodeRenderer',
      description: 'Custom renderers for specific node types in the tree',
      schema: {
        type: 'object',
        properties: {
          nodeType: {
            type: 'string',
            description: 'The JSON Schema type or custom type identifier to render',
          },
          priority: {
            type: 'number',
            description: 'Higher priority renderers are tried first (default: 0)',
          },
          component: {
            type: 'unknown',
            description: 'React component to render the node',
          },
        },
        required: ['nodeType', 'component'],
      },
    },
    {
      id: 'tree-view.contextMenu',
      description: 'Context menu items for tree nodes',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the menu item',
          },
          label: {
            type: 'string',
            description: 'Display label for the menu item',
          },
          icon: {
            type: 'string',
            description: 'Optional icon name',
          },
          order: {
            type: 'number',
            description: 'Position in the menu (lower = earlier)',
          },
          condition: {
            type: 'string',
            description: 'Condition when to show (e.g., "nodeType:array")',
          },
          handler: {
            type: 'unknown',
            description: 'Function to execute when item is clicked',
          },
        },
        required: ['id', 'label', 'handler'],
      },
    },
    {
      id: 'tree-view.toolbar',
      description: 'Toolbar items for the tree view header',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the toolbar item',
          },
          icon: {
            type: 'string',
            description: 'Icon name from lucide-react',
          },
          tooltip: {
            type: 'string',
            description: 'Tooltip text',
          },
          order: {
            type: 'number',
            description: 'Position in toolbar (lower = earlier)',
          },
          handler: {
            type: 'unknown',
            description: 'Click handler function',
          },
        },
        required: ['id', 'icon', 'handler'],
      },
    },
  ],
  
  // Events this plugin emits
  emits: [
    'tree-view:node-selected',
    'tree-view:node-expanded',
    'tree-view:node-collapsed',
    'tree-view:value-changed',
  ],
  
  // Dependencies (none for this core plugin)
  dependencies: [],
};

export default manifest;
