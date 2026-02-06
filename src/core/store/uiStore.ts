/**
 * UI Store
 *
 * Core store for UI state (theme, view mode, expanded paths).
 * Uses EditorContext + UIContext for React access, refs for imperative access.
 */

import { useEditorState, useEditorActions } from '../../store/EditorContext';
import { useUIState as useUIContextState } from '../../store/UIContext';
import { editorStoreRef, uiStoreRef } from '../../store/storeRefs';
import type { ViewMode } from '../types/plugin';

// ============================================================================
// Types
// ============================================================================

interface CoreUIState {
  isDarkMode: boolean;
  viewMode: ViewMode;
  expandedPaths: Set<string>;
}

interface CoreUIActions {
  toggleDarkMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleExpanded: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

// ============================================================================
// UI Hooks
// ============================================================================

/**
 * Hook to access UI state
 */
export function useUIState(): CoreUIState {
  const { isDarkMode, expandedPaths } = useEditorState();
  const { viewMode } = useUIContextState();

  return {
    isDarkMode,
    viewMode: viewMode as ViewMode,
    expandedPaths,
  };
}

/**
 * Hook to access UI actions
 */
export function useUIActions(): CoreUIActions {
  const editorActions = useEditorActions();
  const uiState = useUIContextState();

  return {
    toggleDarkMode: editorActions.toggleDarkMode,
    setViewMode: (mode: ViewMode) => uiStoreRef.current?.setViewMode(mode),
    toggleExpanded: editorActions.toggleExpanded,
    expandAll: editorActions.expandAll,
    collapseAll: editorActions.collapseAll,
  };
}

/**
 * Hook to get dark mode state
 */
export function useIsDarkMode(): boolean {
  const { isDarkMode } = useEditorState();
  return isDarkMode;
}

/**
 * Hook to get view mode
 */
export function useViewMode(): ViewMode {
  const { viewMode } = useUIContextState();
  return viewMode as ViewMode;
}

/**
 * Hook to get expanded paths
 */
export function useExpandedPaths(): Set<string> {
  const { expandedPaths } = useEditorState();
  return expandedPaths;
}

/**
 * Get UI store interface for CoreStores (imperative access)
 */
export function getUIStoreInterface() {
  return {
    isDarkMode: () => editorStoreRef.current?.isDarkMode ?? false,
    getViewMode: () => (uiStoreRef.current?.viewMode ?? 'tree') as ViewMode,
    getExpandedPaths: () => editorStoreRef.current?.expandedPaths ?? new Set(['root']),
    toggleDarkMode: () => editorStoreRef.current?.toggleDarkMode(),
    setViewMode: (mode: ViewMode) => uiStoreRef.current?.setViewMode(mode),
    toggleExpanded: (path: string) => editorStoreRef.current?.toggleExpanded(path),
    expandAll: () => editorStoreRef.current?.expandAll(),
    collapseAll: () => editorStoreRef.current?.collapseAll(),
  };
}
