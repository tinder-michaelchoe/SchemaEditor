/**
 * Service Registry
 * 
 * Manages services for decoupled functionality sharing between plugins.
 * Plugins can provide services and other plugins can consume them.
 */

import type { ServiceDeclaration, Unsubscribe } from './types/plugin';
import type { RegisteredService, ServiceAvailableCallback } from './types/services';

// ============================================================================
// Service Registry Class
// ============================================================================

export class ServiceRegistry {
  private services = new Map<string, RegisteredService>();
  private availabilityCallbacks = new Map<string, Set<ServiceAvailableCallback>>();

  /**
   * Register a service
   * @param pluginId - The plugin providing this service
   * @param serviceId - The service ID
   * @param implementation - The service implementation
   * @param interfaceName - TypeScript interface name (for documentation)
   */
  register<T>(
    pluginId: string,
    serviceId: string,
    implementation: T,
    interfaceName: string = 'unknown'
  ): void {
    // Check for duplicates
    if (this.services.has(serviceId)) {
      const existing = this.services.get(serviceId)!;
      throw new Error(
        `Service ${serviceId} is already registered by plugin ${existing.pluginId}`
      );
    }

    // Register the service
    const registered: RegisteredService = {
      id: serviceId,
      pluginId,
      implementation,
      interfaceName,
    };

    this.services.set(serviceId, registered);

    // Notify waiting consumers
    this.notifyAvailability(serviceId, implementation);
  }

  /**
   * Register a service from a declaration
   */
  registerFromDeclaration(
    pluginId: string,
    declaration: ServiceDeclaration
  ): void {
    this.register(
      pluginId,
      declaration.id,
      declaration.implementation,
      declaration.interface
    );
  }

  /**
   * Get a service by ID
   */
  get<T>(serviceId: string): T | undefined {
    const registered = this.services.get(serviceId);
    return registered?.implementation as T | undefined;
  }

  /**
   * Check if a service exists
   */
  has(serviceId: string): boolean {
    return this.services.has(serviceId);
  }

  /**
   * Get service metadata
   */
  getServiceInfo(serviceId: string): RegisteredService | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Subscribe to service availability
   * Callback is called immediately if service already exists,
   * or when it becomes available
   */
  onAvailable<T>(
    serviceId: string,
    callback: ServiceAvailableCallback<T>
  ): Unsubscribe {
    // If already available, call immediately
    const existing = this.services.get(serviceId);
    if (existing) {
      callback(existing.implementation as T);
    }

    // Register callback for future availability
    let callbacks = this.availabilityCallbacks.get(serviceId);
    if (!callbacks) {
      callbacks = new Set();
      this.availabilityCallbacks.set(serviceId, callbacks);
    }
    callbacks.add(callback as ServiceAvailableCallback);

    // Return unsubscribe function
    return () => {
      callbacks?.delete(callback as ServiceAvailableCallback);
    };
  }

  /**
   * Notify callbacks when a service becomes available
   */
  private notifyAvailability<T>(serviceId: string, service: T): void {
    const callbacks = this.availabilityCallbacks.get(serviceId);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(service);
        } catch (error) {
          console.error(`Error in service availability callback for ${serviceId}:`, error);
        }
      }
    }
  }

  /**
   * Unregister a service
   */
  unregister(serviceId: string): boolean {
    return this.services.delete(serviceId);
  }

  /**
   * Unregister all services provided by a plugin
   */
  unregisterPluginServices(pluginId: string): void {
    for (const [id, service] of this.services) {
      if (service.pluginId === pluginId) {
        this.services.delete(id);
      }
    }
  }

  /**
   * Get all service IDs
   */
  getAllServiceIds(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get services provided by a specific plugin
   */
  getServicesByPlugin(pluginId: string): RegisteredService[] {
    return Array.from(this.services.values()).filter(
      (s) => s.pluginId === pluginId
    );
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.availabilityCallbacks.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global service registry instance
 */
export const serviceRegistry = new ServiceRegistry();
