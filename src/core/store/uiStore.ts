/**
 * UI Store
 * 
 * Core store for UI state (theme, view mode, expanded paths).
 * This is a thin wrapper that integrates with the existing editorStore.
 */

import { create } from 'zustand';
import { useEditorStore } from '../../store/editorStore';
import type { ViewMode } from '../types/plugin';

// ============================================================================
// Types
// ============================================================================

interface UIState {
  isDarkMode: boolean;
  viewMode: ViewMode;
  expandedPaths: Set<string>;
}

interface UIActions {
  toggleDarkMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleExpanded: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

// ============================================================================
// View Mode Store (not in editor store)
// ============================================================================

/**
 * Separate store for view mode since it's not in the main editor store
 */
const useViewModeStore = create<{
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}>((set) => ({
  viewMode: 'tree',
  setViewMode: (mode) => set({ viewMode: mode }),
}));

// ============================================================================
// UI Hooks
// ============================================================================

/**
 * Hook to access UI state
 */
export function useUIState(): UIState {
  const { isDarkMode, expandedPaths } = useEditorStore();
  const { viewMode } = useViewModeStore();
  
  return {
    isDarkMode,
    viewMode,
    expandedPaths,
  };
}

/**
 * Hook to access UI actions
 */
export function useUIActions(): UIActions {
  const toggleDarkMode = useEditorStore((state) => state.toggleDarkMode);
  const toggleExpanded = useEditorStore((state) => state.toggleExpanded);
  const expandAll = useEditorStore((state) => state.expandAll);
  const collapseAll = useEditorStore((state) => state.collapseAll);
  const setViewMode = useViewModeStore((state) => state.setViewMode);
  
  return {
    toggleDarkMode,
    setViewMode,
    toggleExpanded,
    expandAll,
    collapseAll,
  };
}

/**
 * Hook to get dark mode state
 */
export function useIsDarkMode(): boolean {
  return useEditorStore((state) => state.isDarkMode);
}

/**
 * Hook to get view mode
 */
export function useViewMode(): ViewMode {
  return useViewModeStore((state) => state.viewMode);
}

/**
 * Hook to get expanded paths
 */
export function useExpandedPaths(): Set<string> {
  return useEditorStore((state) => state.expandedPaths);
}

/**
 * Get UI store interface for CoreStores
 */
export function getUIStoreInterface() {
  return {
    isDarkMode: () => useEditorStore.getState().isDarkMode,
    getViewMode: () => useViewModeStore.getState().viewMode,
    getExpandedPaths: () => useEditorStore.getState().expandedPaths,
    toggleDarkMode: () => useEditorStore.getState().toggleDarkMode(),
    setViewMode: (mode: ViewMode) => useViewModeStore.getState().setViewMode(mode),
    toggleExpanded: (path: string) => useEditorStore.getState().toggleExpanded(path),
    expandAll: () => useEditorStore.getState().expandAll(),
    collapseAll: () => useEditorStore.getState().collapseAll(),
  };
}
