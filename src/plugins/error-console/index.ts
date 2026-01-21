/**
 * Error Console Plugin
 * 
 * Displays validation errors in a console-like panel.
 */

import type { PluginDefinition, PluginContext } from '../../core/types';
import { manifest } from './manifest';
import { ErrorConsolePanel } from './components/ErrorConsolePanel';

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('Error Console plugin activated');
    
    // Subscribe to validation events
    context.events?.subscribe?.('validation:complete', (data) => {
      const result = data as { errorCount: number };
      if (result.errorCount > 0) {
        context.log.debug(`Validation completed with ${result.errorCount} errors`);
      }
    });
  },
  
  deactivate(): void {
    // Cleanup if needed
  },
  
  components: {
    ErrorConsolePanel,
  },
};

export { manifest };
export default { manifest, definition };
