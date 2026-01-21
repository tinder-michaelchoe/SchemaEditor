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
  useHoveredPath,
  getSelectionStoreInterface,
} from './selectionStore';

// UI store
export {
  useUIState,
  useUIActions,
  useIsDarkMode,
  useViewMode,
  useExpandedPaths,
  getUIStoreInterface,
} from './uiStore';
