/**
 * SimpleAPI Tests
 * 
 * Tests for the simplified "Twenty Things" API.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleAPIFactory, type NotificationType } from '../../SimpleAPI';
import { actionAPI } from '../../ActionAPI';
import { eventBus } from '../../EventBus';
import type { CoreStores } from '../../PluginContext';

// Mock core stores
function createMockStores(): CoreStores {
  return {
    document: {
      getSchema: () => ({ type: 'object', title: 'Test Schema' }),
      getSchemaContext: () => null,
      getData: () => ({ title: 'Test', count: 42 }),
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
      getExpandedPaths: () => new Set(),
      toggleDarkMode: vi.fn(),
      setViewMode: vi.fn(),
      toggleExpanded: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
    },
  };
}

describe('SimpleAPI', () => {
  let factory: SimpleAPIFactory;
  let stores: CoreStores;

  beforeEach(() => {
    factory = new SimpleAPIFactory();
    stores = createMockStores();
    factory.setStores(stores);
    eventBus.clear();
    actionAPI.clear();
  });

  describe('document access', () => {
    it('should read schema', () => {
      const api = factory.create('test-plugin');

      expect(api.schema).toEqual({ type: 'object', title: 'Test Schema' });
    });

    it('should read data', () => {
      const api = factory.create('test-plugin');

      expect(api.data).toEqual({ title: 'Test', count: 42 });
    });

    it('should read isValid', () => {
      const api = factory.create('test-plugin');

      expect(api.isValid).toBe(true);
    });

    it('should return null schema when not available', () => {
      const emptyFactory = new SimpleAPIFactory();
      const api = emptyFactory.create('test');

      expect(api.schema).toBeNull();
    });
  });

  describe('value access', () => {
    it('should getValue at path', () => {
      // Set up action API with mock store
      actionAPI.setStore({
        getSchema: () => ({}),
        getData: () => ({ title: 'Test', nested: { value: 123 } }),
        getValueAtPath: (path) => {
          if (path.length === 0) return { title: 'Test', nested: { value: 123 } };
          if (path[0] === 'title') return 'Test';
          if (path[0] === 'nested' && path[1] === 'value') return 123;
          return undefined;
        },
        setValueAtPath: vi.fn(),
        addArrayItem: vi.fn(),
        removeArrayItem: vi.fn(),
        addObjectProperty: vi.fn(),
        removeObjectProperty: vi.fn(),
        setData: vi.fn(),
        resetData: vi.fn(),
        validate: vi.fn(() => ({ isValid: true, errors: new Map() })),
      });

      const api = factory.create('test-plugin');

      expect(api.getValue('root.title')).toBe('Test');
      expect(api.getValue('root.nested.value')).toBe(123);
    });

    it('should setValue at path', () => {
      const setValueMock = vi.fn();
      actionAPI.setStore({
        getSchema: () => ({}),
        getData: () => ({}),
        getValueAtPath: () => undefined,
        setValueAtPath: setValueMock,
        addArrayItem: vi.fn(),
        removeArrayItem: vi.fn(),
        addObjectProperty: vi.fn(),
        removeObjectProperty: vi.fn(),
        setData: vi.fn(),
        resetData: vi.fn(),
        validate: vi.fn(() => ({ isValid: true, errors: new Map() })),
      });

      const api = factory.create('test-plugin');
      api.setValue('root.title', 'New Title');

      expect(setValueMock).toHaveBeenCalledWith(['title'], 'New Title');
    });
  });

  describe('selection', () => {
    it('should read selectedPath', () => {
      const api = factory.create('test-plugin');

      expect(api.selectedPath).toBe('root.title');
    });

    it('should select path', () => {
      const api = factory.create('test-plugin');
      api.select('root.count');

      expect(stores.selection.setSelectedPath).toHaveBeenCalledWith('root.count');
    });

    it('should select null', () => {
      const api = factory.create('test-plugin');
      api.select(null);

      expect(stores.selection.setSelectedPath).toHaveBeenCalledWith(null);
    });
  });

  describe('UI', () => {
    it('should read isDarkMode', () => {
      const api = factory.create('test-plugin');

      expect(api.isDarkMode).toBe(true);
    });
  });

  describe('notifications', () => {
    it('should show info notification', () => {
      const handler = vi.fn();
      factory.setNotificationHandler(handler);

      const api = factory.create('test-plugin');
      api.notify('Info message', 'info');

      expect(handler).toHaveBeenCalledWith('Info message', 'info');
    });

    it('should show success notification', () => {
      const handler = vi.fn();
      factory.setNotificationHandler(handler);

      const api = factory.create('test-plugin');
      api.notify('Success!', 'success');

      expect(handler).toHaveBeenCalledWith('Success!', 'success');
    });

    it('should show warning notification', () => {
      const handler = vi.fn();
      factory.setNotificationHandler(handler);

      const api = factory.create('test-plugin');
      api.notify('Warning!', 'warning');

      expect(handler).toHaveBeenCalledWith('Warning!', 'warning');
    });

    it('should show error notification', () => {
      const handler = vi.fn();
      factory.setNotificationHandler(handler);

      const api = factory.create('test-plugin');
      api.notify('Error!', 'error');

      expect(handler).toHaveBeenCalledWith('Error!', 'error');
    });

    it('should fallback to console when no handler', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const api = factory.create('test-plugin');
      api.notify('Console message', 'info');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('events', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      const api = factory.create('test-plugin');

      api.on('test:event', handler);
      eventBus.emit('test:event', { value: 'test' });

      expect(handler).toHaveBeenCalledWith({ value: 'test' });
    });

    it('should emit events', () => {
      const handler = vi.fn();
      eventBus.subscribe('test:event', handler);

      const api = factory.create('test-plugin');
      api.emit('test:event', { value: 'emitted' });

      expect(handler).toHaveBeenCalledWith({ value: 'emitted' });
    });

    it('should unsubscribe on cleanup', () => {
      const handler = vi.fn();
      const api = factory.create('test-plugin');

      const unsubscribe = api.on('test:event', handler);
      unsubscribe();

      eventBus.emit('test:event', { value: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('factory', () => {
    it('should reuse API instances for same plugin', () => {
      const api1 = factory.create('test-plugin');
      const api2 = factory.create('test-plugin');

      expect(api1).toBe(api2);
    });

    it('should create different instances for different plugins', () => {
      const api1 = factory.create('plugin-a');
      const api2 = factory.create('plugin-b');

      expect(api1).not.toBe(api2);
    });

    it('should remove plugin API', () => {
      const api1 = factory.create('test-plugin');
      factory.remove('test-plugin');
      const api2 = factory.create('test-plugin');

      expect(api1).not.toBe(api2);
    });

    it('should update stores for existing instances', () => {
      const api = factory.create('test-plugin');
      expect(api.isDarkMode).toBe(true);

      // Update with new stores
      const newStores = createMockStores();
      newStores.ui.isDarkMode = () => false;
      factory.setStores(newStores);

      expect(api.isDarkMode).toBe(false);
    });

    it('should update notification handler for existing instances', () => {
      const api = factory.create('test-plugin');

      const newHandler = vi.fn();
      factory.setNotificationHandler(newHandler);

      api.notify('Test', 'info');
      expect(newHandler).toHaveBeenCalled();
    });
  });
});
