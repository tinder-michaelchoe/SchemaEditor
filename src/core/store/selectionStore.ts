/**
 * Selection Store
 * 
 * Core store for selection state.
 * This is a thin wrapper that integrates with the existing editorStore.
 */

import { create } from 'zustand';
import { useEditorStore } from '../../store/editorStore';

// ============================================================================
// Types
// ============================================================================

interface SelectionState {
  selectedPath: string | null;
  editingPath: string | null;
  hoveredPath: string | null;
}

interface SelectionActions {
  setSelectedPath: (path: string | null) => void;
  setEditingPath: (path: string | null) => void;
  setHoveredPath: (path: string | null) => void;
}

// ============================================================================
// Hovered Path Store (not in editor store)
// ============================================================================

/**
 * Separate store for hovered path since it's not in the main editor store
 */
const useHoveredPathStore = create<{
  hoveredPath: string | null;
  setHoveredPath: (path: string | null) => void;
}>((set) => ({
  hoveredPath: null,
  setHoveredPath: (path) => set({ hoveredPath: path }),
}));

// ============================================================================
// Selection Hooks
// ============================================================================

/**
 * Hook to access selection state
 */
export function useSelectionState(): SelectionState {
  const { selectedPath, editingPath } = useEditorStore();
  const { hoveredPath } = useHoveredPathStore();
  
  return {
    selectedPath,
    editingPath,
    hoveredPath,
  };
}

/**
 * Hook to access selection actions
 */
export function useSelectionActions(): SelectionActions {
  const setSelectedPath = useEditorStore((state) => state.setSelectedPath);
  const setEditingPath = useEditorStore((state) => state.setEditingPath);
  const setHoveredPath = useHoveredPathStore((state) => state.setHoveredPath);
  
  return {
    setSelectedPath,
    setEditingPath,
    setHoveredPath,
  };
}

/**
 * Hook to get the selected path
 */
export function useSelectedPath(): string | null {
  return useEditorStore((state) => state.selectedPath);
}

/**
 * Hook to get the editing path
 */
export function useEditingPath(): string | null {
  return useEditorStore((state) => state.editingPath);
}

/**
 * Hook to get the hovered path
 */
export function useHoveredPath(): string | null {
  return useHoveredPathStore((state) => state.hoveredPath);
}

/**
 * Get selection store interface for CoreStores
 */
export function getSelectionStoreInterface() {
  return {
    getSelectedPath: () => useEditorStore.getState().selectedPath,
    getEditingPath: () => useEditorStore.getState().editingPath,
    getHoveredPath: () => useHoveredPathStore.getState().hoveredPath,
    setSelectedPath: (path: string | null) => 
      useEditorStore.getState().setSelectedPath(path),
    setEditingPath: (path: string | null) => 
      useEditorStore.getState().setEditingPath(path),
    setHoveredPath: (path: string | null) => 
      useHoveredPathStore.getState().setHoveredPath(path),
  };
}
