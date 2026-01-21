/**
 * useExtensions Hook
 * 
 * Provides access to extension point contributions.
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import { extensionRegistry } from '../ExtensionRegistry';
import type { RegisteredContribution } from '../types/extensions';

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get all contributions to an extension point
 * 
 * @example
 * ```tsx
 * function TreeView() {
 *   const nodeRenderers = useExtensions<NodeRendererExtension>('tree-view.nodeRenderer');
 *   
 *   // Use renderers for custom node types
 *   const getRenderer = (nodeType: string) => {
 *     return nodeRenderers.find(r => r.nodeType === nodeType)?.component;
 *   };
 * }
 * ```
 */
export function useExtensions<T = Record<string, unknown>>(
  pointId: string
): T[] {
  const [version, setVersion] = useState(0);

  // Force re-render when extensions change
  // This is a simple implementation; could be optimized with subscription
  useEffect(() => {
    const interval = setInterval(() => {
      setVersion((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    // version is used to force recalculation
    void version;
    return extensionRegistry.getExtensions<T>(pointId);
  }, [pointId, version]);
}

/**
 * Get extensions with metadata
 */
export function useExtensionsWithMetadata(
  pointId: string
): RegisteredContribution[] {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVersion((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    void version;
    return extensionRegistry.getExtensionsWithMetadata(pointId);
  }, [pointId, version]);
}

/**
 * Check if an extension point exists
 */
export function useHasExtensionPoint(pointId: string): boolean {
  return useMemo(() => {
    return extensionRegistry.hasExtensionPoint(pointId);
  }, [pointId]);
}

/**
 * Get a sorted list of extensions (for rendering)
 */
export function useSortedExtensions<T extends { priority?: number }>(
  pointId: string
): T[] {
  const extensions = useExtensions<T>(pointId);

  return useMemo(() => {
    return [...extensions].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }, [extensions]);
}

/**
 * Find an extension matching a predicate
 */
export function useFindExtension<T = Record<string, unknown>>(
  pointId: string,
  predicate: (extension: T) => boolean
): T | undefined {
  const extensions = useExtensions<T>(pointId);

  return useMemo(() => {
    return extensions.find(predicate);
  }, [extensions, predicate]);
}
