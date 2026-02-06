/**
 * Context Menu Types
 *
 * Defines interfaces for the context menu action system
 */

import type { LucideIcon } from 'lucide-react';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string | LucideIcon;  // Support both string and Lucide icons
  category: 'transform' | 'edit' | 'view';
  isAvailable: (componentType: string) => boolean;
  execute?: (context: ActionContext) => void;  // Optional for submenu parents
  submenu?: ContextMenuAction[];  // Submenu items
  dividerBefore?: boolean;  // Show divider before this item
  danger?: boolean;  // Red/destructive styling
}

export interface ActionContext {
  componentPath: string;
  componentData: any;
  parentPath: string | null;
  documentData: any;
}

export interface ComponentActionsConfig {
  componentType: string;
  availableActions: string[]; // Action IDs
}
