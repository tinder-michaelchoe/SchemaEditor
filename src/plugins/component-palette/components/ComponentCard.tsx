import React from 'react';
import { useDragSource } from '../../drag-drop-service/useDragDrop';
import type { ComponentDefinition } from '../data/componentDefinitions';

interface ComponentCardProps {
  component: ComponentDefinition;
  onClick?: () => void;
}

export function ComponentCard({ component, onClick }: ComponentCardProps) {
  const { isDragging, dragProps } = useDragSource({
    type: 'component',
    data: {
      type: component.type,
      name: component.name,
      defaultProps: component.defaultProps,
    },
  });

  const Icon = component.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('ComponentCard clicked:', component.type);
    onClick?.();
  };

  return (
    <div
      {...dragProps}
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md cursor-grab
        bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)]
        border border-transparent hover:border-[var(--accent-color)]
        transition-all duration-150
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
      `}
      title={component.description}
    >
      <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
      <span className="text-sm text-[var(--text-primary)]">
        {component.name}
      </span>
    </div>
  );
}
