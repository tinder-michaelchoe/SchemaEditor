import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ComponentCard } from './ComponentCard';
import type { ComponentDefinition } from '../data/componentDefinitions';

interface CategorySectionProps {
  name: string;
  description?: string;
  components: ComponentDefinition[];
  defaultOpen?: boolean;
  onComponentClick?: (component: ComponentDefinition) => void;
}

export function CategorySection({
  name,
  description,
  components,
  defaultOpen = true,
  onComponentClick,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border-color)] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center gap-2 px-3 py-2
          text-left hover:bg-[var(--bg-tertiary)]
          transition-colors duration-150
        "
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
        )}
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {name}
        </span>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {components.length}
        </span>
      </button>

      {isOpen && (
        <div className="px-2 pb-2 space-y-1">
          {components.map((component) => (
            <ComponentCard
              key={component.type}
              component={component}
              onClick={() => onComponentClick?.(component)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
