/**
 * Enclose Actions
 *
 * Actions for wrapping components in container types (vstack, hstack, zstack, forEach)
 */

import type { ContextMenuAction } from '../types';
import { useEditorStore } from '@/store/editorStore';
import { stringToPath } from '@/utils/pathUtils';
import { Box, Rows, Columns, Layers, IterationCw } from 'lucide-react';

// Container types that cannot be enclosed themselves
const CONTAINER_TYPES = ['vstack', 'hstack', 'zstack', 'forEach', 'sectionLayout'];

/**
 * Check if a component type is a container
 */
function isContainer(type: string): boolean {
  return CONTAINER_TYPES.includes(type);
}

/**
 * Single "Enclose in..." action with submenu of container options
 */
export const encloseAction: ContextMenuAction = {
  id: 'enclose',
  label: 'Enclose in',
  icon: Box,
  category: 'transform',
  isAvailable: (type) => !isContainer(type),
  submenu: [
    {
      id: 'enclose-vstack',
      label: 'VStack',
      icon: Rows,
      category: 'transform',
      isAvailable: () => true,
      execute: (context) => {
        const wrapper = {
          type: 'vstack',
          spacing: 8,
          children: [context.componentData],
        };
        const path = stringToPath(context.componentPath);
        useEditorStore.getState().updateValue(path, wrapper);
      },
    },
    {
      id: 'enclose-hstack',
      label: 'HStack',
      icon: Columns,
      category: 'transform',
      isAvailable: () => true,
      execute: (context) => {
        const wrapper = {
          type: 'hstack',
          spacing: 8,
          children: [context.componentData],
        };
        const path = stringToPath(context.componentPath);
        useEditorStore.getState().updateValue(path, wrapper);
      },
    },
    {
      id: 'enclose-zstack',
      label: 'ZStack',
      icon: Layers,
      category: 'transform',
      isAvailable: () => true,
      execute: (context) => {
        const wrapper = {
          type: 'zstack',
          children: [context.componentData],
        };
        const path = stringToPath(context.componentPath);
        useEditorStore.getState().updateValue(path, wrapper);
      },
    },
    {
      id: 'enclose-foreach',
      label: 'ForEach',
      icon: IterationCw,
      category: 'transform',
      isAvailable: () => true,
      execute: (context) => {
        const wrapper = {
          type: 'forEach',
          dataSource: '',
          template: context.componentData,
        };
        const path = stringToPath(context.componentPath);
        useEditorStore.getState().updateValue(path, wrapper);
      },
    },
  ],
};

/**
 * All enclose actions (now just the single parent action)
 */
export const encloseActions = [encloseAction];
