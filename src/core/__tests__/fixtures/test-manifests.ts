/**
 * Test Fixtures - Plugin Manifests
 * 
 * Provides reusable test data for plugin tests.
 */

import type { PluginManifest, PluginDefinition, SlotProps } from '../../types/plugin';
import React from 'react';

// ============================================================================
// Test Components
// ============================================================================

const TestComponent: React.FC<SlotProps> = () => {
  return React.createElement('div', { 'data-testid': 'test-component' }, 'Test');
};

const CrashingComponent: React.FC<SlotProps> = () => {
  throw new Error('Component crashed intentionally');
};

// ============================================================================
// Minimal Plugin
// ============================================================================

export const minimalManifest: PluginManifest = {
  id: 'test-minimal',
  name: 'Minimal Test Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: [],
};

export const minimalPlugin: PluginDefinition = {
  manifest: minimalManifest,
};

// ============================================================================
// Full-Featured Plugin
// ============================================================================

export const fullManifest: PluginManifest = {
  id: 'test-full',
  name: 'Full Test Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:sidebar:left'],
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'selection:write',
    'events:emit',
    'events:subscribe',
    'extensions:define',
    'services:provide',
  ],
  requires: [{ id: 'other-plugin', optional: true }],
  slots: [{ slot: 'sidebar:left', component: TestComponent, priority: 50 }],
  extensionPoints: [
    {
      id: 'testPoint',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          priority: { type: 'number' },
        },
      },
    },
  ],
  provides: [
    {
      id: 'test-service',
      interface: 'ITestService',
      implementation: { getValue: () => 'test' },
    },
  ],
  emits: ['test:event'],
  subscribes: ['document:changed'],
};

export const fullPlugin: PluginDefinition = {
  manifest: fullManifest,
  onLoad: vi.fn(),
  onActivate: vi.fn(),
  onDeactivate: vi.fn(),
  onUnload: vi.fn(),
};

// ============================================================================
// Extension Provider Plugin
// ============================================================================

export const extensionProviderManifest: PluginManifest = {
  id: 'extension-provider',
  name: 'Extension Provider',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: ['extensions:define'],
  extensionPoints: [
    {
      id: 'nodeRenderer',
      schema: {
        type: 'object',
        properties: {
          nodeType: { type: 'string', required: true },
          component: { type: 'function', required: true },
          priority: { type: 'number' },
        },
      },
      multiple: true,
    },
  ],
};

export const extensionProviderPlugin: PluginDefinition = {
  manifest: extensionProviderManifest,
};

// ============================================================================
// Extension Consumer Plugin
// ============================================================================

export const extensionConsumerManifest: PluginManifest = {
  id: 'extension-consumer',
  name: 'Extension Consumer',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: ['extensions:contribute'],
  extensions: [
    {
      point: 'extension-provider.nodeRenderer',
      contribution: {
        nodeType: 'custom',
        component: TestComponent,
        priority: 10,
      },
    },
  ],
};

export const extensionConsumerPlugin: PluginDefinition = {
  manifest: extensionConsumerManifest,
};

// ============================================================================
// Service Provider Plugin
// ============================================================================

export interface ITestService {
  getValue(): string;
  setValue(value: string): void;
}

export const testServiceImplementation: ITestService = {
  getValue: () => 'test-value',
  setValue: vi.fn(),
};

export const serviceProviderManifest: PluginManifest = {
  id: 'service-provider',
  name: 'Service Provider',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: ['services:provide'],
  provides: [
    {
      id: 'test-service',
      interface: 'ITestService',
      implementation: testServiceImplementation,
    },
  ],
};

export const serviceProviderPlugin: PluginDefinition = {
  manifest: serviceProviderManifest,
};

// ============================================================================
// Service Consumer Plugin
// ============================================================================

export const serviceConsumerManifest: PluginManifest = {
  id: 'service-consumer',
  name: 'Service Consumer',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: ['services:consume'],
  consumes: ['test-service'],
};

export const serviceConsumerPlugin: PluginDefinition = {
  manifest: serviceConsumerManifest,
  onLoad: vi.fn(),
};

// ============================================================================
// Plugin with Dependencies
// ============================================================================

export const dependentManifest: PluginManifest = {
  id: 'dependent-plugin',
  name: 'Dependent Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: ['document:read'],
  requires: [
    { id: 'test-minimal' },
    { id: 'optional-plugin', optional: true },
  ],
};

export const dependentPlugin: PluginDefinition = {
  manifest: dependentManifest,
};

// ============================================================================
// Lazy Plugin
// ============================================================================

export const lazyManifest: PluginManifest = {
  id: 'lazy-plugin',
  name: 'Lazy Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:main:view', 'onEvent:custom:event'],
  capabilities: ['document:read'],
  slots: [{ slot: 'main:view', component: TestComponent, priority: 100 }],
};

export const lazyPlugin: PluginDefinition = {
  manifest: lazyManifest,
  onLoad: vi.fn(),
  onActivate: vi.fn(),
};

// ============================================================================
// Invalid Manifests (for validation tests)
// ============================================================================

export const invalidIdManifest: PluginManifest = {
  id: 'Invalid_ID', // Should be lowercase with hyphens
  name: 'Invalid ID Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: [],
};

export const invalidVersionManifest: PluginManifest = {
  id: 'invalid-version',
  name: 'Invalid Version Plugin',
  version: 'v1', // Should be semver
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: [],
};

// ============================================================================
// Slot Plugin (for SlotManager tests)
// ============================================================================

export const slotPluginManifest: PluginManifest = {
  id: 'slot-plugin',
  name: 'Slot Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: ['document:read'],
  slots: [
    { slot: 'sidebar:left', component: TestComponent, priority: 100 },
    { slot: 'sidebar:right', component: TestComponent, priority: 50 },
  ],
};

export const slotPlugin: PluginDefinition = {
  manifest: slotPluginManifest,
};

// ============================================================================
// Crashing Plugin (for error boundary tests)
// ============================================================================

export const crashingPluginManifest: PluginManifest = {
  id: 'crashing-plugin',
  name: 'Crashing Plugin',
  version: '1.0.0',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: [],
  slots: [{ slot: 'sidebar:left', component: CrashingComponent, priority: 1 }],
};

export const crashingPlugin: PluginDefinition = {
  manifest: crashingPluginManifest,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a simple test plugin definition
 */
export function createTestPlugin(
  overrides: Partial<PluginManifest> = {},
  hooks: Partial<Pick<PluginDefinition, 'onLoad' | 'onActivate' | 'onDeactivate' | 'onUnload'>> = {}
): PluginDefinition {
  return {
    manifest: {
      id: `test-plugin-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Test Plugin',
      version: '1.0.0',
      apiVersion: '1.0',
      activation: 'eager',
      capabilities: [],
      ...overrides,
    },
    ...hooks,
  };
}
