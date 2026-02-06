import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

interface ResizableDividerProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

const Divider = styled.div<{ $horizontal: boolean; $dragging: boolean }>`
  flex-shrink: 0;
  background: ${p => (p.$dragging ? p.theme.colors.accent : p.theme.colors.border)};
  transition: background-color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.accent};
  }

  ${p =>
    p.$horizontal
      ? css`
          width: 4px;
          cursor: col-resize;
        `
      : css`
          height: 4px;
          cursor: row-resize;
        `}
`;

export function ResizableDivider({ direction, onResize, onResizeEnd }: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<number>(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    },
    [direction],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction, onResize, onResizeEnd]);

  return (
    <Divider
      onMouseDown={handleMouseDown}
      $horizontal={direction === 'horizontal'}
      $dragging={isDragging}
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
    />
  );
}
