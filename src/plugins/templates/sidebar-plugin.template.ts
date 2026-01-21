/**
 * Sidebar Plugin Template
 * 
 * Use this template for plugins that add a panel to the sidebar.
 * Copy this file and customize for your specific plugin.
 * 
 * Example use cases:
 * - Property inspector panels
 * - Navigation/outline views
 * - Tool palettes
 * - Help/documentation panels
 */

import type { PluginManifest, PluginDefinition, PluginContext } from '../../core/types';
import React from 'react';

// ============================================================================
// MANIFEST
// ============================================================================

/**
 * Plugin manifest - declares what the plugin does and needs
 * 
 * Customize:
 * - id: Unique identifier (use your-company.plugin-name format)
 * - name/description: Human-readable info
 * - capabilities: What permissions you need
 * - slots: Where your UI renders
 */
export const manifest: PluginManifest = {
  id: 'my-sidebar-plugin',
  version: '1.0.0',
  name: 'My Sidebar Plugin',
  description: 'Adds a custom panel to the sidebar',
  
  // Request the capabilities you need
  capabilities: [
    'document:read',      // Read document data
    'selection:read',     // Read current selection
    'ui:slots',           // Render to UI slots
    'ui:theme',           // Access theme info
    // Add more as needed:
    // 'document:write',   // Modify document
    // 'events:emit',      // Emit events
    // 'events:subscribe', // Subscribe to events
  ],
  
  // Activate on startup or on-demand
  activationEvents: ['onStartup'],
  // Or lazy: ['onView:my-sidebar-plugin']
  
  // Render to sidebar slot
  slots: [
    {
      slot: 'sidebar:left',
      component: 'SidebarPanel',
      priority: 50, // Adjust to control order
    },
  ],
  
  // Optional: Events this plugin emits
  emits: [
    // 'my-sidebar-plugin:item-selected',
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * The sidebar panel component
 * 
 * This is a React component that renders in the sidebar.
 * Use the plugin API hooks to access the document and selection.
 */
function SidebarPanel() {
  // Access the plugin API for simple operations
  // import { usePluginAPI } from '../../core/hooks';
  // const api = usePluginAPI();
  
  // Or use full context for advanced operations
  // import { usePluginContext } from '../../core/hooks';
  // const ctx = usePluginContext();
  
  // Example: Read document data
  // const doc = api.getDocument();
  
  // Example: Read selection
  // const selectedPath = api.getSelectedPath();
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">My Sidebar Panel</h3>
      
      {/* Your content here */}
      <div className="space-y-2">
        <p className="text-sm text-[var(--text-secondary)]">
          Customize this panel for your needs.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// DEFINITION
// ============================================================================

/**
 * Plugin definition - contains runtime implementation
 */
export const definition: PluginDefinition = {
  /**
   * Called when the plugin is activated
   */
  activate(context: PluginContext): void {
    context.log.info('Sidebar plugin activated');
    
    // Optional: Subscribe to events
    // context.events?.subscribe?.('document:changed', (data) => {
    //   context.log.debug('Document changed', data);
    // });
    
    // Optional: Provide a service
    // context.services?.provide?.('my-service', myServiceImpl);
  },
  
  /**
   * Called when the plugin is deactivated
   */
  deactivate(): void {
    // Cleanup resources if needed
  },
  
  /**
   * Components this plugin provides
   */
  components: {
    SidebarPanel,
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default { manifest, definition };
