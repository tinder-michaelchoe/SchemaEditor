/**
 * Preview Plugin
 * 
 * Provides live device preview of CLADS documents.
 */

import type { PluginDefinition, PluginContext } from '../../core/types';
import { manifest } from './manifest';
import { PreviewPanel } from './components/PreviewPanel';

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('Preview plugin activated');
    
    // Subscribe to document changes to trigger re-renders
    context.events?.subscribe?.('document:changed', (data) => {
      context.log.debug('Document changed, preview will update', data);
    });
  },
  
  deactivate(): void {
    // Cleanup if needed
  },
  
  components: {
    PreviewPanel,
  },
};

export { manifest };
export default { manifest, definition };
