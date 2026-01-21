/**
 * EventBus Tests
 * 
 * Tests for event subscription, emission, and validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('subscription', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      bus.subscribe('test:event', handler);

      bus.emit('test:event', { value: 'test' });

      expect(handler).toHaveBeenCalledWith({ value: 'test' });
    });

    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      const unsubscribe = bus.subscribe('test:event', handler);
      unsubscribe();

      bus.emit('test:event', { value: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.subscribe('test:event', handler1);
      bus.subscribe('test:event', handler2);
      bus.emit('test:event', { value: 'test' });

      expect(handler1).toHaveBeenCalledWith({ value: 'test' });
      expect(handler2).toHaveBeenCalledWith({ value: 'test' });
    });

    it('should support once subscription', () => {
      const handler = vi.fn();
      bus.once('test:event', handler);

      bus.emit('test:event', { value: 1 });
      bus.emit('test:event', { value: 2 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ value: 1 });
    });
  });

  describe('emission', () => {
    it('should emit to all subscribers', () => {
      const handlers = [vi.fn(), vi.fn(), vi.fn()];
      handlers.forEach((h) => bus.subscribe('test:event', h));

      bus.emit('test:event', 'payload');

      handlers.forEach((h) => {
        expect(h).toHaveBeenCalledWith('payload');
      });
    });

    it('should pass payload to subscribers', () => {
      const handler = vi.fn();
      bus.subscribe('test:event', handler);

      const payload = { data: [1, 2, 3], nested: { value: 'test' } };
      bus.emit('test:event', payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should handle undefined payload', () => {
      const handler = vi.fn();
      bus.subscribe('test:event', handler);

      bus.emit('test:event');

      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should continue emitting even if handler throws', () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler error');
      });
      const handler2 = vi.fn();

      bus.subscribe('test:event', handler1);
      bus.subscribe('test:event', handler2);

      // Should not throw
      bus.emit('test:event', 'payload');

      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('strict mode', () => {
    it('should validate event against declared emits', () => {
      bus.setStrictMode(true);
      bus.registerPluginEmits('my-plugin', ['allowed:event']);

      const handler = vi.fn();
      bus.subscribe('not-allowed:event', handler);

      // Should not emit (blocked in strict mode)
      bus.emit('not-allowed:event', 'payload', 'my-plugin');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow declared events', () => {
      bus.setStrictMode(true);
      bus.registerPluginEmits('my-plugin', ['allowed:event']);

      const handler = vi.fn();
      bus.subscribe('allowed:event', handler);

      bus.emit('allowed:event', 'payload', 'my-plugin');

      expect(handler).toHaveBeenCalledWith('payload');
    });

    it('should always allow core events', () => {
      bus.setStrictMode(true);
      bus.registerPluginEmits('my-plugin', []);

      const handler = vi.fn();
      bus.subscribe('document:changed', handler);

      bus.emitCore('document:changed', { path: [], value: 'test', previousValue: null });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('priority', () => {
    it('should call handlers in priority order', () => {
      const order: number[] = [];

      bus.subscribe('test:event', () => order.push(1), { priority: 10 });
      bus.subscribe('test:event', () => order.push(2), { priority: 100 });
      bus.subscribe('test:event', () => order.push(3), { priority: 50 });

      bus.emit('test:event');

      expect(order).toEqual([2, 3, 1]);
    });
  });

  describe('history', () => {
    it('should record events', () => {
      bus.emit('event-1', 'payload-1');
      bus.emit('event-2', 'payload-2');

      const history = bus.getHistory();

      expect(history.length).toBe(2);
      expect(history[0].type).toBe('event-1');
      expect(history[0].payload).toBe('payload-1');
      expect(history[1].type).toBe('event-2');
    });

    it('should include timestamps', () => {
      const before = Date.now();
      bus.emit('test:event', 'payload');
      const after = Date.now();

      const history = bus.getHistory();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(history[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should respect history limit', () => {
      bus.setHistoryLimit(5);

      for (let i = 0; i < 10; i++) {
        bus.emit(`event-${i}`, i);
      }

      const history = bus.getHistory();
      expect(history.length).toBe(5);
      expect(history[0].type).toBe('event-5'); // First 5 trimmed
    });

    it('should get history for specific event type', () => {
      bus.emit('type-a', 1);
      bus.emit('type-b', 2);
      bus.emit('type-a', 3);

      const history = bus.getHistoryForType('type-a');

      expect(history.length).toBe(2);
      expect(history[0].payload).toBe(1);
      expect(history[1].payload).toBe(3);
    });

    it('should clear history', () => {
      bus.emit('event-1', 'payload');
      bus.clearHistory();

      expect(bus.getHistory()).toEqual([]);
    });
  });

  describe('plugin management', () => {
    it('should unsubscribe all handlers for a plugin', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.subscribe('event-1', handler1, { pluginId: 'plugin-a' });
      bus.subscribe('event-2', handler2, { pluginId: 'plugin-b' });

      bus.unsubscribePlugin('plugin-a');

      bus.emit('event-1', 'payload');
      bus.emit('event-2', 'payload');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unregister plugin emits', () => {
      bus.setStrictMode(true);
      bus.registerPluginEmits('my-plugin', ['allowed:event']);

      const handler = vi.fn();
      bus.subscribe('allowed:event', handler);

      // Should work
      bus.emit('allowed:event', 'payload', 'my-plugin');
      expect(handler).toHaveBeenCalledTimes(1);

      // Unregister emits
      bus.unregisterPluginEmits('my-plugin');

      // After unregistering, the plugin has no registered emits,
      // so in current implementation, it's allowed through (no restriction to check against)
      // This is by design - plugins without registered emits are not restricted
      bus.emit('allowed:event', 'payload', 'my-plugin');
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('queries', () => {
    it('should get all event types with subscribers', () => {
      bus.subscribe('event-a', vi.fn());
      bus.subscribe('event-b', vi.fn());

      const types = bus.getAllEventTypes();

      expect(types).toContain('event-a');
      expect(types).toContain('event-b');
    });

    it('should check if event type has subscribers', () => {
      bus.subscribe('event-a', vi.fn());

      expect(bus.hasSubscribers('event-a')).toBe(true);
      expect(bus.hasSubscribers('event-b')).toBe(false);
    });

    it('should get subscriptions for event type', () => {
      const handler = vi.fn();
      bus.subscribe('test:event', handler, { pluginId: 'my-plugin' });

      const subs = bus.getSubscriptions('test:event');

      expect(subs.length).toBe(1);
      expect(subs[0].pluginId).toBe('my-plugin');
    });
  });
});
