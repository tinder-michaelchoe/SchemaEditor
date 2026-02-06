import React from 'react';
import styled, { css } from 'styled-components';
import { useDragSource } from '../../drag-drop-service/useDragDrop';
import type { ComponentDefinition } from '../data/componentDefinitions';

const CardWrapper = styled.div<{ $isDragging: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: grab;
  background: ${p => p.theme.colors.bgTertiary};
  border: 1px solid transparent;
  transition: all 150ms;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
    border-color: ${p => p.theme.colors.accent};
  }

  ${p => p.$isDragging && css`
    opacity: 0.5;
    cursor: grabbing;
  `}
`;

const IconWrapper = styled.span`
  display: flex;
  color: ${p => p.theme.colors.textSecondary};
`;

const ComponentName = styled.span`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textPrimary};
`;

interface ComponentCardProps {
  component: ComponentDefinition;
  onClick?: () => void;
}

export function ComponentCard({ component, onClick }: ComponentCardProps) {
  const { isDragging, dragProps } = useDragSource({
    type: 'palette-component',
    data: {
      type: component.type,
      name: component.name,
      defaultProps: component.defaultProps,
    },
    onDragEnd: (success) => {
      if (success) {
        console.log(`Component ${component.name} successfully added to canvas`);
      }
    },
  });

  const Icon = component.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('ComponentCard clicked:', component.type);
    onClick?.();
  };

  return (
    <CardWrapper
      {...dragProps}
      onClick={handleClick}
      $isDragging={isDragging}
      title={component.description}
    >
      <IconWrapper><Icon size={16} /></IconWrapper>
      <ComponentName>{component.name}</ComponentName>
    </CardWrapper>
  );
}
