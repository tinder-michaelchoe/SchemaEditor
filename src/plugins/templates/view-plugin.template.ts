/**
 * View Plugin Template
 * 
 * Use this template for plugins that add a main view or preview panel.
 * Copy this file and customize for your specific plugin.
 * 
 * Example use cases:
 * - Custom preview renderers
 * - Alternative editing views
 * - Visual editors
 * - Split views
 */

import type { PluginManifest, PluginDefinition, PluginContext } from '../../core/types';
import React from 'react';

// ============================================================================
// MANIFEST
// ============================================================================

/**
 * Plugin manifest - declares what the plugin does and needs
 */
export const manifest: PluginManifest = {
  id: 'my-view-plugin',
  version: '1.0.0',
  name: 'My View Plugin',
  description: 'Adds a custom view to the main area',
  
  capabilities: [
    'document:read',      // Read document data
    'document:write',     // Modify document (if editing)
    'selection:read',     // Read current selection
    'selection:write',    // Update selection
    'ui:slots',           // Render to UI slots
    'ui:theme',           // Access theme info
    'events:subscribe',   // Listen for document changes
    'events:emit',        // Emit view events
  ],
  
  // Activate when the view is opened
  activationEvents: ['onView:my-view-plugin'],
  
  // Render to main view slot
  slots: [
    {
      slot: 'main:view',
      component: 'MainView',
      priority: 50, // Lower than tree-view (100) to be secondary
    },
  ],
  
  // Events this plugin emits
  emits: [
    'my-view-plugin:item-selected',
    'my-view-plugin:item-changed',
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * The main view component
 * 
 * This is a full-size view that renders in the main content area.
 */
function MainView() {
  // Hooks
  // import { usePluginAPI } from '../../core/hooks';
  // import { usePluginContext } from '../../core/hooks';
  
  // const api = usePluginAPI();
  // const ctx = usePluginContext();
  
  // State
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Example: Subscribe to document changes
  // React.useEffect(() => {
  //   const unsubscribe = api.on('document:changed', (data) => {
  //     // Handle document change
  //   });
  //   return () => unsubscribe();
  // }, []);
  
  // Example: Handle item selection
  // const handleSelect = (path: string) => {
  //   api.setSelectedPath(path);
  //   api.emit('my-view-plugin:item-selected', { path });
  // };
  
  // Example: Handle value change
  // const handleChange = (path: string, value: unknown) => {
  //   const success = api.setValueAtPath(path, value);
  //   if (success) {
  //     api.emit('my-view-plugin:item-changed', { path, value });
  //   }
  // };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]" />
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">My Custom View</h2>
        
        {/* Your view content here */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
          <p className="text-[var(--text-secondary)]">
            Customize this view for your needs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEFINITION
// ============================================================================

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('View plugin activated');
    
    // Subscribe to relevant events
    context.events?.subscribe?.('document:loaded', () => {
      context.log.debug('Document loaded, view ready');
    });
  },
  
  deactivate(): void {
    // Cleanup
  },
  
  components: {
    MainView,
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default { manifest, definition };
