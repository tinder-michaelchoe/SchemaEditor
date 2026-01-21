/**
 * Event Bus
 * 
 * Typed event system for cross-plugin communication.
 * Supports core events and plugin-namespaced events.
 */

import type { Unsubscribe, EventHandler } from './types/plugin';
import type {
  CoreEventType,
  GenericEventHandler,
  SubscriptionOptions,
  EventSubscription,
} from './types/events';
import { isCoreEvent } from './types/events';

// ============================================================================
// Event Bus Class
// ============================================================================

export class EventBus {
  private subscriptions = new Map<string, Set<EventSubscription>>();
  private eventHistory: Array<{ type: string; payload: unknown; timestamp: number }> = [];
  private historyLimit = 100;
  private strictMode = false;
  private pluginEmits = new Map<string, Set<string>>();

  /**
   * Enable strict mode (validates events against declared emits)
   */
  setStrictMode(enabled: boolean): void {
    this.strictMode = enabled;
  }

  /**
   * Register a plugin's declared emits
   */
  registerPluginEmits(pluginId: string, emits: string[]): void {
    this.pluginEmits.set(pluginId, new Set(emits));
  }

  /**
   * Unregister a plugin's declared emits
   */
  unregisterPluginEmits(pluginId: string): void {
    this.pluginEmits.delete(pluginId);
  }

  /**
   * Subscribe to an event
   */
  subscribe(
    eventType: string,
    handler: GenericEventHandler,
    options?: SubscriptionOptions & { pluginId?: string }
  ): Unsubscribe {
    let subs = this.subscriptions.get(eventType);
    if (!subs) {
      subs = new Set();
      this.subscriptions.set(eventType, subs);
    }

    const subscription: EventSubscription = {
      eventType,
      pluginId: options?.pluginId ?? 'core',
      handler,
      options,
    };

    subs.add(subscription);

    // Return unsubscribe function
    return () => {
      subs?.delete(subscription);
    };
  }

  /**
   * Subscribe to an event (once)
   */
  once(
    eventType: string,
    handler: GenericEventHandler,
    pluginId?: string
  ): Unsubscribe {
    return this.subscribe(eventType, handler, { once: true, pluginId });
  }

  /**
   * Emit an event
   */
  emit(eventType: string, payload?: unknown, pluginId?: string): void {
    // Validate in strict mode
    if (this.strictMode && pluginId && !isCoreEvent(eventType)) {
      const allowedEmits = this.pluginEmits.get(pluginId);
      if (allowedEmits && !allowedEmits.has(eventType)) {
        console.warn(
          `Plugin ${pluginId} emitting undeclared event: ${eventType}`
        );
        return; // Block in strict mode
      }
    }

    // Record in history
    this.recordEvent(eventType, payload);

    // Get subscribers
    const subs = this.subscriptions.get(eventType);
    if (!subs || subs.size === 0) {
      return;
    }

    // Sort by priority (higher first)
    const sorted = Array.from(subs).sort(
      (a, b) => (b.options?.priority ?? 0) - (a.options?.priority ?? 0)
    );

    // Call handlers
    const toRemove: EventSubscription[] = [];

    for (const subscription of sorted) {
      try {
        subscription.handler(payload);

        // Mark once subscriptions for removal
        if (subscription.options?.once) {
          toRemove.push(subscription);
        }
      } catch (error) {
        console.error(
          `Error in event handler for ${eventType} (${subscription.pluginId}):`,
          error
        );
      }
    }

    // Remove once subscriptions
    for (const sub of toRemove) {
      subs.delete(sub);
    }
  }

  /**
   * Emit a typed core event
   */
  emitCore<T extends CoreEventType>(
    type: T,
    payload: unknown
  ): void {
    this.emit(type, payload, 'core');
  }

  /**
   * Record an event in history
   */
  private recordEvent(type: string, payload: unknown): void {
    this.eventHistory.push({
      type,
      payload,
      timestamp: Date.now(),
    });

    // Trim history
    if (this.eventHistory.length > this.historyLimit) {
      this.eventHistory = this.eventHistory.slice(-this.historyLimit);
    }
  }

  /**
   * Get event history
   */
  getHistory(): Array<{ type: string; payload: unknown; timestamp: number }> {
    return [...this.eventHistory];
  }

  /**
   * Get history for a specific event type
   */
  getHistoryForType(
    eventType: string
  ): Array<{ payload: unknown; timestamp: number }> {
    return this.eventHistory
      .filter((e) => e.type === eventType)
      .map(({ payload, timestamp }) => ({ payload, timestamp }));
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Set history limit
   */
  setHistoryLimit(limit: number): void {
    this.historyLimit = limit;
    if (this.eventHistory.length > limit) {
      this.eventHistory = this.eventHistory.slice(-limit);
    }
  }

  /**
   * Unsubscribe all handlers for a plugin
   */
  unsubscribePlugin(pluginId: string): void {
    for (const [, subs] of this.subscriptions) {
      for (const sub of subs) {
        if (sub.pluginId === pluginId) {
          subs.delete(sub);
        }
      }
    }
  }

  /**
   * Get all subscriptions for an event type
   */
  getSubscriptions(eventType: string): EventSubscription[] {
    return Array.from(this.subscriptions.get(eventType) ?? []);
  }

  /**
   * Get all event types with subscriptions
   */
  getAllEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if an event type has subscribers
   */
  hasSubscribers(eventType: string): boolean {
    const subs = this.subscriptions.get(eventType);
    return subs !== undefined && subs.size > 0;
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
    this.pluginEmits.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global event bus instance
 */
export const eventBus = new EventBus();
