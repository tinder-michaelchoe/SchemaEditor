/**
 * FloatingPalette Component
 *
 * A floating bottom bar that displays component categories with expandable submenus.
 * Components can be dragged onto the canvas to add them.
 */

import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { useDragSource } from '../../drag-drop-service/useDragDrop';
import {
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  type ComponentDefinition,
} from '../data/componentDefinitions';
import { ChevronDown, Hand, MousePointer } from 'lucide-react';

/* ── Outer layout ── */

const PaletteRoot = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  pointer-events: none;
`;

const PaletteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

/* ── Shared island chrome ── */

const Island = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 1rem;
  box-shadow: ${p => p.theme.shadows.lg};
  border: 1px solid ${p => p.theme.colors.border};
  padding: 0.5rem;
  pointer-events: auto;
`;

/* ── Flyout menu (shared by tools & categories) ── */

const FlyoutMenu = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 0.75rem;
  box-shadow: ${p => p.theme.shadows.xl};
  border: 1px solid ${p => p.theme.colors.border};
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FlyoutLabel = styled.div`
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

/* ── Tool / category button strip ── */

const ButtonStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ToolButtonWrapper = styled.div<{ $isHighlighted: boolean; $isOpen: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: ${p => p.theme.radii.lg};
  transition: all 150ms;

  ${p => p.$isHighlighted
    ? css`
        background: ${p.theme.colors.accent};
        color: #ffffff;
      `
    : css`
        background: transparent;
        color: ${p.theme.colors.textPrimary};
        &:hover { background: ${p.theme.colors.bgTertiary}; }
      `
  }

  ${p => p.$isOpen && !p.$isHighlighted && css`
    background: ${p.theme.colors.bgTertiary};
  `}
`;

const IconCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChevronButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  margin-right: -0.25rem;
  transition: opacity 150ms;

  &:hover { opacity: 0.7; }
`;

/* ── Flyout menu item (tool or component) ── */

const FlyoutToolMenuItem = styled.div`
  min-width: 180px;
`;

const FlyoutMenuItem = styled.button<{ $isSelected: boolean; $isDragging: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: ${p => p.theme.radii.lg};
  color: ${p => p.theme.colors.textPrimary};
  transition: all 150ms;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }

  ${p => p.$isSelected && css`
    background: ${p.theme.colors.bgTertiary};
  `}

  ${p => p.$isDragging
    ? css`
        opacity: 0.5;
        cursor: grabbing;
      `
    : css`
        cursor: grab;
      `
  }
`;

const FlyoutMenuItemIcon = styled.span`
  display: flex;
  color: ${p => p.theme.colors.textSecondary};
`;

const FlyoutMenuItemLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

/* ── Category main button ── */

const CategoryButtonWrapper = styled.div`
  position: relative;
`;

const CategoryMainButton = styled.div<{ $isExpanded: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: ${p => p.theme.radii.lg};
  background: transparent;
  color: ${p => p.theme.colors.textPrimary};
  transition: all 150ms;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }

  ${p => p.$isExpanded && css`
    background: ${p.theme.colors.bgTertiary};
  `}
`;

/* ── Component icon (draggable) ── */

const DraggableIcon = styled.div<{ $isDragging: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: ${p => p.theme.colors.textPrimary};

  ${p => p.$isDragging && css`
    opacity: 0.5;
    cursor: grabbing;
  `}
`;

const FlyoutComponentMenu = styled.div`
  min-width: 200px;
`;

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
      const flyoutMenu = target.closest('[data-flyout-menu]');
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
    <PaletteRoot ref={paletteRef}>
      <PaletteRow>
        {/* Tool Selection Island */}
        <Island>
          {/* Tool Menu Flyout */}
          {isToolMenuOpen && (
            <FlyoutMenu data-flyout-menu>
              <FlyoutToolMenuItem>
                <FlyoutLabel>Tools</FlyoutLabel>
                <FlyoutMenuItem
                  $isSelected={selectedTool === 'select'}
                  $isDragging={false}
                  onClick={() => {
                    setSelectedTool('select');
                    closeToolMenu();
                  }}
                >
                  <FlyoutMenuItemIcon><MousePointer size={16} /></FlyoutMenuItemIcon>
                  <FlyoutMenuItemLabel>Selection (V)</FlyoutMenuItemLabel>
                </FlyoutMenuItem>
                <FlyoutMenuItem
                  $isSelected={selectedTool === 'hand'}
                  $isDragging={false}
                  onClick={() => {
                    setSelectedTool('hand');
                    closeToolMenu();
                  }}
                >
                  <FlyoutMenuItemIcon><Hand size={16} /></FlyoutMenuItemIcon>
                  <FlyoutMenuItemLabel>Hand (H)</FlyoutMenuItemLabel>
                </FlyoutMenuItem>
              </FlyoutToolMenuItem>
            </FlyoutMenu>
          )}

          {/* Tool Button */}
          <ToolButtonWrapper $isHighlighted={isToolHighlighted} $isOpen={isToolMenuOpen}>
            {/* Tool Icon */}
            <IconCenter>
              {displayTool === 'hand' ? (
                <Hand size={20} />
              ) : (
                <MousePointer size={20} />
              )}
            </IconCenter>

            {/* Chevron */}
            <ChevronButton
              onClick={(e) => {
                e.stopPropagation();
                setIsToolMenuOpen(!isToolMenuOpen);
              }}
              title="Show all tools"
            >
              <ChevronDown size={12} />
            </ChevronButton>
          </ToolButtonWrapper>
        </Island>

        {/* Component Palette Island */}
        <Island>
          <ButtonStrip>
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
          </ButtonStrip>
        </Island>
      </PaletteRow>
    </PaletteRoot>
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
    <CategoryButtonWrapper>
      {/* Submenu */}
      {isExpanded && hasSubItems && (
        <FlyoutMenu data-flyout-menu>
          <FlyoutComponentMenu>
            <FlyoutLabel>{category.name}</FlyoutLabel>
            {components.map((component) => (
              <ComponentMenuItem
                key={component.type}
                component={component}
                onSelect={onComponentSelectFromFlyout}
                isSelected={component.type === mainComponent.type}
              />
            ))}
          </FlyoutComponentMenu>
        </FlyoutMenu>
      )}

      {/* Main Button */}
      <CategoryMainButton $isExpanded={isExpanded}>
        {/* Main icon - draggable and adds component */}
        <ComponentIcon
          component={mainComponent}
          onSelect={onComponentSelect}
        />

        {/* Chevron - only for toggling menu */}
        {hasSubItems && (
          <ChevronButton
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title={`Show all ${category.name} components`}
          >
            <ChevronDown size={12} />
          </ChevronButton>
        )}
      </CategoryMainButton>
    </CategoryButtonWrapper>
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
    <DraggableIcon
      {...dragProps}
      onClick={handleClick}
      $isDragging={isDragging}
      title={component.description}
    >
      <Icon size={20} />
    </DraggableIcon>
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
    <FlyoutMenuItem
      {...dragProps}
      onClick={handleClick}
      $isDragging={isDragging}
      $isSelected={isSelected ?? false}
      title={component.description}
    >
      <FlyoutMenuItemIcon><Icon size={16} /></FlyoutMenuItemIcon>
      <FlyoutMenuItemLabel>{component.name}</FlyoutMenuItemLabel>
    </FlyoutMenuItem>
  );
}
