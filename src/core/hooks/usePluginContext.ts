/**
 * usePluginContext Hook
 * 
 * Provides access to the full Plugin Context.
 * Use this for advanced use cases that need extension points, services, etc.
 */

import { createContext, useContext } from 'react';
import type { PluginContext } from '../types/plugin';

// ============================================================================
// Context
// ============================================================================

/**
 * Context for the full plugin context
 */
export const PluginContextContext = createContext<PluginContext | null>(null);

// ============================================================================
// Hook
// ============================================================================

/**
 * Access the full Plugin Context
 * 
 * Use this for advanced use cases. For simple cases, prefer usePluginAPI().
 * 
 * @example
 * ```tsx
 * function MyAdvancedPlugin() {
 *   const ctx = usePluginContext();
 *   
 *   // Get all node renderers from extension point
 *   const renderers = ctx.extensions?.getExtensions('tree-view.nodeRenderer');
 *   
 *   // Use a service
 *   const styleResolver = ctx.services?.get('style-resolver');
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePluginContext(): PluginContext {
  const context = useContext(PluginContextContext);
  
  if (!context) {
    throw new Error(
      'usePluginContext must be used within a plugin context. ' +
      'Make sure your component is wrapped in PluginContextContext.Provider.'
    );
  }
  
  return context;
}

/**
 * Access the full Plugin Context (nullable version)
 * Returns null if not in a plugin context
 */
export function usePluginContextOptional(): PluginContext | null {
  return useContext(PluginContextContext);
}
