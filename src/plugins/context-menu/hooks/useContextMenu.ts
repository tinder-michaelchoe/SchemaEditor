/**
 * useContextMenu Hook
 *
 * Hook for managing context menu state and action execution
 */

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getContextMenuRegistry } from '../ContextMenuRegistry';
import { getValueAtPath, stringToPath, pathToString } from '@/utils/pathUtils';
import type { ContextMenuAction, ActionContext } from '../types';

export function useContextMenu() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [componentPath, setComponentPath] = useState<string | null>(null);
  const [actions, setActions] = useState<ContextMenuAction[]>([]);

  const data = useEditorStore((state) => state.data);

  /**
   * Show the context menu at a specific position for a component
   */
  const showMenu = useCallback((path: string, x: number, y: number) => {
    const pathArray = stringToPath(path);
    const componentData = getValueAtPath(data, pathArray);

    if (!componentData || typeof componentData !== 'object') {
      console.warn('Cannot show context menu: invalid component data at path', path);
      return;
    }

    const componentType = (componentData as { type?: string }).type || 'unknown';

    // Get available actions from registry
    const registry = getContextMenuRegistry();
    const availableActions = registry.getAvailableActions(componentType);

    if (availableActions.length === 0) {
      console.log('No actions available for component type:', componentType);
      return;
    }

    setComponentPath(path);
    setPosition({ x, y });
    setActions(availableActions);
    setVisible(true);
  }, [data]);

  /**
   * Hide the context menu
   */
  const hideMenu = useCallback(() => {
    setVisible(false);
    setComponentPath(null);
    setActions([]);
  }, []);

  /**
   * Find action by ID (searches both top-level and submenu actions)
   */
  const findAction = useCallback((actionId: string): ContextMenuAction | null => {
    // Search top-level actions
    for (const action of actions) {
      if (action.id === actionId) {
        return action;
      }
      // Search submenu items
      if (action.submenu) {
        const submenuAction = action.submenu.find(sub => sub.id === actionId);
        if (submenuAction) {
          return submenuAction;
        }
      }
    }
    return null;
  }, [actions]);

  /**
   * Handle action click
   */
  const handleAction = useCallback((actionId: string) => {
    if (!componentPath) {
      console.warn('No component path set for action execution');
      return;
    }

    const pathArray = stringToPath(componentPath);
    const componentData = getValueAtPath(data, pathArray);

    if (!componentData || typeof componentData !== 'object') {
      console.warn('Cannot execute action: invalid component data at path', componentPath);
      return;
    }

    // Build action context
    const parentPathArray = pathArray.slice(0, -1);
    const context: ActionContext = {
      componentPath,
      componentData,
      parentPath: parentPathArray.length > 0 ? pathToString(parentPathArray) : null,
      documentData: data,
    };

    // Find and execute the action (might be in submenu)
    const action = findAction(actionId);
    if (action?.execute) {
      try {
        action.execute(context);
        hideMenu();
      } catch (error) {
        console.error(`Error executing action ${actionId}:`, error);
      }
    } else {
      console.warn(`Action ${actionId} not found or has no execute function`);
    }
  }, [componentPath, data, hideMenu, findAction]);

  return {
    visible,
    position,
    actions,
    showMenu,
    hideMenu,
    handleAction,
  };
}
