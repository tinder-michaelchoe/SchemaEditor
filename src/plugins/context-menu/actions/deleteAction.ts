/**
 * Delete Action
 *
 * Action for deleting/removing components from the canvas
 */

import type { ContextMenuAction } from '../types';
import { editorStoreRef } from '@/store/storeRefs';
import { stringToPath } from '@/utils/pathUtils';
import { Trash2 } from 'lucide-react';

/**
 * Delete component action
 */
export const deleteAction: ContextMenuAction = {
  id: 'delete',
  label: 'Delete',
  icon: Trash2,
  category: 'edit',
  isAvailable: () => true, // Always available
  dividerBefore: true, // Show divider before this action
  danger: true, // Red/destructive styling
  execute: (context) => {
    const path = stringToPath(context.componentPath);

    // Get parent path and index
    if (path.length < 2) {
      console.warn('Cannot delete root component');
      return;
    }

    // Extract parent path and child index
    const childIndex = path[path.length - 1];
    const parentPath = path.slice(0, -2); // Remove property name and index
    const propertyName = path[path.length - 2]; // 'children', 'template', etc.

    if (typeof childIndex === 'number') {
      // It's an array item, use removeArrayItem
      const arrayPath = [...parentPath, propertyName];
      editorStoreRef.current!.removeArrayItem(arrayPath, childIndex);
    } else {
      console.warn('Cannot delete: component is not in an array', path);
    }
  },
};
