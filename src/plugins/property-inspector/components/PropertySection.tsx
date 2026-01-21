import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PropertySectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function PropertySection({
  title,
  defaultOpen = true,
  children,
}: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border-color)] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center gap-2 px-4 py-2
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
          {title}
        </span>
      </button>

      {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}
