/**
 * useService Hook
 * 
 * Provides access to services from the service registry.
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import { serviceRegistry } from '../ServiceRegistry';

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get a service by ID
 * 
 * @example
 * ```tsx
 * function PropertyInspector() {
 *   const styleResolver = useService<IStyleResolver>('style-resolver');
 *   
 *   if (!styleResolver) {
 *     return <div>Style resolver not available</div>;
 *   }
 *   
 *   const style = styleResolver.resolveStyle('@button.primary');
 * }
 * ```
 */
export function useService<T>(serviceId: string): T | undefined {
  const [version, setVersion] = useState(0);

  // Subscribe to service availability
  useEffect(() => {
    const unsubscribe = serviceRegistry.onAvailable(serviceId, () => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, [serviceId]);

  return useMemo(() => {
    void version;
    return serviceRegistry.get<T>(serviceId);
  }, [serviceId, version]);
}

/**
 * Get a service, throwing if not available
 */
export function useRequiredService<T>(serviceId: string): T {
  const service = useService<T>(serviceId);

  if (service === undefined) {
    throw new Error(`Required service "${serviceId}" is not available`);
  }

  return service;
}

/**
 * Check if a service exists
 */
export function useHasService(serviceId: string): boolean {
  const [exists, setExists] = useState(() => serviceRegistry.has(serviceId));

  useEffect(() => {
    const unsubscribe = serviceRegistry.onAvailable(serviceId, () => {
      setExists(true);
    });
    
    // Check immediately in case it became available
    setExists(serviceRegistry.has(serviceId));
    
    return unsubscribe;
  }, [serviceId]);

  return exists;
}

/**
 * Wait for a service to become available
 */
export function useServiceWhenAvailable<T>(
  serviceId: string,
  callback: (service: T) => void
): void {
  useEffect(() => {
    const unsubscribe = serviceRegistry.onAvailable<T>(serviceId, callback);
    return unsubscribe;
  }, [serviceId, callback]);
}

/**
 * Get multiple services at once
 */
export function useServices<T extends Record<string, unknown>>(
  serviceIds: (keyof T)[]
): Partial<T> {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribes = serviceIds.map((id) =>
      serviceRegistry.onAvailable(id as string, () => {
        setVersion((v) => v + 1);
      })
    );

    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [serviceIds]);

  return useMemo(() => {
    void version;
    const services: Partial<T> = {};
    for (const id of serviceIds) {
      const service = serviceRegistry.get(id as string);
      if (service !== undefined) {
        services[id] = service as T[keyof T];
      }
    }
    return services;
  }, [serviceIds, version]);
}
