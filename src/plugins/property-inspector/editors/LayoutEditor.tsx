import React, { useCallback } from 'react';
import { 
  Lock,
  Unlock,
  Maximize2,
  Pin,
} from 'lucide-react';

interface PaddingValue {
  top?: number;
  bottom?: number;
  leading?: number;
  trailing?: number;
}

interface LayoutEditorProps {
  width?: number;
  height?: number;
  fillWidth: boolean;
  aspectRatioLocked: boolean;
  pinnedEdges: string[];
  contentMode: string;
  padding?: PaddingValue;
  onChange: (updates: Record<string, unknown>) => void;
}

const CONTENT_MODES = [
  { value: 'aspectFit', label: 'Fit', description: 'Scale to fit, may have letterboxing' },
  { value: 'aspectFill', label: 'Fill', description: 'Scale to fill, may crop' },
  { value: 'stretch', label: 'Stretch', description: 'Stretch to fill exactly' },
  { value: 'center', label: 'Center', description: 'No scaling, centered' },
];

export function LayoutEditor({
  width,
  height,
  fillWidth,
  aspectRatioLocked,
  pinnedEdges,
  contentMode,
  padding = {},
  onChange,
}: LayoutEditorProps) {
  
  // Check if horizontal/vertical dimensions are pinned
  const isHorizontalPinned = pinnedEdges.includes('left') && pinnedEdges.includes('right');
  const isVerticalPinned = pinnedEdges.includes('top') && pinnedEdges.includes('bottom');
  
  // Default values for display only
  const displayWidth = width ?? 100;
  const displayHeight = height ?? 100;
  
  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10) || 100;
    if (aspectRatioLocked && height && height > 0 && width && width > 0) {
      const aspectRatio = width / height;
      onChange({ width: newWidth, height: Math.round(newWidth / aspectRatio) });
    } else {
      onChange({ width: newWidth });
    }
  }, [width, height, aspectRatioLocked, onChange]);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10) || 100;
    if (aspectRatioLocked && width && width > 0 && height && height > 0) {
      const aspectRatio = width / height;
      onChange({ height: newHeight, width: Math.round(newHeight * aspectRatio) });
    } else {
      onChange({ height: newHeight });
    }
  }, [width, height, aspectRatioLocked, onChange]);

  const handleToggleAspectRatio = useCallback(() => {
    onChange({ _aspectRatioLocked: !aspectRatioLocked });
  }, [aspectRatioLocked, onChange]);

  const handleToggleFillWidth = useCallback(() => {
    const newFillWidth = !fillWidth;
    if (newFillWidth) {
      // When enabling fill width, set padding and remove absolute width
      onChange({ 
        fillWidth: newFillWidth,
        padding: { ...padding, leading: padding.leading ?? 0, trailing: padding.trailing ?? 0 },
        width: undefined, // Remove absolute width
      });
    } else {
      // When disabling, restore default width
      onChange({ fillWidth: newFillWidth, width: displayWidth });
    }
  }, [fillWidth, padding, displayWidth, onChange]);

  const handleToggleEdgePin = useCallback((edge: string) => {
    const newPins = pinnedEdges.includes(edge)
      ? pinnedEdges.filter(e => e !== edge)
      : [...pinnedEdges, edge];
    
    const updates: Record<string, unknown> = { _pinnedEdges: newPins };
    const willBeHorizontalPinned = newPins.includes('left') && newPins.includes('right');
    const willBeVerticalPinned = newPins.includes('top') && newPins.includes('bottom');
    
    // When pinning both left and right, enable fillWidth and remove absolute width
    if (willBeHorizontalPinned) {
      updates.fillWidth = true;
      updates.padding = { 
        ...padding, 
        leading: padding.leading ?? 0, 
        trailing: padding.trailing ?? 0 
      };
      updates.width = undefined; // Remove absolute width - will stretch to fill
    }
    
    // When pinning both top and bottom, remove absolute height
    if (willBeVerticalPinned) {
      updates.padding = { 
        ...(updates.padding || padding), 
        top: padding.top ?? 0, 
        bottom: padding.bottom ?? 0 
      };
      updates.height = undefined; // Remove absolute height - will stretch to fill
    }
    
    // When unpinning horizontal, restore width
    if (!willBeHorizontalPinned && isHorizontalPinned) {
      updates.fillWidth = false;
      updates.width = displayWidth;
    }
    
    // When unpinning vertical, restore height
    if (!willBeVerticalPinned && isVerticalPinned) {
      updates.height = displayHeight;
    }
    
    onChange(updates);
  }, [pinnedEdges, padding, isHorizontalPinned, isVerticalPinned, displayWidth, displayHeight, onChange]);

  const handlePaddingChange = useCallback((side: keyof PaddingValue, value: number) => {
    onChange({ 
      padding: { ...padding, [side]: value } 
    });
  }, [padding, onChange]);

  const handleContentModeChange = useCallback((mode: string) => {
    onChange({ contentMode: mode });
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Size inputs - only show when not pinned */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-[var(--text-tertiary)] mb-0.5 block">Width</label>
          <input
            type="number"
            value={isHorizontalPinned ? '' : (width ?? '')}
            onChange={handleWidthChange}
            disabled={isHorizontalPinned}
            placeholder={isHorizontalPinned ? 'Fill' : '100'}
            className="w-full px-2 py-1 text-sm rounded border border-[var(--border-color)]
                       bg-[var(--bg-primary)] text-[var(--text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        <button
          onClick={handleToggleAspectRatio}
          disabled={isHorizontalPinned && isVerticalPinned}
          className={`
            mt-4 p-1.5 rounded transition-colors
            ${aspectRatioLocked 
              ? 'bg-[var(--accent-color)] text-white' 
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {aspectRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
        
        <div className="flex-1">
          <label className="text-[10px] text-[var(--text-tertiary)] mb-0.5 block">Height</label>
          <input
            type="number"
            value={isVerticalPinned ? '' : (height ?? '')}
            onChange={handleHeightChange}
            disabled={isVerticalPinned}
            placeholder={isVerticalPinned ? 'Fill' : '100'}
            className="w-full px-2 py-1 text-sm rounded border border-[var(--border-color)]
                       bg-[var(--bg-primary)] text-[var(--text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Edge pinning */}
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] mb-1.5 block">Pin to parent edges</label>
        <div className="grid grid-cols-4 gap-1">
          {['top', 'bottom', 'left', 'right'].map((edge) => {
            const isPinned = pinnedEdges.includes(edge);
            return (
              <button
                key={edge}
                onClick={() => handleToggleEdgePin(edge)}
                className={`
                  px-2 py-1.5 rounded text-[10px] font-medium capitalize
                  transition-colors flex items-center justify-center gap-1
                  ${isPinned 
                    ? 'bg-[var(--accent-color)] text-white' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }
                `}
                title={isPinned ? `Unpin from ${edge}` : `Pin to ${edge}`}
              >
                <Pin className="w-2.5 h-2.5" />
                {edge}
              </button>
            );
          })}
        </div>
      </div>

      {/* Padding - show when any edge is pinned */}
      {pinnedEdges.length > 0 && (
        <div>
          <label className="text-[10px] text-[var(--text-tertiary)] mb-1.5 block">Padding from edges</label>
          <div className="grid grid-cols-2 gap-2">
            {pinnedEdges.includes('top') && (
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)]">Top</label>
                <input
                  type="number"
                  value={padding.top ?? 0}
                  onChange={(e) => handlePaddingChange('top', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 text-sm rounded border border-[var(--border-color)]
                             bg-[var(--bg-primary)] text-[var(--text-primary)]
                             focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
              </div>
            )}
            {pinnedEdges.includes('bottom') && (
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)]">Bottom</label>
                <input
                  type="number"
                  value={padding.bottom ?? 0}
                  onChange={(e) => handlePaddingChange('bottom', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 text-sm rounded border border-[var(--border-color)]
                             bg-[var(--bg-primary)] text-[var(--text-primary)]
                             focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
              </div>
            )}
            {pinnedEdges.includes('left') && (
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)]">Leading</label>
                <input
                  type="number"
                  value={padding.leading ?? 0}
                  onChange={(e) => handlePaddingChange('leading', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 text-sm rounded border border-[var(--border-color)]
                             bg-[var(--bg-primary)] text-[var(--text-primary)]
                             focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
              </div>
            )}
            {pinnedEdges.includes('right') && (
              <div>
                <label className="text-[10px] text-[var(--text-tertiary)]">Trailing</label>
                <input
                  type="number"
                  value={padding.trailing ?? 0}
                  onChange={(e) => handlePaddingChange('trailing', parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 text-sm rounded border border-[var(--border-color)]
                             bg-[var(--bg-primary)] text-[var(--text-primary)]
                             focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fill width toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--text-secondary)]">Fill parent width</label>
        <button
          onClick={handleToggleFillWidth}
          className={`
            px-2 py-1 rounded text-xs font-medium flex items-center gap-1
            transition-colors
            ${fillWidth 
              ? 'bg-[var(--accent-color)] text-white' 
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
            }
          `}
        >
          <Maximize2 className="w-3 h-3" />
          {fillWidth ? 'On' : 'Off'}
        </button>
      </div>

      {/* Content mode */}
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] mb-1.5 block">Content mode</label>
        <div className="grid grid-cols-4 gap-1">
          {CONTENT_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleContentModeChange(value)}
              className={`
                px-2 py-1.5 rounded text-[10px] font-medium
                transition-colors
                ${contentMode === value 
                  ? 'bg-[var(--accent-color)] text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }
              `}
              title={CONTENT_MODES.find(m => m.value === value)?.description}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
