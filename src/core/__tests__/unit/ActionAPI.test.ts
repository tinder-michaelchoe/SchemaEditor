/**
 * ActionAPI Tests
 * 
 * Tests for mutations, validation, and logging.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionAPI, type DocumentStore } from '../../ActionAPI';
import { eventBus } from '../../EventBus';

// Mock document store
function createMockStore(): DocumentStore {
  let data: unknown = { title: 'Test', items: [1, 2, 3] };

  return {
    getSchema: () => ({ type: 'object' }),
    getData: () => data,
    getValueAtPath: (path) => {
      let current: unknown = data;
      for (const segment of path) {
        if (current && typeof current === 'object') {
          current = (current as Record<string | number, unknown>)[segment];
        } else {
          return undefined;
        }
      }
      return current;
    },
    setValueAtPath: vi.fn((path, value) => {
      if (path.length === 0) {
        data = value;
        return;
      }
      // Simple implementation for testing
      let current = data as Record<string | number, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] as Record<string | number, unknown>;
      }
      current[path[path.length - 1]] = value;
    }),
    addArrayItem: vi.fn((path, value) => {
      const arr = (data as Record<string, unknown[]>)[path[0] as string];
      arr?.push(value);
    }),
    removeArrayItem: vi.fn((path, index) => {
      const arr = (data as Record<string, unknown[]>)[path[0] as string];
      arr?.splice(index, 1);
    }),
    addObjectProperty: vi.fn((path, key, value) => {
      (data as Record<string, unknown>)[key] = value;
    }),
    removeObjectProperty: vi.fn((path, key) => {
      delete (data as Record<string, unknown>)[key];
    }),
    setData: vi.fn((newData) => {
      data = newData;
    }),
    resetData: vi.fn(() => {
      data = { title: 'Default', items: [] };
    }),
    validate: vi.fn(() => ({
      isValid: true,
      errors: new Map(),
    })),
  };
}

describe('ActionAPI', () => {
  let api: ActionAPI;
  let store: DocumentStore;

  beforeEach(() => {
    api = new ActionAPI();
    store = createMockStore();
    api.setStore(store);
    eventBus.clear();
    vi.clearAllMocks();
  });

  describe('mutations', () => {
    it('should update value at path', () => {
      const result = api.updateValue('test-plugin', ['title'], 'New Title');

      expect(result.success).toBe(true);
      expect(store.setValueAtPath).toHaveBeenCalledWith(['title'], 'New Title');
    });

    it('should add array item', () => {
      const result = api.addArrayItem('test-plugin', ['items'], 4);

      expect(result.success).toBe(true);
      expect(store.addArrayItem).toHaveBeenCalledWith(['items'], 4);
    });

    it('should remove array item', () => {
      const result = api.removeArrayItem('test-plugin', ['items'], 1);

      expect(result.success).toBe(true);
      expect(store.removeArrayItem).toHaveBeenCalledWith(['items'], 1);
    });

    it('should add object property', () => {
      const result = api.addObjectProperty('test-plugin', [], 'newProp', 'value');

      expect(result.success).toBe(true);
      expect(store.addObjectProperty).toHaveBeenCalledWith([], 'newProp', 'value');
    });

    it('should remove object property', () => {
      const result = api.removeObjectProperty('test-plugin', [], 'title');

      expect(result.success).toBe(true);
      expect(store.removeObjectProperty).toHaveBeenCalledWith([], 'title');
    });

    it('should reset data to defaults', () => {
      const result = api.resetData('test-plugin');

      expect(result.success).toBe(true);
      expect(store.resetData).toHaveBeenCalled();
    });

    it('should set entire data', () => {
      const newData = { title: 'New', items: [] };
      const result = api.setData('test-plugin', newData);

      expect(result.success).toBe(true);
      expect(store.setData).toHaveBeenCalledWith(newData);
    });
  });

  describe('read operations', () => {
    it('should get value at path', () => {
      const value = api.getValue(['title']);
      expect(value).toBe('Test');
    });

    it('should get entire data', () => {
      const data = api.getData();
      expect(data).toEqual({ title: 'Test', items: [1, 2, 3] });
    });

    it('should get schema', () => {
      const schema = api.getSchema();
      expect(schema).toEqual({ type: 'object' });
    });
  });

  describe('error handling', () => {
    it('should return error if store not initialized', () => {
      const emptyApi = new ActionAPI();
      const result = emptyApi.updateValue('test', ['path'], 'value');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Store not initialized');
    });

    it('should handle store errors', () => {
      store.setValueAtPath = vi.fn(() => {
        throw new Error('Store error');
      });

      const result = api.updateValue('test-plugin', ['path'], 'value');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Store error');
    });
  });

  describe('events', () => {
    it('should emit document:changed after mutation', () => {
      const handler = vi.fn();
      eventBus.subscribe('document:changed', handler);

      api.updateValue('test-plugin', ['title'], 'New');

      expect(handler).toHaveBeenCalled();
    });

    it('should include path and value in event', () => {
      const handler = vi.fn();
      eventBus.subscribe('document:changed', handler);

      api.updateValue('test-plugin', ['title'], 'New');

      expect(handler).toHaveBeenCalledWith({
        path: ['title'],
        value: 'New',
        previousValue: 'Test',
      });
    });

    it('should trigger validation after mutation', () => {
      api.updateValue('test-plugin', ['title'], 'New');

      expect(store.validate).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('should log mutation with plugin attribution', () => {
      api.updateValue('my-plugin', ['title'], 'New');

      const log = api.getAuditLog();
      expect(log.length).toBe(1);
      expect(log[0].pluginId).toBe('my-plugin');
    });

    it('should include path and value in log', () => {
      api.updateValue('test-plugin', ['title'], 'New');

      const log = api.getAuditLog();
      expect(log[0].path).toEqual(['title']);
      expect(log[0].value).toBe('New');
    });

    it('should include timestamp in log', () => {
      const before = Date.now();
      api.updateValue('test-plugin', ['title'], 'New');
      const after = Date.now();

      const log = api.getAuditLog();
      expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(log[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should log action type', () => {
      api.updateValue('test-plugin', ['title'], 'New');
      api.addArrayItem('test-plugin', ['items'], 4);

      const log = api.getAuditLog();
      expect(log[0].action).toBe('updateValue');
      expect(log[1].action).toBe('addArrayItem');
    });

    it('should get audit log for specific plugin', () => {
      api.updateValue('plugin-a', ['title'], 'A');
      api.updateValue('plugin-b', ['title'], 'B');
      api.updateValue('plugin-a', ['title'], 'A2');

      const log = api.getAuditLogForPlugin('plugin-a');
      expect(log.length).toBe(2);
      expect(log.every((e) => e.pluginId === 'plugin-a')).toBe(true);
    });

    it('should respect audit log limit', () => {
      api.setAuditLogLimit(5);

      for (let i = 0; i < 10; i++) {
        api.updateValue('test-plugin', ['title'], `Value ${i}`);
      }

      const log = api.getAuditLog();
      expect(log.length).toBe(5);
    });

    it('should clear audit log', () => {
      api.updateValue('test-plugin', ['title'], 'New');
      api.clearAuditLog();

      expect(api.getAuditLog()).toEqual([]);
    });
  });

  describe('plugin-scoped API', () => {
    it('should create scoped API for plugin', () => {
      const pluginApi = api.createForPlugin('my-plugin');

      pluginApi.updateValue(['title'], 'New');

      const log = api.getAuditLog();
      expect(log[0].pluginId).toBe('my-plugin');
    });

    it('should support all operations', () => {
      const pluginApi = api.createForPlugin('my-plugin');

      pluginApi.updateValue(['title'], 'New');
      pluginApi.addArrayItem(['items'], 4);
      pluginApi.removeArrayItem(['items'], 0);
      pluginApi.addObjectProperty([], 'new', 'value');
      pluginApi.removeObjectProperty([], 'title');
      pluginApi.setData({ new: 'data' });
      pluginApi.resetData();

      const log = api.getAuditLog();
      expect(log.length).toBe(7);
    });

    it('should support read operations', () => {
      const pluginApi = api.createForPlugin('my-plugin');

      expect(pluginApi.getValue(['title'])).toBe('Test');
      expect(pluginApi.getData()).toEqual({ title: 'Test', items: [1, 2, 3] });
      expect(pluginApi.getSchema()).toEqual({ type: 'object' });
    });
  });
});
