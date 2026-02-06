import { create } from 'zustand';
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

interface DragDropState {
  dragData: DragData | null;
  listeners: {
    dragStart: Set<(data: DragData) => void>;
    dragMove: Set<(data: DragData) => void>;
    dragEnd: Set<() => void>;
    drop: Set<(source: DragSource, target: DropTarget) => void>;
  };
}

export const useDragDropStore = create<DragDropState>(() => ({
  dragData: null,
  listeners: {
    dragStart: new Set(),
    dragMove: new Set(),
    dragEnd: new Set(),
    drop: new Set(),
  },
}));

/**
 * Creates a DragDropManager instance
 */
export function createDragDropManager(): IDragDropManager {
  return {
    isDragging: () => {
      return useDragDropStore.getState().dragData !== null;
    },

    getDragData: () => {
      return useDragDropStore.getState().dragData;
    },

    startDrag: (source, position) => {
      const dragData: DragData = {
        source,
        startPosition: position,
        currentPosition: position,
      };
      
      useDragDropStore.setState({ dragData });
      
      // Notify listeners
      const { listeners } = useDragDropStore.getState();
      listeners.dragStart.forEach(cb => cb(dragData));
    },

    updatePosition: (position) => {
      const { dragData } = useDragDropStore.getState();
      if (!dragData) return;
      
      const updatedData = {
        ...dragData,
        currentPosition: position,
      };
      
      useDragDropStore.setState({ dragData: updatedData });
      
      // Notify listeners
      const { listeners } = useDragDropStore.getState();
      listeners.dragMove.forEach(cb => cb(updatedData));
    },

    endDrag: () => {
      const { dragData } = useDragDropStore.getState();
      console.log('[DragDropManager] endDrag called, current dragData:', dragData ? 'exists' : 'null');

      // Call onDragEnd callback with success=false (cancelled)
      if (dragData?.source.onDragEnd) {
        dragData.source.onDragEnd(false);
      }

      useDragDropStore.setState({ dragData: null });
      console.log('[DragDropManager] dragData cleared');

      // Notify listeners
      const { listeners } = useDragDropStore.getState();
      listeners.dragEnd.forEach(cb => cb());
    },

    canDrop: (target) => {
      const { dragData } = useDragDropStore.getState();
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
      const { dragData, listeners } = useDragDropStore.getState();
      if (!dragData) return;

      // Call onDragEnd callback with success=true
      if (dragData.source.onDragEnd) {
        dragData.source.onDragEnd(true);
      }

      // Notify drop listeners
      listeners.drop.forEach(cb => cb(dragData.source, target));

      // End the drag
      useDragDropStore.setState({ dragData: null });
      listeners.dragEnd.forEach(cb => cb());
    },

    onDragStart: (callback) => {
      const { listeners } = useDragDropStore.getState();
      listeners.dragStart.add(callback);
      return () => {
        listeners.dragStart.delete(callback);
      };
    },

    onDragMove: (callback) => {
      const { listeners } = useDragDropStore.getState();
      listeners.dragMove.add(callback);
      return () => {
        listeners.dragMove.delete(callback);
      };
    },

    onDragEnd: (callback) => {
      const { listeners } = useDragDropStore.getState();
      listeners.dragEnd.add(callback);
      return () => {
        listeners.dragEnd.delete(callback);
      };
    },

    onDrop: (callback) => {
      const { listeners } = useDragDropStore.getState();
      listeners.drop.add(callback);
      return () => {
        listeners.drop.delete(callback);
      };
    },
  };
}
