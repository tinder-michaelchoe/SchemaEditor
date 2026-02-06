import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  Layers,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Layers2,
  MousePointer,
  TextCursorInput,
  ToggleLeft,
  SlidersHorizontal,
  Minus,
  Space,
  Repeat,
  GripVertical,
  Square,
  RectangleVertical,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useDragSource, useDropTarget } from '@/plugins/drag-drop-service';

interface LayerItemProps {
  node: Record<string, unknown>;
  path: string;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onToggleVisibility: (path: string, visible: boolean) => void;
  onToggleLock: (path: string, locked: boolean) => void;
  onRename: (path: string, name: string) => void;
  onReorder?: (sourcePath: string, targetPath: string, position: 'before' | 'after' | 'inside') => void;
}

// Map component types to icons
const TYPE_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  vstack: AlignVerticalJustifyCenter,
  hstack: AlignHorizontalJustifyCenter,
  zstack: Layers2,
  sectionLayout: Layers,
  section: RectangleVertical,
  label: Type,
  image: Image,
  button: MousePointer,
  textfield: TextCursorInput,
  toggle: ToggleLeft,
  slider: SlidersHorizontal,
  divider: Minus,
  spacer: Space,
  forEach: Repeat,
  gradient: Square,
};

/* --- Styled Components --- */

const ItemWrapper = styled.div`
  position: relative;
`;

const DropIndicator = styled.div<{ $depth: number; $position: 'before' | 'after' }>`
  position: absolute;
  left: 0;
  right: 0;
  ${p => p.$position === 'before' ? 'top: 0;' : 'bottom: 0;'}
  height: 2px;
  background: ${p => p.theme.colors.accent};
  border-radius: 9999px;
  z-index: 10;
  margin-left: ${p => p.$depth * 16 + 4}px;
`;

const ActionButton = styled.button<{ $isSelected: boolean; $forceShow: boolean }>`
  padding: 2px;
  border-radius: ${p => p.theme.radii.sm};
  background: none;
  border: none;
  cursor: pointer;
  opacity: ${p => (p.$isSelected || p.$forceShow) ? 1 : 0};
  transition: opacity 150ms;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const ItemRow = styled.div<{
  $isSelected: boolean;
  $isVisible: boolean;
  $isLocked: boolean;
  $isDragging: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.25rem;
  border-radius: ${p => p.theme.radii.sm};
  font-size: 0.875rem;
  cursor: ${p => p.$isLocked ? 'not-allowed' : 'pointer'};
  transition: background-color 100ms;
  opacity: ${p => (!p.$isVisible || p.$isDragging) ? 0.5 : 1};

  ${p => p.$isSelected ? css`
    background: ${p.theme.colors.accent};
    color: white;
  ` : css`
    &:hover {
      background: ${p.theme.colors.bgTertiary};
    }
  `}

  &:hover ${ActionButton} {
    opacity: 1;
  }
`;

const DragHandle = styled.span<{ $isSelected: boolean; $isLocked: boolean }>`
  flex-shrink: 0;
  color: ${p => p.$isSelected ? 'rgba(255, 255, 255, 0.6)' : p.theme.colors.textTertiary};
  visibility: ${p => p.$isLocked ? 'hidden' : 'visible'};
  display: flex;
  align-items: center;
`;

const ExpandButton = styled.button<{ $isSelected: boolean }>`
  padding: 2px;
  border-radius: ${p => p.theme.radii.sm};
  background: none;
  border: none;
  cursor: pointer;
  color: ${p => p.$isSelected ? 'white' : p.theme.colors.textSecondary};
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const ChevronSpacer = styled.div`
  width: 1rem;
`;

const TypeIconWrapper = styled.span<{ $isSelected: boolean }>`
  flex-shrink: 0;
  color: ${p => p.$isSelected ? 'white' : p.theme.colors.textSecondary};
  display: flex;
  align-items: center;
`;

const EditInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0 0.25rem;
  font-size: 0.875rem;
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};
  border-radius: ${p => p.theme.radii.sm};
  border: 1px solid ${p => p.theme.colors.accent};
  outline: none;

  &:focus {
    box-shadow: 0 0 0 1px ${p => p.theme.colors.accent};
  }
`;

const NodeName = styled.span<{ $isSelected: boolean }>`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${p => p.$isSelected ? 'white' : p.theme.colors.textPrimary};
`;

const ContentPreview = styled.span<{ $isSelected: boolean }>`
  margin-left: 0.375rem;
  color: ${p => p.$isSelected ? 'rgba(255, 255, 255, 0.6)' : p.theme.colors.textTertiary};
`;

const IconColor = styled.span<{ $isSelected: boolean; $variant: 'visible' | 'hidden' | 'locked' | 'unlocked' }>`
  display: flex;
  align-items: center;
  color: ${p => {
    if (p.$variant === 'locked' && !p.$isSelected) return '#f97316';
    if (p.$variant === 'hidden' && !p.$isSelected) return p.theme.colors.textSecondary;
    if (p.$isSelected) {
      if (p.$variant === 'visible' || p.$variant === 'unlocked') return 'rgba(255, 255, 255, 0.7)';
      return 'white';
    }
    return p.theme.colors.textTertiary;
  }};
`;

// Container types that can have children
const CONTAINER_TYPES = ['vstack', 'hstack', 'zstack', 'sectionLayout', 'forEach'];

export function LayerItem({
  node,
  path,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onReorder,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const dropPositionRef = useRef<'before' | 'after' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const nodeType = (node.type as string) || 'unknown';
  const nodeName = (node._name as string) || nodeType;
  const isVisible = node._visible !== false; // Default to true
  const isLocked = node._locked === true; // Default to false
  const isContainer = CONTAINER_TYPES.includes(nodeType);

  // Get content preview for certain component types
  const getContentPreview = (): string | null => {
    if (nodeType === 'label' && node.text) {
      const text = String(node.text);
      return text.length > 20 ? text.substring(0, 20) + '...' : text;
    }
    if (nodeType === 'button' && node.label) {
      const label = String(node.label);
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }
    if (nodeType === 'textfield' && node.placeholder) {
      const placeholder = String(node.placeholder);
      return placeholder.length > 20 ? placeholder.substring(0, 20) + '...' : placeholder;
    }
    return null;
  };

  const contentPreview = getContentPreview();

  const Icon = TYPE_ICONS[nodeType] || Square;

  // Use centralized drag system
  const { isDragging, dragProps } = useDragSource({
    type: 'layer-node',
    data: {
      path,
      type: nodeType,
      name: nodeName,
      contentPreview,
    },
  });

  // Single drop target - we'll determine position based on mouse location
  const { isOver, canDrop, dropProps } = useDropTarget(
    {
      path,
      position: 'before', // Default, will be overridden
      accepts: ['layer-node'],
    },
    (source) => {
      const sourcePath = (source.data as { path?: string }).path;
      const position = dropPositionRef.current;
      console.log('💧 Drop on LayerItem:', { sourcePath, targetPath: path, position });
      if (sourcePath && sourcePath !== path && onReorder && position) {
        onReorder(sourcePath, path, position);
      }
    }
  );

  // Detect which zone the mouse is over (top half = before, bottom half = after)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!itemRef.current || !isOver) return;

    const rect = itemRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const halfHeight = rect.height / 2;

    const position = mouseY < halfHeight ? 'before' : 'after';
    setDropPosition(position);
    dropPositionRef.current = position;
  }, [isOver]);

  const handleMouseLeave = useCallback(() => {
    setDropPosition(null);
    // Don't clear the ref - we need it for the drop callback
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      onSelect(path);
    }
  }, [path, isLocked, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      setEditName(nodeName);
      setIsEditing(true);
    }
  }, [nodeName, isLocked]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(path);
  }, [path, onToggleExpand]);

  const handleVisibilityClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(path, !isVisible);
  }, [path, isVisible, onToggleVisibility]);

  const handleLockClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(path, !isLocked);
  }, [path, isLocked, onToggleLock]);

  const handleNameSubmit = useCallback(() => {
    if (editName.trim() && editName !== nodeName) {
      onRename(path, editName.trim());
    }
    setIsEditing(false);
  }, [editName, nodeName, path, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [handleNameSubmit]);


  // Determine if we should show drop indicators
  const showBeforeLine = isOver && canDrop && dropPosition === 'before';
  const showAfterLine = isOver && canDrop && dropPosition === 'after';

  return (
    <ItemWrapper>
      {/* Drop indicator line - before */}
      {showBeforeLine && (
        <DropIndicator $depth={depth} $position="before" />
      )}

      <ItemRow
        ref={itemRef}
        {...(isLocked ? {} : dragProps)}
        {...dropProps}
        $isSelected={isSelected}
        $isVisible={isVisible}
        $isLocked={isLocked}
        $isDragging={isDragging}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
      {/* Drag handle */}
      <DragHandle $isSelected={isSelected} $isLocked={isLocked}>
        <GripVertical size={12} />
      </DragHandle>

      {/* Expand/collapse chevron for containers */}
      {hasChildren ? (
        <ExpandButton $isSelected={isSelected} onClick={handleExpandClick}>
          {isExpanded ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
        </ExpandButton>
      ) : (
        <ChevronSpacer />
      )}

      {/* Type icon */}
      <TypeIconWrapper $isSelected={isSelected}>
        <Icon size={16} />
      </TypeIconWrapper>

      {/* Name */}
      {isEditing ? (
        <EditInput
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <NodeName $isSelected={isSelected}>
          {nodeName}
          {contentPreview && (
            <ContentPreview $isSelected={isSelected}>
              "{contentPreview}"
            </ContentPreview>
          )}
        </NodeName>
      )}

      {/* Visibility toggle */}
      <ActionButton
        $isSelected={isSelected}
        $forceShow={!isVisible}
        onClick={handleVisibilityClick}
        title={isVisible ? 'Hide layer' : 'Show layer'}
      >
        {isVisible ? (
          <IconColor $isSelected={isSelected} $variant="visible">
            <Eye size={14} />
          </IconColor>
        ) : (
          <IconColor $isSelected={isSelected} $variant="hidden">
            <EyeOff size={14} />
          </IconColor>
        )}
      </ActionButton>

      {/* Lock toggle */}
      <ActionButton
        $isSelected={isSelected}
        $forceShow={isLocked}
        onClick={handleLockClick}
        title={isLocked ? 'Unlock layer' : 'Lock layer'}
      >
        {isLocked ? (
          <IconColor $isSelected={isSelected} $variant="locked">
            <Lock size={14} />
          </IconColor>
        ) : (
          <IconColor $isSelected={isSelected} $variant="unlocked">
            <Unlock size={14} />
          </IconColor>
        )}
      </ActionButton>
      </ItemRow>

      {/* Drop indicator line - after */}
      {showAfterLine && (
        <DropIndicator $depth={depth} $position="after" />
      )}
    </ItemWrapper>
  );
}
