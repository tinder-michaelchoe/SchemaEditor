import React, { useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { isDraggingChildrenItem, getDragItemData } from './DraggableArrayItem';
import type { DragItemData } from './DraggableArrayItem';

interface ChildrenDropIndicatorProps {
  targetArrayPath: string; // Path to the target array
  targetIndex: number; // Index where the item would be inserted
  onDrop: (sourceData: DragItemData, targetIndex: number) => void;
  isValidDrop?: (sourceData: DragItemData) => boolean;
}

const DropZone = styled.div`
  position: relative;
  height: 0.5rem;
`;

const IndicatorLine = styled.div<{ $isValid: boolean }>`
  position: absolute;
  left: 1.5rem;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 2px;
  border-radius: 9999px;

  ${p =>
    p.$isValid
      ? css`
          background: ${p.theme.colors.accent};
          box-shadow: 0 0 8px ${p.theme.colors.accent};
        `
      : css`
          background: ${p.theme.colors.error};
          opacity: 0.5;
        `}
`;

const IndicatorDot = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${p => p.theme.radii.full};
  background: ${p => p.theme.colors.accent};
  box-shadow: 0 0 8px ${p => p.theme.colors.accent};
`;

export function ChildrenDropIndicator({
  targetArrayPath,
  targetIndex,
  onDrop,
  isValidDrop,
}: ChildrenDropIndicatorProps) {
  const [isOver, setIsOver] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if this is a valid drag type
    if (!isDraggingChildrenItem(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isDraggingChildrenItem(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
    // Note: We can't read drag data during dragenter (browser security)
    // Validation will happen on drop
    setIsValid(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    const data = getDragItemData(e);
    if (!data) {
      console.warn('No drag data found');
      return;
    }

    // Validate the drop
    if (isValidDrop && !isValidDrop(data)) {
      console.warn('Invalid drop target');
      return;
    }

    onDrop(data, targetIndex);
  }, [targetIndex, onDrop, isValidDrop]);

  return (
    <DropZone
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator line - only visible when dragging over */}
      {isOver && (
        <>
          <IndicatorLine $isValid={isValid} />
          {/* Drop zone circle indicator */}
          {isValid && <IndicatorDot />}
        </>
      )}
    </DropZone>
  );
}
