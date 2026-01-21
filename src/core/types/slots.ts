/**
 * UI Slot Types
 * 
 * Slots are predefined areas in the application shell where plugins
 * can render their components.
 */

import type { ComponentType } from 'react';
import type { UISlot, SlotProps, SlotRegistration } from './plugin';

// ============================================================================
// Slot Configuration
// ============================================================================

/**
 * Configuration for each slot position
 */
export interface SlotConfig {
  /** Slot identifier */
  id: UISlot;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Whether multiple plugins can render here */
  allowMultiple: boolean;
  /** Default component when no plugins render here */
  defaultComponent?: ComponentType;
  /** CSS class for styling */
  className?: string;
}

/**
 * Slot configuration registry
 */
export const SLOT_CONFIG: Record<UISlot, SlotConfig> = {
  'header:left': {
    id: 'header:left',
    name: 'Header Left',
    description: 'Left side of the header (logo, navigation)',
    allowMultiple: true,
    className: 'slot-header-left',
  },
  'header:center': {
    id: 'header:center',
    name: 'Header Center',
    description: 'Center of the header (title, breadcrumbs)',
    allowMultiple: true,
    className: 'slot-header-center',
  },
  'header:right': {
    id: 'header:right',
    name: 'Header Right',
    description: 'Right side of the header (actions, settings)',
    allowMultiple: true,
    className: 'slot-header-right',
  },
  'sidebar:left': {
    id: 'sidebar:left',
    name: 'Left Sidebar',
    description: 'Left sidebar panel (palette, explorer)',
    allowMultiple: true,
    className: 'slot-sidebar-left',
  },
  'sidebar:right': {
    id: 'sidebar:right',
    name: 'Right Sidebar',
    description: 'Right sidebar panel (inspector, properties)',
    allowMultiple: true,
    className: 'slot-sidebar-right',
  },
  'main:view': {
    id: 'main:view',
    name: 'Main View',
    description: 'Main content area (tree view, canvas, preview)',
    allowMultiple: false,
    className: 'slot-main-view',
  },
  'panel:bottom': {
    id: 'panel:bottom',
    name: 'Bottom Panel',
    description: 'Bottom panel (console, errors, output)',
    allowMultiple: true,
    className: 'slot-panel-bottom',
  },
  'toolbar:main': {
    id: 'toolbar:main',
    name: 'Main Toolbar',
    description: 'Main toolbar actions',
    allowMultiple: true,
    className: 'slot-toolbar-main',
  },
  'context-menu': {
    id: 'context-menu',
    name: 'Context Menu',
    description: 'Right-click context menu items',
    allowMultiple: true,
    className: 'slot-context-menu',
  },
};

// ============================================================================
// Slot Rendering Types
// ============================================================================

/**
 * Registered slot component with all metadata
 */
export interface RegisteredSlotComponent {
  /** Plugin ID */
  pluginId: string;
  /** Slot registration info */
  registration: SlotRegistration;
  /** Whether currently visible (based on 'when' condition) */
  visible: boolean;
}

/**
 * Slot render context passed to slot components
 */
export interface SlotRenderContext extends SlotProps {
  /** The slot being rendered */
  slot: UISlot;
  /** Number of plugins in this slot */
  pluginCount: number;
  /** Index of this plugin in the slot */
  index: number;
}

/**
 * Props for the Slot component that renders a slot position
 */
export interface SlotComponentProps {
  /** Which slot to render */
  name: UISlot;
  /** Additional CSS class */
  className?: string;
  /** Fallback content when no plugins render here */
  fallback?: React.ReactNode;
  /** Whether to render in a wrapper */
  wrap?: boolean;
}

// ============================================================================
// Slot Layout Types
// ============================================================================

/**
 * Layout configuration for the shell
 */
export interface ShellLayout {
  /** Whether header is visible */
  showHeader: boolean;
  /** Whether left sidebar is visible */
  showLeftSidebar: boolean;
  /** Whether right sidebar is visible */
  showRightSidebar: boolean;
  /** Whether bottom panel is visible */
  showBottomPanel: boolean;
  /** Left sidebar width */
  leftSidebarWidth: number;
  /** Right sidebar width */
  rightSidebarWidth: number;
  /** Bottom panel height */
  bottomPanelHeight: number;
}

/**
 * Default shell layout
 */
export const DEFAULT_LAYOUT: ShellLayout = {
  showHeader: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  showBottomPanel: true,
  leftSidebarWidth: 280,
  rightSidebarWidth: 320,
  bottomPanelHeight: 200,
};

// ============================================================================
// Slot Visibility Conditions
// ============================================================================

/**
 * Context available for evaluating 'when' conditions
 */
export interface WhenContext {
  /** Whether a document is loaded */
  hasDocument: boolean;
  /** Whether there's a selection */
  hasSelection: boolean;
  /** Current view mode */
  viewMode: string;
  /** Whether in dark mode */
  isDarkMode: boolean;
  /** Current selected path */
  selectedPath: string | null;
  /** Whether there are validation errors */
  hasErrors: boolean;
  /** Custom context from plugins */
  custom: Record<string, unknown>;
}

/**
 * Evaluate a 'when' condition
 * Simple expression evaluator for slot visibility
 */
export function evaluateWhenCondition(
  condition: string | undefined,
  context: WhenContext
): boolean {
  if (!condition) return true;

  // Simple expression evaluation
  // Supports: hasDocument, hasSelection, viewMode == 'tree', etc.
  try {
    // Parse simple conditions
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map((s) => s.trim());
      const leftValue = getContextValue(left, context);
      const rightValue = right.replace(/['"]/g, ''); // Remove quotes
      return String(leftValue) === rightValue;
    }

    if (condition.includes('!=')) {
      const [left, right] = condition.split('!=').map((s) => s.trim());
      const leftValue = getContextValue(left, context);
      const rightValue = right.replace(/['"]/g, '');
      return String(leftValue) !== rightValue;
    }

    if (condition.startsWith('!')) {
      const varName = condition.slice(1).trim();
      return !getContextValue(varName, context);
    }

    // Simple boolean check
    return Boolean(getContextValue(condition, context));
  } catch {
    console.warn(`Failed to evaluate condition: ${condition}`);
    return true;
  }
}

/**
 * Get a value from the when context
 */
function getContextValue(key: string, context: WhenContext): unknown {
  if (key in context) {
    return context[key as keyof WhenContext];
  }
  if (key.startsWith('custom.')) {
    return context.custom[key.slice(7)];
  }
  return undefined;
}
