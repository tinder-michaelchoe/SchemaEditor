import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';
import {
  Lock,
  Unlock,
  Maximize2,
  Pin,
} from 'lucide-react';

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SizeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SizeField = styled.div`
  flex: 1;
`;

const FieldLabel = styled.label`
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
  margin-bottom: 0.125rem;
  display: block;
`;

const SizeInput = styled.input`
  width: 100%;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px ${p => p.theme.colors.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AspectRatioButton = styled.button<{ $locked: boolean }>`
  margin-top: 1rem;
  padding: 0.375rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 150ms;

  ${p => p.$locked
    ? css`
        background: ${p.theme.colors.accent};
        color: white;
      `
    : css`
        background: ${p.theme.colors.bgTertiary};
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background: ${p.theme.colors.border};
        }
      `
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SectionLabel = styled.label`
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
  margin-bottom: 0.375rem;
  display: block;
`;

const PinGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
`;

const PinButton = styled.button<{ $isPinned: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 10px;
  font-weight: 500;
  text-transform: capitalize;
  border: none;
  cursor: pointer;
  transition: background-color 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  ${p => p.$isPinned
    ? css`
        background: ${p.theme.colors.accent};
        color: white;
      `
    : css`
        background: ${p.theme.colors.bgTertiary};
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background: ${p.theme.colors.border};
        }
      `
  }
`;

const PaddingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
`;

const FillRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FillLabel = styled.label`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textSecondary};
`;

const FillButton = styled.button<{ $active: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 150ms;

  ${p => p.$active
    ? css`
        background: ${p.theme.colors.accent};
        color: white;
      `
    : css`
        background: ${p.theme.colors.bgTertiary};
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background: ${p.theme.colors.border};
        }
      `
  }
`;

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 10px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 150ms;

  ${p => p.$active
    ? css`
        background: ${p.theme.colors.accent};
        color: white;
      `
    : css`
        background: ${p.theme.colors.bgTertiary};
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background: ${p.theme.colors.border};
        }
      `
  }
`;

const PaddingFieldLabel = styled.label`
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
`;

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
    <LayoutWrapper>
      {/* Size inputs - only show when not pinned */}
      <SizeRow>
        <SizeField>
          <FieldLabel>Width</FieldLabel>
          <SizeInput
            type="number"
            value={isHorizontalPinned ? '' : (width ?? '')}
            onChange={handleWidthChange}
            disabled={isHorizontalPinned}
            placeholder={isHorizontalPinned ? 'Fill' : '100'}
          />
        </SizeField>

        <AspectRatioButton
          onClick={handleToggleAspectRatio}
          disabled={isHorizontalPinned && isVerticalPinned}
          $locked={aspectRatioLocked}
          title={aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {aspectRatioLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </AspectRatioButton>

        <SizeField>
          <FieldLabel>Height</FieldLabel>
          <SizeInput
            type="number"
            value={isVerticalPinned ? '' : (height ?? '')}
            onChange={handleHeightChange}
            disabled={isVerticalPinned}
            placeholder={isVerticalPinned ? 'Fill' : '100'}
          />
        </SizeField>
      </SizeRow>

      {/* Edge pinning */}
      <div>
        <SectionLabel>Pin to parent edges</SectionLabel>
        <PinGrid>
          {['top', 'bottom', 'left', 'right'].map((edge) => {
            const isPinned = pinnedEdges.includes(edge);
            return (
              <PinButton
                key={edge}
                onClick={() => handleToggleEdgePin(edge)}
                $isPinned={isPinned}
                title={isPinned ? `Unpin from ${edge}` : `Pin to ${edge}`}
              >
                <Pin size={10} />
                {edge}
              </PinButton>
            );
          })}
        </PinGrid>
      </div>

      {/* Padding - show when any edge is pinned */}
      {pinnedEdges.length > 0 && (
        <div>
          <SectionLabel>Padding from edges</SectionLabel>
          <PaddingGrid>
            {pinnedEdges.includes('top') && (
              <div>
                <PaddingFieldLabel>Top</PaddingFieldLabel>
                <SizeInput
                  type="number"
                  value={padding.top ?? 0}
                  onChange={(e) => handlePaddingChange('top', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            )}
            {pinnedEdges.includes('bottom') && (
              <div>
                <PaddingFieldLabel>Bottom</PaddingFieldLabel>
                <SizeInput
                  type="number"
                  value={padding.bottom ?? 0}
                  onChange={(e) => handlePaddingChange('bottom', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            )}
            {pinnedEdges.includes('left') && (
              <div>
                <PaddingFieldLabel>Leading</PaddingFieldLabel>
                <SizeInput
                  type="number"
                  value={padding.leading ?? 0}
                  onChange={(e) => handlePaddingChange('leading', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            )}
            {pinnedEdges.includes('right') && (
              <div>
                <PaddingFieldLabel>Trailing</PaddingFieldLabel>
                <SizeInput
                  type="number"
                  value={padding.trailing ?? 0}
                  onChange={(e) => handlePaddingChange('trailing', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            )}
          </PaddingGrid>
        </div>
      )}

      {/* Fill width toggle */}
      <FillRow>
        <FillLabel>Fill parent width</FillLabel>
        <FillButton
          onClick={handleToggleFillWidth}
          $active={fillWidth}
        >
          <Maximize2 size={12} />
          {fillWidth ? 'On' : 'Off'}
        </FillButton>
      </FillRow>

      {/* Content mode */}
      <div>
        <SectionLabel>Content mode</SectionLabel>
        <ModeGrid>
          {CONTENT_MODES.map(({ value, label }) => (
            <ModeButton
              key={value}
              onClick={() => handleContentModeChange(value)}
              $active={contentMode === value}
              title={CONTENT_MODES.find(m => m.value === value)?.description}
            >
              {label}
            </ModeButton>
          ))}
        </ModeGrid>
      </div>
    </LayoutWrapper>
  );
}
