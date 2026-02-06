import { definePlugin } from '@/core';
import { manifest } from './manifest';
import { createDragDropManager } from './DragDropManager';
import type { IDragDropManager } from './DragDropManager';

let dragDropManager: IDragDropManager | null = null;

export default definePlugin({
  manifest,
  onActivate: (ctx) => {
    console.log('[drag-drop-service] Plugin activated');
    
    // Create the drag-drop manager instance
    dragDropManager = createDragDropManager();
    
    // Register as a service if services are available
    if (ctx.services) {
      // The service registry should be populated externally
      // For now, we expose the manager via module export
    }
  },
  onDeactivate: () => {
    console.log('[drag-drop-service] Plugin deactivated');
    dragDropManager = null;
  },
});

// Export the manager getter for use by other plugins
export function getDragDropManager(): IDragDropManager | null {
  return dragDropManager;
}

export { manifest };
export { DragPreview } from './DragPreview';
export { useDragSource, useDropTarget, useDragState } from './useDragDrop';
export { useDragDropStore, createDragDropManager } from './DragDropManager';
export {
  DragDropRegistry,
  getDragDropRegistry,
  initDragDropRegistry
} from './DragDropRegistry';
export {
  DropZoneOverlay,
  useDropZoneOverlay,
} from './components/DropZoneOverlay';
export { DropZoneLine } from './components/DropZoneLine';
export { DropZoneHighlight } from './components/DropZoneHighlight';
export type {
  IDragDropManager,
  DragSource,
  DropTarget,
  DragData,
  DragSourceType,
} from './DragDropManager';
export type {
  DropZoneVisual,
  ComponentDragConfig,
} from './DragDropRegistry';
