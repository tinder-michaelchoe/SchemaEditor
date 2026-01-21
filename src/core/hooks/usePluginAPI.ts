/**
 * usePluginAPI Hook
 * 
 * Provides access to the simplified Plugin API.
 * This is the recommended hook for most plugin use cases.
 */

import { createContext, useContext } from 'react';
import type { SimplePluginAPI } from '../SimpleAPI';
import { simpleAPIFactory } from '../SimpleAPI';

// ============================================================================
// Context
// ============================================================================

/**
 * Context for the current plugin ID
 */
export const PluginIdContext = createContext<string | null>(null);

// ============================================================================
// Hook
// ============================================================================

/**
 * Access the Simple Plugin API
 * 
 * @example
 * ```tsx
 * function MyPlugin() {
 *   const api = usePluginAPI();
 *   
 *   const handleClick = () => {
 *     api.setValue('root.title', 'Hello World');
 *     api.notify('Value updated!', 'success');
 *   };
 *   
 *   return <button onClick={handleClick}>Update Title</button>;
 * }
 * ```
 */
export function usePluginAPI(): SimplePluginAPI {
  const pluginId = useContext(PluginIdContext);
  
  if (!pluginId) {
    throw new Error(
      'usePluginAPI must be used within a plugin context. ' +
      'Make sure your component is wrapped in PluginIdContext.Provider.'
    );
  }
  
  return simpleAPIFactory.create(pluginId);
}

/**
 * Get the current plugin ID
 */
export function usePluginId(): string {
  const pluginId = useContext(PluginIdContext);
  
  if (!pluginId) {
    throw new Error(
      'usePluginId must be used within a plugin context. ' +
      'Make sure your component is wrapped in PluginIdContext.Provider.'
    );
  }
  
  return pluginId;
}
