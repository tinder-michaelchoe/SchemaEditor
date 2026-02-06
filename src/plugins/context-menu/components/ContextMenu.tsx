/**
 * Context Menu Component
 *
 * Main context menu UI with keyboard navigation, positioning, and focus management
 * Supports nested submenus
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ContextMenuAction } from '../types';
import { ContextMenuItem } from './ContextMenuItem';

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  actions: ContextMenuAction[];
  onActionClick: (actionId: string) => void;
  onClose: () => void;
}

/**
 * Calculate menu position to keep it within viewport
 */
function calculatePosition(x: number, y: number, menuWidth: number, menuHeight: number) {
  let finalX = x;
  let finalY = y;

  // Adjust if would overflow viewport
  if (x + menuWidth > window.innerWidth) {
    finalX = window.innerWidth - menuWidth - 10;
  }
  if (y + menuHeight > window.innerHeight) {
    finalY = window.innerHeight - menuHeight - 10;
  }

  // Ensure minimum margins from edges
  finalX = Math.max(10, finalX);
  finalY = Math.max(10, finalY);

  return { x: finalX, y: finalY };
}

export function ContextMenu({
  visible,
  position,
  actions,
  onActionClick,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  // Get the currently open submenu
  const openSubmenu = actions.find(a => a.id === openSubmenuId)?.submenu;

  // Adjust position based on menu size when it becomes visible
  useEffect(() => {
    if (visible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const adjusted = calculatePosition(position.x, position.y, rect.width, rect.height);
      setAdjustedPosition(adjusted);
    }
  }, [visible, position, actions.length]);

  // Handle submenu opening
  const handleSubmenuOpen = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action?.submenu || !menuRef.current) return;

    // Find the menu item element to position submenu relative to it
    const menuItems = menuRef.current.querySelectorAll('[role="menuitem"]');
    const actionIndex = actions.findIndex(a => a.id === actionId);
    const itemElement = menuItems[actionIndex] as HTMLElement;

    if (itemElement) {
      const itemRect = itemElement.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      // Position submenu to the right of parent item
      let submenuX = menuRect.right;
      let submenuY = itemRect.top;

      // Check if submenu would overflow right edge
      const estimatedSubmenuWidth = 200; // Same as submenu min-width
      if (submenuX + estimatedSubmenuWidth > window.innerWidth) {
        // Position to the left instead
        submenuX = menuRect.left - estimatedSubmenuWidth;
      }

      setSubmenuPosition({ x: submenuX, y: submenuY });
      setOpenSubmenuId(actionId);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If submenu is open, different keyboard handling
      if (openSubmenuId && openSubmenu) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            // Navigate within submenu (handled by submenu focus)
            break;
          case 'ArrowUp':
            e.preventDefault();
            // Navigate within submenu (handled by submenu focus)
            break;
          case 'ArrowLeft':
            e.preventDefault();
            setOpenSubmenuId(null);
            break;
          case 'Escape':
            e.preventDefault();
            if (openSubmenuId) {
              setOpenSubmenuId(null);
            } else {
              onClose();
            }
            break;
        }
      } else {
        // Main menu keyboard handling
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setFocusedIndex(prev => (prev + 1) % actions.length);
            break;
          case 'ArrowUp':
            e.preventDefault();
            setFocusedIndex(prev => (prev - 1 + actions.length) % actions.length);
            break;
          case 'ArrowRight':
            e.preventDefault();
            const focusedAction = actions[focusedIndex];
            if (focusedAction?.submenu && focusedAction.submenu.length > 0) {
              handleSubmenuOpen(focusedAction.id);
            }
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            const action = actions[focusedIndex];
            if (action) {
              if (action.submenu && action.submenu.length > 0) {
                handleSubmenuOpen(action.id);
              } else if (action.execute) {
                onActionClick(action.id);
              }
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, focusedIndex, actions, onActionClick, onClose, openSubmenuId, openSubmenu]);

  // Handle click outside to close
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      const clickedInsideMenu = menuRef.current?.contains(e.target as Node);
      const clickedInsideSubmenu = submenuRef.current?.contains(e.target as Node);

      if (!clickedInsideMenu && !clickedInsideSubmenu) {
        onClose();
      }
    };

    // Add listener with a small delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  // Focus the menu when it becomes visible
  useEffect(() => {
    if (visible && menuRef.current) {
      // Focus the first menu item
      const firstItem = menuRef.current.querySelector('[role="menuitem"]') as HTMLElement;
      if (firstItem) {
        firstItem.focus();
      }
    }
  }, [visible]);

  // Reset focused index when menu opens
  useEffect(() => {
    if (visible) {
      setFocusedIndex(0);
      setOpenSubmenuId(null);
    }
  }, [visible]);

  if (!visible || actions.length === 0) {
    return null;
  }

  return createPortal(
    <>
      {/* Main Menu */}
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-[9999] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-xl min-w-[220px] py-1.5 overflow-hidden"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        {actions.map((action, index) => (
          <ContextMenuItem
            key={action.id}
            action={action}
            onClick={onActionClick}
            isFocused={index === focusedIndex}
            onSubmenuOpen={handleSubmenuOpen}
            onMouseEnter={() => {
              setFocusedIndex(index);
              // Auto-open submenu on hover
              if (action.submenu && action.submenu.length > 0) {
                handleSubmenuOpen(action.id);
              } else {
                setOpenSubmenuId(null);
              }
            }}
          />
        ))}
      </div>

      {/* Submenu */}
      {openSubmenuId && openSubmenu && (
        <div
          ref={submenuRef}
          role="menu"
          className="fixed z-[10000] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-xl min-w-[200px] py-1.5 overflow-hidden"
          style={{
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
        >
          {openSubmenu.map((subAction) => (
            <ContextMenuItem
              key={subAction.id}
              action={subAction}
              onClick={onActionClick}
              isFocused={false}
            />
          ))}
        </div>
      )}
    </>,
    document.body
  );
}
