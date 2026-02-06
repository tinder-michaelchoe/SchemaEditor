/**
 * Context Menu Plugin
 *
 * Public exports for the context menu system
 */

export { ContextMenu } from './components/ContextMenu';
export { ContextMenuItem } from './components/ContextMenuItem';
export { useContextMenu } from './hooks/useContextMenu';
export {
  ContextMenuRegistry,
  getContextMenuRegistry,
  initContextMenuRegistry,
} from './ContextMenuRegistry';
export type {
  ContextMenuAction,
  ActionContext,
  ComponentActionsConfig,
} from './types';
export { encloseActions } from './actions/encloseActions';
export { deleteAction } from './actions/deleteAction';
