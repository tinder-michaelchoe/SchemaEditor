/**
 * FloatingPalette Component
 *
 * A floating bottom bar that displays component categories with expandable submenus.
 * Components can be dragged onto the canvas to add them.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDragSource } from '../../drag-drop-service/useDragDrop';
import {
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  type ComponentDefinition,
} from '../data/componentDefinitions';
import { ChevronDown, Hand, MousePointer } from 'lucide-react';

type Tool = 'select' | 'hand';

interface FloatingPaletteProps {
  onComponentSelect?: (component: ComponentDefinition) => void;
}

export function FloatingPalette({ onComponentSelect }: FloatingPaletteProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const componentsByCategory = getComponentsByCategory();
  const paletteRef = useRef<HTMLDivElement>(null);

  // Track the selected component for each category (defaults to first component)
  const [selectedComponents, setSelectedComponents] = useState<Map<string, string>>(() => {
    const initialMap = new Map<string, string>();
    COMPONENT_CATEGORIES.forEach((category) => {
      const components = componentsByCategory.get(category.id);
      if (components && components.length > 0) {
        initialMap.set(category.id, components[0].type);
      }
    });
    return initialMap;
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const closeMenu = () => {
    setExpandedCategory(null);
  };

  const closeToolMenu = () => {
    setIsToolMenuOpen(false);
  };

  const handleComponentSelectFromFlyout = (categoryId: string, component: ComponentDefinition) => {
    // Update the selected component for this category
    setSelectedComponents((prev) => {
      const newMap = new Map(prev);
      newMap.set(categoryId, component.type);
      return newMap;
    });
    // Call the original onComponentSelect callback
    onComponentSelect?.(component);
    closeMenu();
  };

  // Handle space key for temporary hand mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && selectedTool === 'select') {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTool]);

  // Close menus when clicking outside
  useEffect(() => {
    if (!expandedCategory && !isToolMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        closeMenu();
        closeToolMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedCategory, isToolMenuOpen]);

  // Close flyout when dragging away from it
  useEffect(() => {
    if (!expandedCategory && !isToolMenuOpen) return;

    let dragStartPos: { x: number; y: number } | null = null;
    let isDraggingFromFlyout = false;
    const DRAG_DISTANCE_THRESHOLD = 60; // Close flyout when dragged 60px away

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicking on a component in a flyout menu
      const flyoutMenu = target.closest('.flyout-menu');
      if (flyoutMenu && paletteRef.current?.contains(flyoutMenu)) {
        dragStartPos = { x: e.clientX, y: e.clientY };
        isDraggingFromFlyout = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos || !isDraggingFromFlyout) return;

      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > DRAG_DISTANCE_THRESHOLD) {
        closeMenu();
        closeToolMenu();
        dragStartPos = null;
        isDraggingFromFlyout = false;
      }
    };

    const handleMouseUp = () => {
      dragStartPos = null;
      isDraggingFromFlyout = false;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [expandedCategory, isToolMenuOpen]);

  // Determine which tool to display and if it should be highlighted
  const displayTool = isSpacePressed ? 'hand' : selectedTool;
  const isToolHighlighted = isSpacePressed;

  return (
    <div ref={paletteRef} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="flex items-center gap-4">
        {/* Tool Selection Island */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 px-2 py-2 pointer-events-auto">
          {/* Tool Menu Flyout */}
          {isToolMenuOpen && (
            <div
              className="
                flyout-menu
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                bg-white/95 backdrop-blur-sm rounded-xl shadow-xl
                border border-gray-200/50
                p-2 space-y-1
                min-w-[180px]
              "
            >
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tools
              </div>
              <button
                onClick={() => {
                  setSelectedTool('select');
                  closeToolMenu();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  text-gray-700 hover:bg-gray-100
                  transition-all duration-150
                  ${selectedTool === 'select' ? 'bg-gray-100' : ''}
                `}
              >
                <MousePointer className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Selection (V)</span>
              </button>
              <button
                onClick={() => {
                  setSelectedTool('hand');
                  closeToolMenu();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  text-gray-700 hover:bg-gray-100
                  transition-all duration-150
                  ${selectedTool === 'hand' ? 'bg-gray-100' : ''}
                `}
              >
                <Hand className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Hand (H)</span>
              </button>
            </div>
          )}

          {/* Tool Button */}
          <div
            className={`
              relative flex items-center justify-center gap-1
              h-10 px-3 rounded-lg
              transition-all duration-150
              ${isToolHighlighted
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
              }
              ${isToolMenuOpen && !isToolHighlighted ? 'bg-gray-100' : ''}
            `}
          >
            {/* Tool Icon */}
            <div className="flex items-center justify-center">
              {displayTool === 'hand' ? (
                <Hand className={`w-5 h-5 ${isToolHighlighted ? 'text-white' : 'text-gray-700'}`} />
              ) : (
                <MousePointer className={`w-5 h-5 ${isToolHighlighted ? 'text-white' : 'text-gray-700'}`} />
              )}
            </div>

            {/* Chevron */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsToolMenuOpen(!isToolMenuOpen);
              }}
              className="flex items-center justify-center p-0.5 -mr-1 hover:opacity-70 transition-opacity"
              title="Show all tools"
            >
              <ChevronDown className={`w-3 h-3 ${isToolHighlighted ? 'text-white' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Component Palette Island */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 px-2 py-2 pointer-events-auto">
          <div className="flex items-center gap-1">
            {COMPONENT_CATEGORIES.map((category) => {
              const components = componentsByCategory.get(category.id) || [];
              const selectedType = selectedComponents.get(category.id);
              const selectedComponent = components.find((c) => c.type === selectedType) || components[0];

              return (
                <CategoryButton
                  key={category.id}
                  category={category}
                  components={components}
                  selectedComponent={selectedComponent}
                  isExpanded={expandedCategory === category.id}
                  onToggle={() => toggleCategory(category.id)}
                  onComponentSelect={(component) => {
                    onComponentSelect?.(component);
                    closeMenu();
                  }}
                  onComponentSelectFromFlyout={(component) => {
                    handleComponentSelectFromFlyout(category.id, component);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryButtonProps {
  category: { id: string; name: string; description: string };
  components: ComponentDefinition[];
  selectedComponent: ComponentDefinition | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onComponentSelect?: (component: ComponentDefinition) => void;
  onComponentSelectFromFlyout?: (component: ComponentDefinition) => void;
}

function CategoryButton({
  category,
  components,
  selectedComponent,
  isExpanded,
  onToggle,
  onComponentSelect,
  onComponentSelectFromFlyout,
}: CategoryButtonProps) {
  // Use selected component as the main icon/action
  const mainComponent = selectedComponent || components[0];
  const hasSubItems = components.length > 1;

  if (!mainComponent) return null;

  return (
    <div className="relative">
      {/* Submenu */}
      {isExpanded && hasSubItems && (
        <div
          className="
            flyout-menu
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            bg-white/95 backdrop-blur-sm rounded-xl shadow-xl
            border border-gray-200/50
            p-2 space-y-1
            min-w-[200px]
          "
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {category.name}
          </div>
          {components.map((component) => (
            <ComponentMenuItem
              key={component.type}
              component={component}
              onSelect={onComponentSelectFromFlyout}
              isSelected={component.type === mainComponent.type}
            />
          ))}
        </div>
      )}

      {/* Main Button */}
      <div
        className={`
          relative flex items-center justify-center gap-1
          h-10 px-3 rounded-lg
          bg-transparent text-gray-700 hover:bg-gray-100
          transition-all duration-150
          ${isExpanded ? 'bg-gray-100' : ''}
        `}
      >
        {/* Main icon - draggable and adds component */}
        <ComponentIcon
          component={mainComponent}
          onSelect={onComponentSelect}
        />

        {/* Chevron - only for toggling menu */}
        {hasSubItems && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center justify-center p-0.5 -mr-1 hover:opacity-70 transition-opacity"
            title={`Show all ${category.name} components`}
          >
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ComponentIconProps {
  component: ComponentDefinition;
  onSelect?: (component: ComponentDefinition) => void;
}

function ComponentIcon({ component, onSelect }: ComponentIconProps) {
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
    onSelect?.(component);
  };

  return (
    <div
      {...dragProps}
      onClick={handleClick}
      className={`
        flex items-center justify-center cursor-grab
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
      `}
      title={component.description}
    >
      <Icon className="w-5 h-5 text-gray-700" />
    </div>
  );
}

interface ComponentMenuItemProps {
  component: ComponentDefinition;
  onSelect?: (component: ComponentDefinition) => void;
  isSelected?: boolean;
}

function ComponentMenuItem({ component, onSelect, isSelected }: ComponentMenuItemProps) {
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
    onSelect?.(component);
  };

  return (
    <button
      {...dragProps}
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        text-gray-700 hover:bg-gray-100
        transition-all duration-150
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
        ${isSelected ? 'bg-gray-100' : ''}
      `}
      title={component.description}
    >
      <Icon className="w-4 h-4 text-gray-600" />
      <span className="text-sm font-medium">
        {component.name}
      </span>
    </button>
  );
}
