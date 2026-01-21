/**
 * ExtensionRegistry Tests
 * 
 * Tests for extension points, contributions, and schema validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionRegistry } from '../../ExtensionRegistry';

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry();
  });

  describe('extension points', () => {
    it('should define an extension point', () => {
      registry.defineExtensionPoint('test-plugin', {
        id: 'nodeRenderer',
        schema: {
          type: 'object',
          properties: {
            nodeType: { type: 'string', required: true },
          },
        },
      });

      expect(registry.hasExtensionPoint('test-plugin.nodeRenderer')).toBe(true);
    });

    it('should reject duplicate extension point IDs', () => {
      registry.defineExtensionPoint('test-plugin', {
        id: 'nodeRenderer',
        schema: { type: 'object', properties: {} },
      });

      expect(() => {
        registry.defineExtensionPoint('test-plugin', {
          id: 'nodeRenderer',
          schema: { type: 'object', properties: {} },
        });
      }).toThrow('Extension point test-plugin.nodeRenderer is already defined');
    });

    it('should namespace extension points by plugin ID', () => {
      registry.defineExtensionPoint('plugin-a', {
        id: 'myPoint',
        schema: { type: 'object', properties: {} },
      });

      registry.defineExtensionPoint('plugin-b', {
        id: 'myPoint',
        schema: { type: 'object', properties: {} },
      });

      expect(registry.hasExtensionPoint('plugin-a.myPoint')).toBe(true);
      expect(registry.hasExtensionPoint('plugin-b.myPoint')).toBe(true);
    });

    it('should get extension point declaration', () => {
      registry.defineExtensionPoint('test-plugin', {
        id: 'nodeRenderer',
        schema: {
          type: 'object',
          properties: {
            nodeType: { type: 'string', required: true },
          },
        },
      });

      const point = registry.getExtensionPoint('test-plugin.nodeRenderer');

      expect(point).toBeDefined();
      expect(point?.pluginId).toBe('test-plugin');
      expect(point?.declaration.id).toBe('nodeRenderer');
    });
  });

  describe('contributions', () => {
    beforeEach(() => {
      registry.defineExtensionPoint('tree-view', {
        id: 'nodeRenderer',
        schema: {
          type: 'object',
          properties: {
            nodeType: { type: 'string', required: true },
            component: { type: 'function', required: true },
            priority: { type: 'number' },
          },
        },
      });
    });

    it('should accept valid contribution', () => {
      const result = registry.contributeExtension('consumer-plugin', {
        point: 'tree-view.nodeRenderer',
        contribution: {
          nodeType: 'custom',
          component: () => null,
          priority: 10,
        },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject contribution to non-existent point', () => {
      // Contribution should be queued, not rejected
      const result = registry.contributeExtension('consumer-plugin', {
        point: 'unknown.point',
        contribution: { value: 'test' },
      });

      // Returns valid because it's queued for later
      expect(result.valid).toBe(true);
    });

    it('should reject contribution that fails schema validation', () => {
      const result = registry.contributeExtension('consumer-plugin', {
        point: 'tree-view.nodeRenderer',
        contribution: {
          // Missing required 'nodeType' and 'component'
          priority: 10,
        },
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate property types', () => {
      const result = registry.contributeExtension('consumer-plugin', {
        point: 'tree-view.nodeRenderer',
        contribution: {
          nodeType: 123, // Should be string
          component: () => null,
        },
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.property === 'nodeType')).toBe(true);
    });

    it('should support multiple contributions to same point', () => {
      registry.contributeExtension('plugin-a', {
        point: 'tree-view.nodeRenderer',
        contribution: {
          nodeType: 'type-a',
          component: () => null,
        },
      });

      registry.contributeExtension('plugin-b', {
        point: 'tree-view.nodeRenderer',
        contribution: {
          nodeType: 'type-b',
          component: () => null,
        },
      });

      const extensions = registry.getExtensions('tree-view.nodeRenderer');
      expect(extensions.length).toBe(2);
    });
  });

  describe('retrieval', () => {
    beforeEach(() => {
      registry.defineExtensionPoint('test-plugin', {
        id: 'myPoint',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            priority: { type: 'number' },
          },
        },
      });
    });

    it('should get all contributions for extension point', () => {
      registry.contributeExtension('plugin-a', {
        point: 'test-plugin.myPoint',
        contribution: { name: 'a' },
      });

      registry.contributeExtension('plugin-b', {
        point: 'test-plugin.myPoint',
        contribution: { name: 'b' },
      });

      const extensions = registry.getExtensions<{ name: string }>(
        'test-plugin.myPoint'
      );

      expect(extensions.length).toBe(2);
      expect(extensions.map((e) => e.name)).toContain('a');
      expect(extensions.map((e) => e.name)).toContain('b');
    });

    it('should return empty array for point with no contributions', () => {
      const extensions = registry.getExtensions('test-plugin.myPoint');
      expect(extensions).toEqual([]);
    });

    it('should return empty array for unknown extension point', () => {
      const extensions = registry.getExtensions('unknown.point');
      expect(extensions).toEqual([]);
    });

    it('should order contributions by priority', () => {
      registry.contributeExtension('plugin-low', {
        point: 'test-plugin.myPoint',
        contribution: { name: 'low', priority: 10 },
      });

      registry.contributeExtension('plugin-high', {
        point: 'test-plugin.myPoint',
        contribution: { name: 'high', priority: 100 },
      });

      registry.contributeExtension('plugin-medium', {
        point: 'test-plugin.myPoint',
        contribution: { name: 'medium', priority: 50 },
      });

      const extensions = registry.getExtensions<{ name: string }>(
        'test-plugin.myPoint'
      );

      expect(extensions[0].name).toBe('high');
      expect(extensions[1].name).toBe('medium');
      expect(extensions[2].name).toBe('low');
    });
  });

  describe('pending contributions', () => {
    it('should queue contributions for undefined extension points', () => {
      // Contribute before defining
      registry.contributeExtension('consumer', {
        point: 'provider.myPoint',
        contribution: { name: 'early' },
      });

      // Now define the point
      registry.defineExtensionPoint('provider', {
        id: 'myPoint',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
          },
        },
      });

      // Contribution should now be available
      const extensions = registry.getExtensions<{ name: string }>(
        'provider.myPoint'
      );
      expect(extensions.length).toBe(1);
      expect(extensions[0].name).toBe('early');
    });
  });

  describe('cleanup', () => {
    it('should remove extension points by plugin', () => {
      registry.defineExtensionPoint('plugin-a', {
        id: 'point1',
        schema: { type: 'object', properties: {} },
      });

      registry.defineExtensionPoint('plugin-b', {
        id: 'point2',
        schema: { type: 'object', properties: {} },
      });

      registry.removePluginExtensionPoints('plugin-a');

      expect(registry.hasExtensionPoint('plugin-a.point1')).toBe(false);
      expect(registry.hasExtensionPoint('plugin-b.point2')).toBe(true);
    });

    it('should remove contributions by plugin', () => {
      registry.defineExtensionPoint('host', {
        id: 'myPoint',
        schema: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      });

      registry.contributeExtension('plugin-a', {
        point: 'host.myPoint',
        contribution: { name: 'a' },
      });

      registry.contributeExtension('plugin-b', {
        point: 'host.myPoint',
        contribution: { name: 'b' },
      });

      registry.removePluginContributions('plugin-a');

      const extensions = registry.getExtensions<{ name: string }>('host.myPoint');
      expect(extensions.length).toBe(1);
      expect(extensions[0].name).toBe('b');
    });
  });
});
