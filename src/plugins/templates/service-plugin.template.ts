/**
 * Service Plugin Template
 * 
 * Use this template for plugins that provide a service for other plugins.
 * Services are singleton implementations that can be consumed by other plugins.
 * 
 * Example use cases:
 * - Style resolution services
 * - Validation services
 * - Data transformation services
 * - API integration services
 * - Caching services
 */

import type { PluginManifest, PluginDefinition, PluginContext } from '../../core/types';

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

/**
 * Define the service interface
 * 
 * This interface should be exported so consuming plugins can use it for typing.
 * Keep it stable - breaking changes affect all consumers.
 */
export interface MyService {
  /**
   * Example method - customize for your service
   */
  processData(input: unknown): ProcessResult;
  
  /**
   * Another example method
   */
  configure(options: ServiceOptions): void;
  
  /**
   * Example async method
   */
  fetchData(id: string): Promise<unknown>;
}

export interface ProcessResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ServiceOptions {
  cacheEnabled?: boolean;
  timeout?: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Service implementation
 * 
 * This is the actual implementation of the service interface.
 * It's instantiated once when the plugin activates.
 */
class MyServiceImpl implements MyService {
  private options: ServiceOptions = {
    cacheEnabled: true,
    timeout: 5000,
  };
  
  private cache = new Map<string, unknown>();
  private context: PluginContext | null = null;
  
  /**
   * Initialize the service with plugin context
   */
  initialize(context: PluginContext): void {
    this.context = context;
    this.context.log.debug('Service initialized');
  }
  
  /**
   * Cleanup when service is no longer needed
   */
  dispose(): void {
    this.cache.clear();
    this.context = null;
  }
  
  processData(input: unknown): ProcessResult {
    try {
      // Example processing logic
      const processed = this.transform(input);
      
      return {
        success: true,
        data: processed,
      };
    } catch (error) {
      this.context?.log.error('Processing failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  configure(options: ServiceOptions): void {
    this.options = { ...this.options, ...options };
    this.context?.log.debug('Service configured', this.options);
  }
  
  async fetchData(id: string): Promise<unknown> {
    // Check cache first
    if (this.options.cacheEnabled && this.cache.has(id)) {
      this.context?.log.debug('Cache hit', { id });
      return this.cache.get(id);
    }
    
    // Simulate fetching data
    const data = await this.doFetch(id);
    
    // Cache the result
    if (this.options.cacheEnabled) {
      this.cache.set(id, data);
    }
    
    return data;
  }
  
  // Private methods
  
  private transform(input: unknown): unknown {
    // Your transformation logic here
    return input;
  }
  
  private async doFetch(id: string): Promise<unknown> {
    // Your fetch logic here
    return { id, data: 'example' };
  }
}

// ============================================================================
// MANIFEST
// ============================================================================

export const manifest: PluginManifest = {
  id: 'my-service-plugin',
  version: '1.0.0',
  name: 'My Service Plugin',
  description: 'Provides a reusable service for other plugins',
  
  capabilities: [
    'services:provide',   // Required to provide services
    // Add more based on what your service needs:
    // 'document:read',   // If service reads documents
    // 'events:emit',     // If service emits events
  ],
  
  // Activate when the service is first requested
  activationEvents: ['onService:my-service'],
  
  // Declare the service this plugin provides
  provides: [
    {
      id: 'my-service',
      description: 'Processes and transforms data',
    },
  ],
  
  // No UI slots for a pure service plugin
  slots: [],
};

// ============================================================================
// DEFINITION
// ============================================================================

// Singleton service instance
let serviceInstance: MyServiceImpl | null = null;

export const definition: PluginDefinition = {
  activate(context: PluginContext): void {
    context.log.info('Service plugin activating');
    
    // Create and initialize the service
    serviceInstance = new MyServiceImpl();
    serviceInstance.initialize(context);
    
    // Register the service
    context.services?.provide?.('my-service', serviceInstance);
    
    context.log.info('Service plugin activated and service registered');
  },
  
  deactivate(): void {
    // Cleanup the service
    if (serviceInstance) {
      serviceInstance.dispose();
      serviceInstance = null;
    }
  },
  
  // Service plugins typically don't have components
  components: {},
  
  // But they do have service implementations
  serviceImplementations: {
    'my-service': () => serviceInstance,
  },
};

// ============================================================================
// CONSUMER EXAMPLE
// ============================================================================

/**
 * Example of how other plugins consume this service:
 * 
 * ```typescript
 * import { useService } from '@/core/hooks';
 * import type { MyService } from '@/plugins/templates/service-plugin.template';
 * 
 * function MyComponent() {
 *   const myService = useService<MyService>('my-service');
 *   
 *   const handleProcess = () => {
 *     const result = myService?.processData({ key: 'value' });
 *     if (result?.success) {
 *       console.log('Processed:', result.data);
 *     }
 *   };
 *   
 *   return <button onClick={handleProcess}>Process</button>;
 * }
 * ```
 */

// ============================================================================
// EXPORT
// ============================================================================

export default { manifest, definition };
