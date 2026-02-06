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
  const getPreviewContent = () => {
    // Palette component
    if (type === 'palette-component') {
      const componentData = data as { type?: string; name?: string; icon?: string };
      return {
        icon: componentData.icon || getComponentIcon(componentData.type),
        label: componentData.name || componentData.type || 'Component',
        color: 'var(--accent-color)',
      };
    }

    // Layer node (from layer tree)
    if (type === 'layer-node') {
      const nodeData = data as { path?: string; type?: string; name?: string; contentPreview?: string | null };
      const baseLabel = nodeData.name || nodeData.type || 'Layer';
      const fullLabel = nodeData.contentPreview
        ? `${baseLabel} "${nodeData.contentPreview}"`
        : baseLabel;
      return {
        icon: getComponentIcon(nodeData.type),
        label: fullLabel,
        color: 'var(--accent-color)',
      };
    }

    // Canvas node (from canvas)
    if (type === 'canvas-node') {
      const nodeData = data as { type?: string; name?: string };
      return {
        icon: getComponentIcon(nodeData.type),
        label: nodeData.name || nodeData.type || 'Component',
        color: 'var(--accent-color)',
      };
    }

    // File drag (images, etc.)
    if (type === 'file') {
      const fileData = data as { name?: string; type?: string };
      return {
        icon: '📄',
        label: fileData.name || 'File',
        color: 'var(--accent-color)',
      };
    }

    // Legacy types (backwards compatibility)
    if (type === 'component') {
      const componentData = data as { type?: string; name?: string };
      return {
        icon: '📦',
        label: componentData.name || componentData.type || 'Component',
        color: 'var(--accent-color)',
      };
    }

    if (type === 'node') {
      const nodeData = data as { path?: string; type?: string };
      return {
        icon: '🔲',
        label: nodeData.type || nodeData.path || 'Node',
        color: 'var(--accent-color)',
      };
    }

    if (type === 'template') {
      const templateData = data as { name?: string };
      return {
        icon: '📋',
        label: templateData.name || 'Template',
        color: 'var(--accent-color)',
      };
    }

    return {
      icon: '🔄',
      label: 'Dragging...',
      color: 'var(--accent-color)',
    };
  };

  const { icon, label, color } = getPreviewContent();

  return (
    <div className="
      px-3 py-2 rounded-lg shadow-lg
      bg-[var(--bg-primary)] border-2
      text-sm font-medium text-[var(--text-primary)]
      opacity-95 backdrop-blur-sm
    "
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

/**
 * Get icon for component type
 */
function getComponentIcon(componentType?: string): string {
  const iconMap: Record<string, string> = {
    // Layout containers
    vstack: '⬇️',
    hstack: '➡️',
    zstack: '📚',

    // Components
    label: '📝',
    button: '🔘',
    textfield: '📄',
    image: '🖼️',
    toggle: '🔘',
    slider: '🎚️',
    divider: '➖',
    spacer: '⬜',
    gradient: '🌈',

    // Special
    sectionLayout: '📑',
    forEach: '🔁',
  };

  return iconMap[componentType || ''] || '📦';
}
