/**
 * Plugin Lifecycle Integration Tests
 * 
 * Tests for the complete plugin registration, activation, and unload flow.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry } from '../../PluginRegistry';
import { ExtensionRegistry } from '../../ExtensionRegistry';
import { ServiceRegistry } from '../../ServiceRegistry';
import { EventBus } from '../../EventBus';
import { PluginContextFactory } from '../../PluginContext';
import type { PluginManifest, PluginDefinition, SlotProps } from '../../types/plugin';
import React from 'react';

// Test component
const TestComponent: React.FC<SlotProps> = () => 
  React.createElement('div', null, 'Test');

describe('Plugin Lifecycle Integration', () => {
  let pluginRegistry: PluginRegistry;
  let extensionRegistry: ExtensionRegistry;
  let serviceRegistry: ServiceRegistry;
  let eventBus: EventBus;
  let contextFactory: PluginContextFactory;

  beforeEach(() => {
    pluginRegistry = new PluginRegistry();
    extensionRegistry = new ExtensionRegistry();
    serviceRegistry = new ServiceRegistry();
    eventBus = new EventBus();
    contextFactory = new PluginContextFactory();

    // Wire up context factory
    pluginRegistry.setContextFactory((manifest) => {
      return contextFactory.createContext(manifest);
    });
  });

  it('should complete full registration to activation flow', async () => {
    const hooks = {
      onLoad: vi.fn(),
      onActivate: vi.fn(),
      onDeactivate: vi.fn(),
      onUnload: vi.fn(),
    };

    const plugin: PluginDefinition = {
      manifest: {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'lazy',
        capabilities: ['document:read'],
      },
      ...hooks,
    };

    // 1. Register plugin
    const regResult = pluginRegistry.register(plugin);
    expect(regResult.success).toBe(true);

    // 2. Verify not active
    expect(pluginRegistry.isActive('test-plugin')).toBe(false);
    expect(hooks.onLoad).not.toHaveBeenCalled();

    // 3. Trigger activation
    await pluginRegistry.activate('test-plugin');

    // 4. Verify active
    expect(pluginRegistry.isActive('test-plugin')).toBe(true);

    // 5. Verify hooks called in order
    expect(hooks.onLoad).toHaveBeenCalled();
    expect(hooks.onActivate).toHaveBeenCalled();

    // Verify order: onLoad before onActivate
    const loadCall = hooks.onLoad.mock.invocationCallOrder[0];
    const activateCall = hooks.onActivate.mock.invocationCallOrder[0];
    expect(loadCall).toBeLessThan(activateCall);

    // 6. Deactivate
    await pluginRegistry.deactivate('test-plugin');
    expect(hooks.onDeactivate).toHaveBeenCalled();

    // 7. Unregister
    await pluginRegistry.unregister('test-plugin');
    expect(hooks.onUnload).toHaveBeenCalled();
    expect(pluginRegistry.has('test-plugin')).toBe(false);
  });

  it('should handle extension point flow', async () => {
    // 1. Define extension point directly (not through manifest to avoid Zod v4 issues)
    extensionRegistry.defineExtensionPoint('provider-plugin', {
      id: 'nodeRenderer',
      schema: {
        type: 'object',
        properties: {
          type: { type: 'string', required: true },
          render: { type: 'function', required: true },
        },
      },
    });

    // 2. Contribute to the extension point
    extensionRegistry.contributeExtension('consumer-plugin', {
      point: 'provider-plugin.nodeRenderer',
      contribution: {
        type: 'custom',
        render: () => null,
      },
    });

    // 3. Verify contributions available
    const extensions = extensionRegistry.getExtensions('provider-plugin.nodeRenderer');
    expect(extensions.length).toBe(1);
    expect((extensions[0] as { type: string }).type).toBe('custom');
  });

  it('should handle service flow', async () => {
    interface ITestService {
      getValue(): string;
    }

    const testService: ITestService = {
      getValue: () => 'service-value',
    };

    // 1. Register provider plugin
    const provider: PluginDefinition = {
      manifest: {
        id: 'service-provider',
        name: 'Provider',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['services:provide'],
        provides: [
          {
            id: 'test-service',
            interface: 'ITestService',
            implementation: testService,
          },
        ],
      },
      onLoad: () => {
        serviceRegistry.register(
          'service-provider',
          'test-service',
          testService,
          'ITestService'
        );
      },
    };

    // 2. Register consumer plugin
    const consumerCallback = vi.fn();
    const consumer: PluginDefinition = {
      manifest: {
        id: 'service-consumer',
        name: 'Consumer',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['services:consume'],
        consumes: ['test-service'],
      },
      onLoad: () => {
        const service = serviceRegistry.get<ITestService>('test-service');
        if (service) {
          consumerCallback(service.getValue());
        }
      },
    };

    // 3. Activate provider first
    pluginRegistry.register(provider);

    // 4. Verify service available
    expect(serviceRegistry.has('test-service')).toBe(true);

    // 5. Activate consumer
    pluginRegistry.register(consumer);

    // 6. Verify consumer received service
    expect(consumerCallback).toHaveBeenCalledWith('service-value');
  });

  it('should handle event flow', async () => {
    const listenerCallback = vi.fn();

    // 1. Register emitter plugin
    const emitter: PluginDefinition = {
      manifest: {
        id: 'emitter-plugin',
        name: 'Emitter',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['events:emit'],
        emits: ['custom:event'],
      },
    };

    // 2. Register listener plugin
    const listener: PluginDefinition = {
      manifest: {
        id: 'listener-plugin',
        name: 'Listener',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['events:subscribe'],
        subscribes: ['custom:event'],
      },
      onLoad: () => {
        eventBus.subscribe('custom:event', listenerCallback);
      },
    };

    // 3. Activate both
    pluginRegistry.register(emitter);
    pluginRegistry.register(listener);

    // 4. Emit event
    eventBus.emit('custom:event', { data: 'test' });

    // 5. Verify listener received event
    expect(listenerCallback).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should isolate plugin failures', async () => {
    const goodCallback = vi.fn();

    // 1. Register good plugin
    const goodPlugin: PluginDefinition = {
      manifest: {
        id: 'good-plugin',
        name: 'Good',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
      },
      onActivate: goodCallback,
    };

    // 2. Register bad plugin (throws in onLoad)
    const badPlugin: PluginDefinition = {
      manifest: {
        id: 'bad-plugin',
        name: 'Bad',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
      },
      onLoad: () => {
        throw new Error('Intentional error');
      },
    };

    // Register good plugin first
    pluginRegistry.register(goodPlugin);
    expect(goodCallback).toHaveBeenCalled();

    // Register bad plugin - should fail but not affect good plugin
    pluginRegistry.register(badPlugin);

    // 3. Verify good plugin still works
    expect(pluginRegistry.isActive('good-plugin')).toBe(true);

    // 4. Verify bad plugin is in error state
    expect(pluginRegistry.get('bad-plugin')?.status).toBe('error');
  });

  it('should handle dependency chain activation', async () => {
    const activationOrder: string[] = [];

    const createPlugin = (
      id: string,
      deps: string[] = []
    ): PluginDefinition => ({
      manifest: {
        id,
        name: id,
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'lazy',
        capabilities: [],
        requires: deps.map((d) => ({ id: d })),
      },
      onActivate: () => activationOrder.push(id),
    });

    // Create chain: C depends on B, B depends on A
    const pluginA = createPlugin('plugin-a');
    const pluginB = createPlugin('plugin-b', ['plugin-a']);
    const pluginC = createPlugin('plugin-c', ['plugin-b']);

    // Register all
    pluginRegistry.register(pluginA);
    pluginRegistry.register(pluginB);
    pluginRegistry.register(pluginC);

    // Activate C (should activate A and B first)
    await pluginRegistry.activate('plugin-c');

    expect(activationOrder).toEqual(['plugin-a', 'plugin-b', 'plugin-c']);
  });

  it('should handle lazy activation events', async () => {
    const activateCallback = vi.fn();

    const lazyPlugin: PluginDefinition = {
      manifest: {
        id: 'lazy-plugin',
        name: 'Lazy',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'lazy',
        activationEvents: ['onEvent:trigger:activate'],
        capabilities: [],
      },
      onActivate: activateCallback,
    };

    pluginRegistry.register(lazyPlugin);
    expect(pluginRegistry.isActive('lazy-plugin')).toBe(false);

    // Trigger activation event
    pluginRegistry.triggerActivationEvent('onEvent:trigger:activate');

    // Wait for async activation
    await new Promise((r) => setTimeout(r, 10));

    expect(pluginRegistry.isActive('lazy-plugin')).toBe(true);
    expect(activateCallback).toHaveBeenCalled();
  });
});
