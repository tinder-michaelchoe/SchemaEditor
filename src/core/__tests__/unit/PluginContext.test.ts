/**
 * PluginContext Tests
 * 
 * Tests for hierarchical context, capability gating, and dependency injection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginContextFactory, type CoreStores } from '../../PluginContext';
import type { PluginManifest } from '../../types/plugin';

// Mock core stores
function createMockStores(): CoreStores {
  return {
    document: {
      getSchema: () => ({ type: 'object', title: 'Test' }),
      getSchemaContext: () => null,
      getData: () => ({ title: 'Test Data' }),
      getErrors: () => new Map(),
      isValid: () => true,
    },
    selection: {
      getSelectedPath: () => 'root.title',
      getEditingPath: () => null,
      getHoveredPath: () => null,
      setSelectedPath: vi.fn(),
      setEditingPath: vi.fn(),
      setHoveredPath: vi.fn(),
    },
    ui: {
      isDarkMode: () => true,
      getViewMode: () => 'tree',
      getExpandedPaths: () => new Set(['root']),
      toggleDarkMode: vi.fn(),
      setViewMode: vi.fn(),
      toggleExpanded: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
    },
  };
}

describe('PluginContextFactory', () => {
  let factory: PluginContextFactory;
  let stores: CoreStores;

  beforeEach(() => {
    factory = new PluginContextFactory();
    stores = createMockStores();
    factory.setStores(stores);
  });

  describe('capability gating', () => {
    it('should include document when document:read requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['document:read'],
      };

      const context = factory.createContext(manifest);

      expect(context.document).toBeDefined();
      expect(context.document?.schema).toEqual({ type: 'object', title: 'Test' });
    });

    it('should exclude document when document:read not requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [], // No document:read
      };

      const context = factory.createContext(manifest);

      expect(context.document).toBeUndefined();
    });

    it('should include actions when document:write requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['document:write'],
      };

      const context = factory.createContext(manifest);

      expect(context.actions).toBeDefined();
      expect(context.actions?.updateValue).toBeDefined();
    });

    it('should exclude actions when document:write not requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['document:read'], // Read only
      };

      const context = factory.createContext(manifest);

      expect(context.actions).toBeUndefined();
    });

    it('should include selection read when selection:read requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['selection:read'],
      };

      const context = factory.createContext(manifest);

      expect(context.selection).toBeDefined();
      expect(context.selection?.selectedPath).toBe('root.title');
      expect(context.selection?.setSelectedPath).toBeUndefined(); // No write
    });

    it('should include selection write when selection:write requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['selection:read', 'selection:write'],
      };

      const context = factory.createContext(manifest);

      expect(context.selection?.setSelectedPath).toBeDefined();
    });

    it('should include UI when ui:read requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['ui:read'],
      };

      const context = factory.createContext(manifest);

      expect(context.ui).toBeDefined();
      expect(context.ui?.isDarkMode).toBe(true);
      expect(context.ui?.toggleDarkMode).toBeUndefined();
    });

    it('should include events when events:subscribe requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['events:subscribe'],
      };

      const context = factory.createContext(manifest);

      expect(context.events).toBeDefined();
      expect(context.events?.subscribe).toBeDefined();
    });

    it('should include extensions when extensions:define requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['extensions:define'],
      };

      const context = factory.createContext(manifest);

      expect(context.extensions).toBeDefined();
      expect(context.extensions?.defineExtensionPoint).toBeDefined();
    });

    it('should include services when services:consume requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['services:consume'],
      };

      const context = factory.createContext(manifest);

      expect(context.services).toBeDefined();
      expect(context.services?.get).toBeDefined();
      expect(context.services?.register).toBeUndefined(); // Not providing
    });

    it('should include storage when storage:local requested', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['storage:local'],
      };

      const context = factory.createContext(manifest);

      expect(context.storage).toBeDefined();
      expect(context.storage?.get).toBeDefined();
      expect(context.storage?.set).toBeDefined();
    });
  });

  describe('hierarchy', () => {
    it('should provide plugin ID', () => {
      const manifest: PluginManifest = {
        id: 'my-plugin',
        name: 'My Plugin',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
      };

      const context = factory.createContext(manifest);

      expect(context.pluginId).toBe('my-plugin');
    });

    it('should have get function for hierarchical resolution', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['storage:local'],
      };

      const context = factory.createContext(manifest);

      // Set a value in local storage
      context.storage?.set('myKey', 'myValue');

      // Should resolve via get
      expect(context.get('myKey')).toBe('myValue');
    });

    it('should resolve from parent context', () => {
      factory.setParentContext({ customValue: 'from-parent' } as any);

      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
      };

      const context = factory.createContext(manifest);

      expect(context.get('customValue')).toBe('from-parent');
    });
  });

  describe('immutability', () => {
    it('should freeze context object', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['document:read'],
      };

      const context = factory.createContext(manifest);

      expect(Object.isFrozen(context)).toBe(true);
    });

    it('should not allow adding properties', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
      };

      const context = factory.createContext(manifest);

      expect(() => {
        (context as any).newProp = 'value';
      }).toThrow();
    });

    it('should not allow modifying properties', () => {
      const manifest: PluginManifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
      };

      const context = factory.createContext(manifest);

      expect(() => {
        (context as any).pluginId = 'hacked';
      }).toThrow();
    });
  });

  describe('storage', () => {
    it('should persist to localStorage', () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['storage:local'],
      };

      const context = factory.createContext(manifest);
      context.storage?.set('key', 'value');

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should return default value if key not found', () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: ['storage:local'],
      };

      const context = factory.createContext(manifest);
      const value = context.storage?.get('unknown', 'default');

      expect(value).toBe('default');
    });
  });
});
