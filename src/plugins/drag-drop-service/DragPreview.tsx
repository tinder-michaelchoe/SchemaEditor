import React from 'react';
import { useDragDropStore } from './DragDropManager';

interface DragPreviewProps {
  /**
   * Custom render function for the preview
   * If not provided, a default preview will be shown
   */
  renderPreview?: (data: { type: string; data: unknown }) => React.ReactNode;
}

/**
 * Floating preview that follows the cursor during drag operations
 * Should be rendered at the app root level
 */
export function DragPreview({ renderPreview }: DragPreviewProps) {
  const dragData = useDragDropStore((state) => state.dragData);
  
  if (!dragData) {
    return null;
  }
  
  const { source, currentPosition } = dragData;
  
  // Offset from cursor
  const offsetX = 12;
  const offsetY = 12;
  
  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: currentPosition.x + offsetX,
        top: currentPosition.y + offsetY,
        transform: 'translate(0, 0)',
      }}
    >
      {/* Custom preview from source */}
      {source.preview ? (
        source.preview
      ) : renderPreview ? (
        renderPreview({ type: source.type, data: source.data })
      ) : (
        // Default preview
        <DefaultDragPreview type={source.type} data={source.data} />
      )}
    </div>
  );
}

interface DefaultDragPreviewProps {
  type: string;
  data: unknown;
}

function DefaultDragPreview({ type, data }: DefaultDragPreviewProps) {
  const getLabel = () => {
    if (type === 'component') {
      const componentData = data as { type?: string; name?: string };
      return componentData.name || componentData.type || 'Component';
    }
    if (type === 'node') {
      const nodeData = data as { path?: string; type?: string };
      return nodeData.type || nodeData.path || 'Node';
    }
    if (type === 'template') {
      const templateData = data as { name?: string };
      return templateData.name || 'Template';
    }
    return 'Dragging...';
  };
  
  return (
    <div className="
      px-3 py-2 rounded-lg shadow-lg
      bg-[var(--bg-primary)] border border-[var(--accent-color)]
      text-sm font-medium text-[var(--text-primary)]
      opacity-90
    ">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-color)]" />
        {getLabel()}
      </div>
    </div>
  );
}
