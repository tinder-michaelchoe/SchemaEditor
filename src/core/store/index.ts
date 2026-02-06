/**
 * Core Store Index
 * 
 * Re-exports all core store modules.
 */

// Document store
export {
  createDocumentStoreAdapter,
  useDocumentState,
  useHasDocument,
  useValidationErrors,
  useIsValid,
} from './documentStore';

// Selection store
export {
  useSelectionState,
  useSelectionActions,
  useSelectedPath,
  useEditingPath,
  getSelectionStoreInterface,
} from './selectionStore';

export { useHoveredPath } from '../../store/SelectionContext';

// UI store
export {
  useUIState,
  useUIActions,
  useIsDarkMode,
  useViewMode,
  useExpandedPaths,
  getUIStoreInterface,
} from './uiStore';
