/**
 * Mock Event Bus for Testing
 * 
 * A lightweight event bus implementation for testing plugin event handling.
 */

/**
 * Event handler type
 */
type EventHandler = (data?: unknown) => void;

/**
 * Mock event bus interface
 */
export interface MockEventBus {
  /** Emit an event */
  emit(type: string, data?: unknown): void;
  
  /** Subscribe to an event */
  subscribe(type: string, handler: EventHandler): () => void;
  
  /** Get all emitted events */
  getEmittedEvents(): Array<{ type: string; data?: unknown }>;
  
  /** Get subscriber count for an event type */
  getSubscriberCount(type: string): number;
  
  /** Clear all emitted events */
  clearEmittedEvents(): void;
  
  /** Clear all subscriptions */
  clearSubscriptions(): void;
  
  /** Reset everything */
  reset(): void;
  
  /** Manually trigger an event for testing */
  simulateEvent(type: string, data?: unknown): void;
}

/**
 * Creates a mock event bus for testing
 */
export function createMockEventBus(): MockEventBus {
  const subscribers = new Map<string, Set<EventHandler>>();
  const emittedEvents: Array<{ type: string; data?: unknown }> = [];
  
  return {
    emit(type: string, data?: unknown): void {
      emittedEvents.push({ type, data });
      
      // Notify subscribers
      const handlers = subscribers.get(type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`[MockEventBus] Error in handler for ${type}:`, error);
          }
        });
      }
    },
    
    subscribe(type: string, handler: EventHandler): () => void {
      if (!subscribers.has(type)) {
        subscribers.set(type, new Set());
      }
      
      subscribers.get(type)!.add(handler);
      
      // Return unsubscribe function
      return () => {
        const handlers = subscribers.get(type);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            subscribers.delete(type);
          }
        }
      };
    },
    
    getEmittedEvents(): Array<{ type: string; data?: unknown }> {
      return [...emittedEvents];
    },
    
    getSubscriberCount(type: string): number {
      return subscribers.get(type)?.size ?? 0;
    },
    
    clearEmittedEvents(): void {
      emittedEvents.length = 0;
    },
    
    clearSubscriptions(): void {
      subscribers.clear();
    },
    
    reset(): void {
      emittedEvents.length = 0;
      subscribers.clear();
    },
    
    simulateEvent(type: string, data?: unknown): void {
      const handlers = subscribers.get(type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`[MockEventBus] Error in handler for ${type}:`, error);
          }
        });
      }
    },
  };
}
