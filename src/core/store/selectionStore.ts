/**
 * Selection Store
 *
 * Core store for selection state.
 * Uses EditorContext + SelectionContext for React access, refs for imperative access.
 */

import { useEditorState, useEditorActions } from '../../store/EditorContext';
import { useHoveredPath, useSetHoveredPath } from '../../store/SelectionContext';
import { editorStoreRef, selectionStoreRef } from '../../store/storeRefs';

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
// Selection Hooks
// ============================================================================

/**
 * Hook to access selection state
 */
export function useSelectionState(): SelectionState {
  const { selectedPath, editingPath } = useEditorState();
  const hoveredPath = useHoveredPath();

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
  const { setSelectedPath, setEditingPath } = useEditorActions();
  const setHoveredPath = useSetHoveredPath();

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
  const { selectedPath } = useEditorState();
  return selectedPath;
}

/**
 * Hook to get the editing path
 */
export function useEditingPath(): string | null {
  const { editingPath } = useEditorState();
  return editingPath;
}

/**
 * Get selection store interface for CoreStores (imperative access)
 */
export function getSelectionStoreInterface() {
  return {
    getSelectedPath: () => editorStoreRef.current?.selectedPath ?? null,
    getEditingPath: () => editorStoreRef.current?.editingPath ?? null,
    getHoveredPath: () => selectionStoreRef.current?.hoveredPath ?? null,
    setSelectedPath: (path: string | null) =>
      editorStoreRef.current?.setSelectedPath(path),
    setEditingPath: (path: string | null) =>
      editorStoreRef.current?.setEditingPath(path),
    setHoveredPath: (path: string | null) =>
      selectionStoreRef.current?.setHoveredPath(path),
  };
}
