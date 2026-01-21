/**
 * TreeView Plugin
 * 
 * Main entry point for the TreeView plugin.
 * This plugin provides the tree-based JSON editor interface.
 */

import type { PluginDefinition, PluginContext } from '../../core/types';
import { manifest } from './manifest';
import { TreeViewPanel } from './components/TreeViewPanel';

/**
 * Plugin definition with activation/deactivation lifecycle
 */
export const definition: PluginDefinition = {
  /**
   * Called when the plugin is activated
   */
  activate(context: PluginContext): void {
    context.log.info('TreeView plugin activated');
    
    // Define extension points programmatically if needed
    // (they're already declared in manifest, but we could add runtime validation here)
    
    // Subscribe to relevant events
    context.events?.subscribe?.('document:loaded', () => {
      context.log.debug('Document loaded, TreeView ready');
    });
    
    context.events?.subscribe?.('document:changed', (data) => {
      context.log.debug('Document changed', data);
    });
  },
  
  /**
   * Called when the plugin is deactivated
   */
  deactivate(): void {
    // Cleanup if needed
    console.log('[tree-view] Plugin deactivated');
  },
  
  /**
   * React components this plugin provides
   * These are referenced by name in the manifest's slot registrations
   */
  components: {
    TreeViewPanel,
  },
};

/**
 * Helper to create a complete plugin bundle
 */
export function createTreeViewPlugin() {
  return {
    manifest,
    definition,
  };
}

export { manifest };
export default { manifest, definition };
