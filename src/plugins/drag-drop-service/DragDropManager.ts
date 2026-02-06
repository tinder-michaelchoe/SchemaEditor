import { useSyncExternalStore } from 'react';
import type * as React from 'react';

// Types for drag-drop operations
export type DragSourceType =
  | 'layer-node'        // Existing layer in tree
  | 'palette-component' // New component from palette
  | 'canvas-node'       // Component on canvas
  | 'file'              // External file (images, etc.)
  | 'component'         // Legacy/generic component (backwards compat)
  | 'node'              // Legacy/generic node (backwards compat)
  | 'template';         // Legacy/generic template (backwards compat)

export interface DragSource {
  type: DragSourceType;
  data: unknown;
  preview?: React.ReactNode;
  sourcePluginId?: string;
  sourceId?: string;    // Unique ID for the drag source
  onDragEnd?: (success: boolean) => void;
}

export interface DropTarget {
  path: string;
  position: 'before' | 'after' | 'inside';
  accepts?: DragSourceType[];
  validator?: (source: DragSource) => boolean;  // Custom validation function
  priority?: number;    // Higher priority wins in overlaps (default: 0)
}

export interface DragData {
  source: DragSource;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

export interface IDragDropManager {
  // State
  isDragging: () => boolean;
  getDragData: () => DragData | null;

  // Actions
  startDrag: (source: DragSource, position: { x: number; y: number }) => void;
  updatePosition: (position: { x: number; y: number }) => void;
  endDrag: () => void;

  // Drop validation
  canDrop: (target: DropTarget) => boolean;
  handleDrop: (target: DropTarget) => void;

  // Event subscription
  onDragStart: (callback: (data: DragData) => void) => () => void;
  onDragMove: (callback: (data: DragData) => void) => () => void;
  onDragEnd: (callback: () => void) => () => void;
  onDrop: (callback: (source: DragSource, target: DropTarget) => void) => () => void;
}

// ─── Module-level mutable state (replaces Zustand store) ─────────────────────

let dragData: DragData | null = null;

const eventListeners = {
  dragStart: new Set<(data: DragData) => void>(),
  dragMove: new Set<(data: DragData) => void>(),
  dragEnd: new Set<() => void>(),
  drop: new Set<(source: DragSource, target: DropTarget) => void>(),
};

// ─── React subscription mechanism (useSyncExternalStore) ─────────────────────

const reactSubscribers = new Set<() => void>();

function notifyReact(): void {
  reactSubscribers.forEach(cb => cb());
}

function subscribe(cb: () => void): () => void {
  reactSubscribers.add(cb);
  return () => { reactSubscribers.delete(cb); };
}

function getSnapshot(): DragData | null {
  return dragData;
}

function getServerSnapshot(): DragData | null {
  return null;
}

/** React hook to subscribe to drag data changes */
export function useDragData(): DragData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Creates a DragDropManager instance
 */
export function createDragDropManager(): IDragDropManager {
  return {
    isDragging: () => {
      return dragData !== null;
    },

    getDragData: () => {
      return dragData;
    },

    startDrag: (source, position) => {
      dragData = {
        source,
        startPosition: position,
        currentPosition: position,
      };

      notifyReact();

      // Notify listeners
      eventListeners.dragStart.forEach(cb => cb(dragData!));
    },

    updatePosition: (position) => {
      if (!dragData) return;

      dragData = {
        ...dragData,
        currentPosition: position,
      };

      notifyReact();

      // Notify listeners
      eventListeners.dragMove.forEach(cb => cb(dragData!));
    },

    endDrag: () => {
      console.log('[DragDropManager] endDrag called, current dragData:', dragData ? 'exists' : 'null');

      // Call onDragEnd callback with success=false (cancelled)
      if (dragData?.source.onDragEnd) {
        dragData.source.onDragEnd(false);
      }

      dragData = null;
      console.log('[DragDropManager] dragData cleared');

      notifyReact();

      // Notify listeners
      eventListeners.dragEnd.forEach(cb => cb());
    },

    canDrop: (target) => {
      if (!dragData) return false;

      // If target specifies accepted types, check if source matches
      if (target.accepts && !target.accepts.includes(dragData.source.type)) {
        return false;
      }

      // Run custom validator if provided
      if (target.validator && !target.validator(dragData.source)) {
        return false;
      }

      // Can't drop a node into itself or its descendants
      if (dragData.source.type === 'node' || dragData.source.type === 'layer-node' || dragData.source.type === 'canvas-node') {
        const sourcePath = dragData.source.data as { path?: string };
        if (sourcePath.path && target.path.startsWith(sourcePath.path)) {
          return false;
        }
      }

      return true;
    },

    handleDrop: (target) => {
      if (!dragData) return;

      // Call onDragEnd callback with success=true
      if (dragData.source.onDragEnd) {
        dragData.source.onDragEnd(true);
      }

      // Notify drop listeners
      eventListeners.drop.forEach(cb => cb(dragData!.source, target));

      // End the drag
      dragData = null;
      notifyReact();
      eventListeners.dragEnd.forEach(cb => cb());
    },

    onDragStart: (callback) => {
      eventListeners.dragStart.add(callback);
      return () => {
        eventListeners.dragStart.delete(callback);
      };
    },

    onDragMove: (callback) => {
      eventListeners.dragMove.add(callback);
      return () => {
        eventListeners.dragMove.delete(callback);
      };
    },

    onDragEnd: (callback) => {
      eventListeners.dragEnd.add(callback);
      return () => {
        eventListeners.dragEnd.delete(callback);
      };
    },

    onDrop: (callback) => {
      eventListeners.drop.add(callback);
      return () => {
        eventListeners.drop.delete(callback);
      };
    },
  };
}
