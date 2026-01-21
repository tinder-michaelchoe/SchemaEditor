import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategorySection } from './CategorySection';
import {
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  COMPONENT_DEFINITIONS,
} from '../data/componentDefinitions';
import type { ComponentDefinition } from '../data/componentDefinitions';

interface PalettePopoverProps {
  onComponentSelect?: (component: ComponentDefinition) => void;
}

export function PalettePopover({ onComponentSelect }: PalettePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const componentsByCategory = getComponentsByCategory();

  // Filter components by search query
  const filteredComponents = searchQuery
    ? COMPONENT_DEFINITIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const handleComponentClick = (component: ComponentDefinition) => {
    console.log('PalettePopover: Component clicked:', component.type);
    console.log('PalettePopover: onComponentSelect exists:', !!onComponentSelect);
    onComponentSelect?.(component);
    // Don't close - user might want to drag multiple
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Add
      </Button>

      {/* Popover - positioned to the right to stay within viewport */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="
            absolute top-full right-0 mt-2 z-50
            w-72 max-h-[70vh] overflow-hidden
            bg-[var(--bg-secondary)] rounded-lg shadow-xl
            border border-[var(--border-color)]
            flex flex-col
          "
        >
          {/* Header with Search */}
          <div className="p-3 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[var(--text-primary)]">
                Components
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-8 pr-3 py-1.5 text-sm
                  bg-[var(--bg-primary)] rounded-md
                  border border-[var(--border-color)]
                  focus:outline-none focus:border-[var(--accent-color)]
                  text-[var(--text-primary)]
                  placeholder-[var(--text-tertiary)]
                "
              />
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto">
            {filteredComponents ? (
              // Search results
              <div className="p-2 space-y-1">
                {filteredComponents.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                    No components found
                  </p>
                ) : (
                  filteredComponents.map((component) => (
                    <div key={component.type} className="px-1">
                      <ComponentCard
                        component={component}
                        onClick={() => handleComponentClick(component)}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Category view
              COMPONENT_CATEGORIES.map((category) => (
                <CategorySection
                  key={category.id}
                  name={category.name}
                  description={category.description}
                  components={componentsByCategory.get(category.id) || []}
                  defaultOpen={category.id === 'layout'}
                  onComponentClick={handleComponentClick}
                />
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              Drag components to the tree to add them
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
