/**
 * SelectionContext
 *
 * Lightweight context for hoveredPath — isolated to avoid re-rendering
 * the entire tree on every mouse move.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { selectionStoreRef } from './storeRefs';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SelectionStateContextValue {
  hoveredPath: string | null;
}

interface SelectionActionsContextValue {
  setHoveredPath: (path: string | null) => void;
}

// ─── Contexts ────────────────────────────────────────────────────────────────

const SelectionStateContext = createContext<SelectionStateContextValue | null>(null);
const SelectionActionsContext = createContext<SelectionActionsContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [hoveredPath, setHoveredPathRaw] = useState<string | null>(null);

  const setHoveredPath = useCallback((path: string | null) => {
    setHoveredPathRaw(path);
  }, []);

  const stateValue = useMemo(() => ({ hoveredPath }), [hoveredPath]);
  const actionsValue = useMemo(() => ({ setHoveredPath }), [setHoveredPath]);

  // Sync ref
  useEffect(() => {
    selectionStoreRef.current = { hoveredPath, setHoveredPath };
  });

  return (
    <SelectionStateContext.Provider value={stateValue}>
      <SelectionActionsContext.Provider value={actionsValue}>
        {children}
      </SelectionActionsContext.Provider>
    </SelectionStateContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useHoveredPath(): string | null {
  const ctx = useContext(SelectionStateContext);
  if (!ctx) throw new Error('useHoveredPath must be used within a SelectionProvider');
  return ctx.hoveredPath;
}

export function useSetHoveredPath(): (path: string | null) => void {
  const ctx = useContext(SelectionActionsContext);
  if (!ctx) throw new Error('useSetHoveredPath must be used within a SelectionProvider');
  return ctx.setHoveredPath;
}
