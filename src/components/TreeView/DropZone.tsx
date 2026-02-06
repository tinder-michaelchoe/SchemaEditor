import React, { useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { useDragDropStore } from '@/plugins/drag-drop-service/DragDropManager';
import type { DragSource } from '@/plugins/drag-drop-service/DragDropManager';

export type DropPosition = 'before' | 'after' | 'inside';

/* ── Styled Components ── */

const DropZoneContainer = styled.div`
  position: relative;
  transition: all 0.15s;
`;

const DropIndicator = styled.div<{
  $position: DropPosition;
  $isOver: boolean;
  $canAccept: boolean;
}>`
  position: absolute;
  pointer-events: none;
  transition: all 0.15s;

  ${p => p.$position === 'before' && css`
    top: 0;
    left: 0;
    right: 0;
    height: 0.125rem;
  `}

  ${p => p.$position === 'after' && css`
    bottom: 0;
    left: 0;
    right: 0;
    height: 0.125rem;
  `}

  ${p => p.$position === 'inside' && css`
    inset: 0;
    border-radius: ${p.theme.radii.md};
    border: 2px dashed;
  `}

  ${p => p.$isOver && p.$canAccept && p.$position === 'inside' && css`
    border-color: ${p.theme.colors.accent};
    background: ${p.theme.colors.accent}1a;
  `}

  ${p => p.$isOver && p.$canAccept && p.$position !== 'inside' && css`
    background: ${p.theme.colors.accent};
  `}

  ${p => !p.$isOver && p.$canAccept && p.$position === 'inside' && css`
    border-color: ${p.theme.colors.border};
  `}

  ${p => !p.$isOver && p.$canAccept && p.$position !== 'inside' && css`
    background: transparent;
  `}

  ${p => !p.$canAccept && css`
    border-color: transparent;
    background: transparent;
  `}
`;

const DroppableContainer = styled.div`
  position: relative;
`;

const BeforeAfterZone = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 0.5rem;
  z-index: 10;
`;

const BeforeZone = styled(BeforeAfterZone)`
  top: -0.25rem;
`;

const AfterZone = styled(BeforeAfterZone)`
  bottom: -0.25rem;
`;

/* ── DropZone Component ── */

interface DropZoneProps {
  path: string;
  position: DropPosition;
  accepts?: ('component' | 'node' | 'template')[];
  onDrop: (source: DragSource, position: DropPosition) => void;
  className?: string;
  children?: React.ReactNode;
  showIndicator?: boolean;
}

export function DropZone({
  path,
  position,
  accepts = ['component', 'node'],
  onDrop,
  className,
  children,
  showIndicator = true,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const dragData = useDragDropStore((state) => state.dragData);

  const isDragging = dragData !== null;
  const canAccept = isDragging && accepts.includes(dragData.source.type);

  const handleMouseEnter = useCallback(() => {
    if (canAccept) {
      setIsOver(true);
    }
  }, [canAccept]);

  const handleMouseLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (canAccept && dragData) {
      onDrop(dragData.source, position);
      useDragDropStore.setState({ dragData: null });
    }
    setIsOver(false);
  }, [canAccept, dragData, onDrop, position]);

  // Don't render indicator when not dragging
  if (!isDragging && !children) {
    return null;
  }

  return (
    <DropZoneContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      className={className}
    >
      {children}

      {/* Drop indicator */}
      {showIndicator && isDragging && (
        <DropIndicator
          $position={position}
          $isOver={isOver}
          $canAccept={canAccept}
        />
      )}
    </DropZoneContainer>
  );
}

/**
 * Wrapper component that adds drop zones before and after its children
 */
interface DroppableWrapperProps {
  path: string;
  accepts?: ('component' | 'node' | 'template')[];
  onDrop: (source: DragSource, position: DropPosition) => void;
  children: React.ReactNode;
  showBeforeAfter?: boolean;
  showInside?: boolean;
  className?: string;
}

export function DroppableWrapper({
  path,
  accepts = ['component', 'node'],
  onDrop,
  children,
  showBeforeAfter = true,
  showInside = false,
  className,
}: DroppableWrapperProps) {
  const dragData = useDragDropStore((state) => state.dragData);
  const isDragging = dragData !== null;

  return (
    <DroppableContainer className={className}>
      {/* Before drop zone */}
      {showBeforeAfter && isDragging && (
        <BeforeZone as={DropZone}
          path={path}
          position="before"
          accepts={accepts}
          onDrop={onDrop}
        />
      )}

      {/* Content with optional inside drop zone */}
      {showInside ? (
        <DropZone
          path={path}
          position="inside"
          accepts={accepts}
          onDrop={onDrop}
        >
          {children}
        </DropZone>
      ) : (
        children
      )}

      {/* After drop zone */}
      {showBeforeAfter && isDragging && (
        <AfterZone as={DropZone}
          path={path}
          position="after"
          accepts={accepts}
          onDrop={onDrop}
        />
      )}
    </DroppableContainer>
  );
}
