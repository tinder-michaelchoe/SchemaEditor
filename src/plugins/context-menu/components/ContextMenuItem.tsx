/**
 * Context Menu Item Component
 *
 * Individual menu item with hover/focus states and accessibility
 * Supports submenus with right arrow indicator
 */

import React from 'react';
import styled, { css } from 'styled-components';
import type { ContextMenuAction } from '../types';

const Divider = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.border};
  margin: 0.375rem 0;
`;

const MenuItemRow = styled.div<{ $danger?: boolean; $focused?: boolean }>`
  padding: 0.625rem 1rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 100ms, color 100ms;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;

  ${p => p.$danger
    ? p.$focused
      ? css`
          background: ${p.theme.colors.error};
          color: #fff;
        `
      : css`
          color: ${p.theme.colors.error};
          &:hover { background: ${p.theme.colors.bgTertiary}; }
        `
    : p.$focused
      ? css`
          background: ${p.theme.colors.accent};
          color: #fff;
        `
      : css`
          color: ${p.theme.colors.textPrimary};
          &:hover { background: ${p.theme.colors.bgTertiary}; }
        `
  }
`;

const LeftContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const IconSlot = styled.div`
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const EmojiIcon = styled.span`
  font-size: 1.125rem;
  line-height: 1;
`;

const PlaceholderIcon = styled.span`
  font-size: 1.125rem;
  line-height: 1;
  opacity: 0;
`;

const ItemLabel = styled.span`
  font-size: ${p => p.theme.fontSizes.sm};
  white-space: nowrap;
`;

const SubmenuArrow = styled.svg`
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  opacity: 0.5;
`;

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
      {action.dividerBefore && <Divider />}

      {/* Menu Item */}
      <MenuItemRow
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
        $danger={!!action.danger}
        $focused={isFocused}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={onMouseEnter}
      >
        {/* Left side: Icon + Label */}
        <LeftContent>
          {/* Icon */}
          <IconSlot>
            {action.icon ? (
              typeof action.icon === 'string' ? (
                <EmojiIcon>{action.icon}</EmojiIcon>
              ) : (
                <action.icon size={16} strokeWidth={2} />
              )
            ) : (
              <PlaceholderIcon>·</PlaceholderIcon>
            )}
          </IconSlot>

          {/* Label */}
          <ItemLabel>{action.label}</ItemLabel>
        </LeftContent>

        {/* Right side: Submenu indicator */}
        {hasSubmenu && (
          <SubmenuArrow
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </SubmenuArrow>
        )}
      </MenuItemRow>
    </>
  );
}
