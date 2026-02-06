/**
 * Context Menu Item Component
 *
 * Individual menu item with hover/focus states and accessibility
 * Supports submenus with right arrow indicator
 */

import React from 'react';
import type { ContextMenuAction } from '../types';

interface ContextMenuItemProps {
  action: ContextMenuAction;
  onClick: (actionId: string) => void;
  isFocused: boolean;
  onSubmenuOpen?: (actionId: string) => void;
  onMouseEnter?: () => void;
}

export function ContextMenuItem({
  action,
  onClick,
  isFocused,
  onSubmenuOpen,
  onMouseEnter,
}: ContextMenuItemProps) {
  const hasSubmenu = action.submenu && action.submenu.length > 0;

  const handleClick = () => {
    if (hasSubmenu && onSubmenuOpen) {
      onSubmenuOpen(action.id);
    } else {
      onClick(action.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasSubmenu && onSubmenuOpen) {
        onSubmenuOpen(action.id);
      } else {
        onClick(action.id);
      }
    } else if (e.key === 'ArrowRight' && hasSubmenu && onSubmenuOpen) {
      e.preventDefault();
      onSubmenuOpen(action.id);
    }
  };

  return (
    <>
      {/* Divider */}
      {action.dividerBefore && (
        <div className="h-px bg-[var(--border-color)] my-1.5" />
      )}

      {/* Menu Item */}
      <div
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
        className={`
          px-4 py-2.5 cursor-pointer select-none
          transition-colors duration-100
          flex items-center justify-between gap-8
          ${action.danger
            ? isFocused
              ? 'bg-red-500 text-white'
              : 'text-red-600 hover:bg-red-50'
            : isFocused
              ? 'bg-[var(--accent-color)] text-white'
              : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={onMouseEnter}
      >
      {/* Left side: Icon + Label */}
      <div className="flex items-center gap-3 flex-1">
        {/* Icon */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {action.icon ? (
            typeof action.icon === 'string' ? (
              <span className="text-lg leading-none">{action.icon}</span>
            ) : (
              <action.icon size={16} strokeWidth={2} />
            )
          ) : (
            <span className="text-lg leading-none opacity-0">·</span>
          )}
        </div>

        {/* Label */}
        <span className="text-sm whitespace-nowrap">{action.label}</span>
      </div>

        {/* Right side: Submenu indicator */}
        {hasSubmenu && (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </>
  );
}
