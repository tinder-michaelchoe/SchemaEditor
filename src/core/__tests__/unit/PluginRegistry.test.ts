/**
 * PluginRegistry Tests
 * 
 * Tests for plugin registration, activation, lazy loading, and lifecycle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry } from '../../PluginRegistry';
import {
  minimalPlugin,
  fullPlugin,
  lazyPlugin,
  dependentPlugin,
  minimalManifest,
  invalidIdManifest,
  invalidVersionManifest,
  createTestPlugin,
} from '../fixtures/test-manifests';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('registration', () => {
    it('should register a valid plugin', () => {
      const result = registry.register(minimalPlugin);

      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-minimal');
      expect(result.errors).toBeUndefined();
      expect(registry.has('test-minimal')).toBe(true);
    });

    it('should reject plugin with invalid manifest (bad ID)', () => {
      const result = registry.register({
        manifest: invalidIdManifest,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes('id'))).toBe(true);
    });

    it('should reject plugin with invalid manifest (bad version)', () => {
      const result = registry.register({
        manifest: invalidVersionManifest,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((e) => e.includes('version'))).toBe(true);
    });

    it('should reject duplicate plugin IDs', () => {
      registry.register(minimalPlugin);
      const result = registry.register(minimalPlugin);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Plugin with ID "test-minimal" is already registered'
      );
    });

    it('should validate manifest against schema', () => {
      const badPlugin = createTestPlugin({
        // @ts-expect-error - Testing invalid type
        apiVersion: '2.0', // Invalid API version
      });

      const result = registry.register(badPlugin);
      expect(result.success).toBe(false);
    });
  });

  describe('activation', () => {
    it('should activate eager plugins on load', async () => {
      const plugin = createTestPlugin(
        { activation: 'eager' },
        { onLoad: vi.fn(), onActivate: vi.fn() }
      );

      registry.register(plugin);

      // Wait for async activation
      await new Promise((r) => setTimeout(r, 0));

      expect(registry.isActive(plugin.manifest.id)).toBe(true);
    });

    it('should not activate lazy plugins until triggered', () => {
      registry.register(lazyPlugin);

      expect(registry.isActive('lazy-plugin')).toBe(false);
      expect(lazyPlugin.onLoad).not.toHaveBeenCalled();
    });

    it('should activate lazy plugin on activationEvent', async () => {
      registry.register(lazyPlugin);
      expect(registry.isActive('lazy-plugin')).toBe(false);

      registry.triggerActivationEvent('onSlot:main:view');

      // Wait for async activation
      await new Promise((r) => setTimeout(r, 0));
      expect(registry.isActive('lazy-plugin')).toBe(true);
    });

    it('should call onLoad hook during activation', async () => {
      const onLoad = vi.fn();
      const plugin = createTestPlugin({ activation: 'lazy' }, { onLoad });

      registry.register(plugin);
      await registry.activate(plugin.manifest.id);

      expect(onLoad).toHaveBeenCalled();
    });

    it('should call onActivate hook after activation', async () => {
      const onActivate = vi.fn();
      const plugin = createTestPlugin({ activation: 'lazy' }, { onActivate });

      registry.register(plugin);
      await registry.activate(plugin.manifest.id);

      expect(onActivate).toHaveBeenCalled();
    });

    it('should resolve dependencies before activation', async () => {
      const order: string[] = [];
      
      const dep = createTestPlugin(
        { id: 'dep-plugin', activation: 'lazy' },
        { onActivate: () => order.push('dep') }
      );
      
      const main = createTestPlugin(
        { 
          id: 'main-plugin', 
          activation: 'lazy',
          requires: [{ id: 'dep-plugin' }],
        },
        { onActivate: () => order.push('main') }
      );

      registry.register(dep);
      registry.register(main);
      
      await registry.activate('main-plugin');

      expect(order).toEqual(['dep', 'main']);
    });

    it('should fail if required dependency missing', async () => {
      registry.register(dependentPlugin);
      // test-minimal is required but not registered

      const result = await registry.activate('dependent-plugin');

      expect(result).toBe(false);
      expect(registry.get('dependent-plugin')?.status).toBe('error');
    });

    it('should succeed if optional dependency missing', async () => {
      // Register the required dependency
      registry.register(minimalPlugin);
      registry.register(dependentPlugin);
      // optional-plugin is optional and not registered

      const result = await registry.activate('dependent-plugin');

      expect(result).toBe(true);
      expect(registry.isActive('dependent-plugin')).toBe(true);
    });
  });

  describe('deactivation', () => {
    it('should call onDeactivate hook', async () => {
      const onDeactivate = vi.fn();
      const plugin = createTestPlugin({}, { onDeactivate });

      registry.register(plugin);
      await registry.deactivate(plugin.manifest.id);

      expect(onDeactivate).toHaveBeenCalled();
    });

    it('should call onUnload hook on unregister', async () => {
      const onUnload = vi.fn();
      const plugin = createTestPlugin({}, { onUnload });

      registry.register(plugin);
      await registry.unregister(plugin.manifest.id);

      expect(onUnload).toHaveBeenCalled();
    });

    it('should clean up plugin resources', async () => {
      registry.register(minimalPlugin);
      expect(registry.has('test-minimal')).toBe(true);

      await registry.unregister('test-minimal');

      expect(registry.has('test-minimal')).toBe(false);
    });
  });

  describe('queries', () => {
    it('should list all registered plugins', () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1' });
      const plugin2 = createTestPlugin({ id: 'plugin-2' });

      registry.register(plugin1);
      registry.register(plugin2);

      const ids = registry.getAllPluginIds();

      expect(ids).toContain('plugin-1');
      expect(ids).toContain('plugin-2');
      expect(ids.length).toBe(2);
    });

    it('should list active plugins', () => {
      const eager = createTestPlugin({ id: 'eager-1', activation: 'eager' });
      const lazy = createTestPlugin({ id: 'lazy-1', activation: 'lazy' });

      registry.register(eager);
      registry.register(lazy);

      const active = registry.getActivePluginIds();

      expect(active).toContain('eager-1');
      expect(active).not.toContain('lazy-1');
    });

    it('should get plugin by ID', () => {
      registry.register(minimalPlugin);

      const plugin = registry.get('test-minimal');

      expect(plugin).toBeDefined();
      expect(plugin?.definition.manifest.id).toBe('test-minimal');
    });

    it('should return undefined for unknown plugin', () => {
      const plugin = registry.get('unknown');
      expect(plugin).toBeUndefined();
    });

    it('should check if plugin is active', () => {
      registry.register(minimalPlugin);

      expect(registry.isActive('test-minimal')).toBe(true);
      expect(registry.isActive('unknown')).toBe(false);
    });

    it('should get plugins by status', () => {
      const eager = createTestPlugin({ id: 'eager-1', activation: 'eager' });
      const lazy = createTestPlugin({ id: 'lazy-1', activation: 'lazy' });

      registry.register(eager);
      registry.register(lazy);

      const active = registry.getPluginsByStatus('active');
      const registered = registry.getPluginsByStatus('registered');

      expect(active).toContain('eager-1');
      expect(registered).toContain('lazy-1');
    });
  });

  describe('activation listeners', () => {
    it('should notify listeners when plugin activates', async () => {
      const listener = vi.fn();
      const plugin = createTestPlugin({ activation: 'lazy' });

      registry.register(plugin);
      registry.onActivated(plugin.manifest.id, listener);
      
      await registry.activate(plugin.manifest.id);

      expect(listener).toHaveBeenCalledWith(plugin.manifest.id);
    });

    it('should call listener immediately if already active', () => {
      const listener = vi.fn();
      registry.register(minimalPlugin);

      registry.onActivated('test-minimal', listener);

      expect(listener).toHaveBeenCalledWith('test-minimal');
    });

    it('should unsubscribe correctly', async () => {
      const listener = vi.fn();
      const plugin = createTestPlugin({ activation: 'lazy' });

      registry.register(plugin);
      const unsubscribe = registry.onActivated(plugin.manifest.id, listener);
      unsubscribe();
      
      await registry.activate(plugin.manifest.id);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
