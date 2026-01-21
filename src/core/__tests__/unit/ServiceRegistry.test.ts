/**
 * ServiceRegistry Tests
 * 
 * Tests for service registration, consumption, and availability.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceRegistry } from '../../ServiceRegistry';

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  describe('registration', () => {
    it('should register a service', () => {
      const service = { getValue: () => 'test' };
      registry.register('plugin-a', 'test-service', service, 'ITestService');

      expect(registry.has('test-service')).toBe(true);
    });

    it('should reject duplicate service IDs', () => {
      const service1 = { getValue: () => 'test1' };
      const service2 = { getValue: () => 'test2' };

      registry.register('plugin-a', 'test-service', service1);

      expect(() => {
        registry.register('plugin-b', 'test-service', service2);
      }).toThrow('Service test-service is already registered by plugin plugin-a');
    });

    it('should track which plugin provides service', () => {
      const service = { getValue: () => 'test' };
      registry.register('my-plugin', 'test-service', service);

      const info = registry.getServiceInfo('test-service');
      expect(info?.pluginId).toBe('my-plugin');
    });

    it('should store interface name', () => {
      const service = { getValue: () => 'test' };
      registry.register('plugin-a', 'test-service', service, 'ITestService');

      const info = registry.getServiceInfo('test-service');
      expect(info?.interfaceName).toBe('ITestService');
    });
  });

  describe('consumption', () => {
    it('should return service by ID', () => {
      const service = { getValue: () => 'test-value' };
      registry.register('plugin-a', 'test-service', service);

      const retrieved = registry.get<typeof service>('test-service');
      expect(retrieved?.getValue()).toBe('test-value');
    });

    it('should return undefined for unknown service', () => {
      const service = registry.get('unknown-service');
      expect(service).toBeUndefined();
    });

    it('should check if service exists', () => {
      registry.register('plugin-a', 'test-service', {});

      expect(registry.has('test-service')).toBe(true);
      expect(registry.has('unknown-service')).toBe(false);
    });

    it('should get typed service', () => {
      interface ICounter {
        count: number;
        increment(): void;
      }

      const counter: ICounter = {
        count: 0,
        increment() {
          this.count++;
        },
      };

      registry.register('plugin-a', 'counter', counter);

      const retrieved = registry.get<ICounter>('counter');
      retrieved?.increment();
      expect(retrieved?.count).toBe(1);
    });
  });

  describe('availability', () => {
    it('should notify when service becomes available', () => {
      const callback = vi.fn();
      registry.onAvailable('test-service', callback);

      const service = { value: 'test' };
      registry.register('plugin-a', 'test-service', service);

      expect(callback).toHaveBeenCalledWith(service);
    });

    it('should call callback immediately if already available', () => {
      const service = { value: 'test' };
      registry.register('plugin-a', 'test-service', service);

      const callback = vi.fn();
      registry.onAvailable('test-service', callback);

      expect(callback).toHaveBeenCalledWith(service);
    });

    it('should handle multiple availability callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      registry.onAvailable('test-service', callback1);
      registry.onAvailable('test-service', callback2);

      const service = { value: 'test' };
      registry.register('plugin-a', 'test-service', service);

      expect(callback1).toHaveBeenCalledWith(service);
      expect(callback2).toHaveBeenCalledWith(service);
    });

    it('should unsubscribe correctly', () => {
      const callback = vi.fn();
      const unsubscribe = registry.onAvailable('test-service', callback);
      unsubscribe();

      registry.register('plugin-a', 'test-service', {});

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('unregistration', () => {
    it('should unregister a service', () => {
      registry.register('plugin-a', 'test-service', {});
      expect(registry.has('test-service')).toBe(true);

      registry.unregister('test-service');
      expect(registry.has('test-service')).toBe(false);
    });

    it('should unregister all plugin services', () => {
      registry.register('plugin-a', 'service-1', {});
      registry.register('plugin-a', 'service-2', {});
      registry.register('plugin-b', 'service-3', {});

      registry.unregisterPluginServices('plugin-a');

      expect(registry.has('service-1')).toBe(false);
      expect(registry.has('service-2')).toBe(false);
      expect(registry.has('service-3')).toBe(true);
    });
  });

  describe('queries', () => {
    it('should get all service IDs', () => {
      registry.register('plugin-a', 'service-1', {});
      registry.register('plugin-b', 'service-2', {});

      const ids = registry.getAllServiceIds();

      expect(ids).toContain('service-1');
      expect(ids).toContain('service-2');
      expect(ids.length).toBe(2);
    });

    it('should get services by plugin', () => {
      registry.register('plugin-a', 'service-1', {});
      registry.register('plugin-a', 'service-2', {});
      registry.register('plugin-b', 'service-3', {});

      const services = registry.getServicesByPlugin('plugin-a');

      expect(services.length).toBe(2);
      expect(services.map((s) => s.id)).toContain('service-1');
      expect(services.map((s) => s.id)).toContain('service-2');
    });
  });
});
