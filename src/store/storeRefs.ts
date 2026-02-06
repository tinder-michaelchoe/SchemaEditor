/**
 * Store Refs
 *
 * Module-level refs for imperative access to store state/actions
 * outside of React (context menu actions, core initialization, store adapters).
 *
 * Each Provider syncs its ref via useEffect so non-React code can read/write
 * through these refs.
 */

import type { EditorState, EditorActions } from './EditorContext';
import type { UIState, UIActions } from './UIContext';

export const editorStoreRef: { current: (EditorState & EditorActions) | null } = { current: null };

export const uiStoreRef: { current: (UIState & UIActions) | null } = { current: null };

export const selectionStoreRef: {
  current: {
    hoveredPath: string | null;
    setHoveredPath: (path: string | null) => void;
  } | null;
} = { current: null };
