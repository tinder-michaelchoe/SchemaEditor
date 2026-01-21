/**
 * Plugin Playground
 * 
 * Interactive playground for testing and debugging plugins.
 */

import type { PluginDefinition, PluginContext } from '../../core/types';
import { manifest } from './manifest';
import { PlaygroundPanel } from './components/PlaygroundPanel';

// Event log storage
const eventLog: Array<{
  timestamp: number;
  type: string;
  data?: unknown;
  pluginId?: string;
}> = [];

const MAX_LOG_SIZE = 500;

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('Plugin Playground activated');
    
    // Subscribe to all events for logging
    const coreEvents = [
      'document:loaded',
      'document:changed',
      'document:saved',
      'selection:changed',
      'validation:complete',
      'plugin:activated',
      'plugin:deactivated',
    ];
    
    coreEvents.forEach(eventType => {
      context.events?.subscribe?.(eventType, (data) => {
        addToLog(eventType, data);
      });
    });
  },
  
  deactivate(): void {
    eventLog.length = 0;
  },
  
  components: {
    PlaygroundPanel,
  },
};

function addToLog(type: string, data?: unknown, pluginId?: string): void {
  eventLog.unshift({
    timestamp: Date.now(),
    type,
    data,
    pluginId,
  });
  
  // Keep log size bounded
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.pop();
  }
}

// Export for use by playground panel
export function getEventLog() {
  return [...eventLog];
}

export function clearEventLog() {
  eventLog.length = 0;
}

export { manifest };
export default { manifest, definition };
