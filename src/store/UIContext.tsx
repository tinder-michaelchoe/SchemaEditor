/**
 * UIContext
 *
 * React Context + useReducer replacement for usePersistentUIStore + useViewModeStore.
 * Manages panel sizes, visibility, canvas state, and view mode.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { uiStoreRef } from './storeRefs';
import {
  UI_STORAGE_KEY,
  deserializeUIState,
  safeSetItem,
  UI_STORAGE_VERSION,
} from './persistence';

// ─── State type ──────────────────────────────────────────────────────────────

export interface UIState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  inspectorWidth: number;
  layersPanelWidth: number;
  isInspectorOpen: boolean;
  isErrorConsoleOpen: boolean;
  isLayersPanelOpen: boolean;
  isLayersPanelCollapsed: boolean;
  isLeftPanelCollapsed: boolean;
  isMinimapExpanded: boolean;
  leftPanelTab: string;
  rightPanelTab: string;
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  canvasDevice: string;
  expandedPaths: string[];
  layersExpandedPaths: string[];
  isJsonWrapEnabled: boolean;
  isDarkMode: boolean;
  viewMode: string;
}

// ─── Actions type ────────────────────────────────────────────────────────────

export interface UIActions {
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  setInspectorWidth: (width: number) => void;
  setLeftPanelTab: (tab: string) => void;
  setRightPanelTab: (tab: string) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (x: number, y: number) => void;
  setCanvasDevice: (deviceId: string) => void;
  setExpandedPaths: (paths: string[]) => void;
  setLayersExpandedPaths: (paths: string[]) => void;
  setLayersPanelWidth: (width: number) => void;
  setIsLayersPanelOpen: (isOpen: boolean) => void;
  setIsLayersPanelCollapsed: (isCollapsed: boolean) => void;
  setIsLeftPanelCollapsed: (isCollapsed: boolean) => void;
  setIsMinimapExpanded: (isExpanded: boolean) => void;
  setIsJsonWrapEnabled: (enabled: boolean) => void;
  setDarkMode: (isDark: boolean) => void;
  setIsInspectorOpen: (isOpen: boolean) => void;
  setIsErrorConsoleOpen: (isOpen: boolean) => void;
  setViewMode: (mode: string) => void;
  resetToDefaults: () => void;
}

// ─── Default state ───────────────────────────────────────────────────────────

const DEFAULT_UI_STATE: UIState = {
  leftPanelWidth: 400,
  rightPanelWidth: 500,
  bottomPanelHeight: 200,
  inspectorWidth: 280,
  layersPanelWidth: 220,
  isInspectorOpen: true,
  isErrorConsoleOpen: false,
  isLayersPanelOpen: true,
  isLayersPanelCollapsed: false,
  isLeftPanelCollapsed: false,
  isMinimapExpanded: false,
  leftPanelTab: 'json',
  rightPanelTab: 'tree',
  canvasZoom: 1,
  canvasPanX: 0,
  canvasPanY: 0,
  canvasDevice: 'iphone-17-pro',
  expandedPaths: ['root'],
  layersExpandedPaths: ['root.children'],
  isJsonWrapEnabled: true,
  isDarkMode: false,
  viewMode: 'tree',
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

type UIAction =
  | { type: 'SET'; payload: Partial<UIState> }
  | { type: 'RESET' };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET':
      return { ...state, ...action.payload };
    case 'RESET':
      return DEFAULT_UI_STATE;
    default:
      return state;
  }
}

// ─── Contexts ────────────────────────────────────────────────────────────────

const UIStateContext = createContext<UIState | null>(null);
const UIActionsContext = createContext<UIActions | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function UIProvider({ children }: { children: ReactNode }) {
  const initialState = useMemo(() => {
    const persisted = deserializeUIState();
    if (!persisted) return DEFAULT_UI_STATE;
    // Merge persisted fields onto defaults (so new fields get default values)
    return {
      ...DEFAULT_UI_STATE,
      leftPanelWidth: persisted.leftPanelWidth ?? DEFAULT_UI_STATE.leftPanelWidth,
      rightPanelWidth: persisted.rightPanelWidth ?? DEFAULT_UI_STATE.rightPanelWidth,
      bottomPanelHeight: persisted.bottomPanelHeight ?? DEFAULT_UI_STATE.bottomPanelHeight,
      inspectorWidth: persisted.inspectorWidth ?? DEFAULT_UI_STATE.inspectorWidth,
      layersPanelWidth: persisted.layersPanelWidth ?? DEFAULT_UI_STATE.layersPanelWidth,
      isInspectorOpen: persisted.isInspectorOpen ?? DEFAULT_UI_STATE.isInspectorOpen,
      isErrorConsoleOpen: persisted.isErrorConsoleOpen ?? DEFAULT_UI_STATE.isErrorConsoleOpen,
      isLayersPanelOpen: persisted.isLayersPanelOpen ?? DEFAULT_UI_STATE.isLayersPanelOpen,
      isLayersPanelCollapsed: persisted.isLayersPanelCollapsed ?? DEFAULT_UI_STATE.isLayersPanelCollapsed,
      isLeftPanelCollapsed: persisted.isLeftPanelCollapsed ?? DEFAULT_UI_STATE.isLeftPanelCollapsed,
      isMinimapExpanded: persisted.isMinimapExpanded ?? DEFAULT_UI_STATE.isMinimapExpanded,
      leftPanelTab: persisted.leftPanelTab ?? DEFAULT_UI_STATE.leftPanelTab,
      rightPanelTab: persisted.rightPanelTab ?? DEFAULT_UI_STATE.rightPanelTab,
      canvasZoom: persisted.canvasZoom ?? DEFAULT_UI_STATE.canvasZoom,
      canvasPanX: persisted.canvasPanX ?? DEFAULT_UI_STATE.canvasPanX,
      canvasPanY: persisted.canvasPanY ?? DEFAULT_UI_STATE.canvasPanY,
      canvasDevice: persisted.canvasDevice ?? DEFAULT_UI_STATE.canvasDevice,
      expandedPaths: persisted.expandedPaths ?? DEFAULT_UI_STATE.expandedPaths,
      layersExpandedPaths: persisted.layersExpandedPaths ?? DEFAULT_UI_STATE.layersExpandedPaths,
      isJsonWrapEnabled: persisted.isJsonWrapEnabled ?? DEFAULT_UI_STATE.isJsonWrapEnabled,
      isDarkMode: persisted.isDarkMode ?? DEFAULT_UI_STATE.isDarkMode,
    };
  }, []);

  const [state, dispatch] = useReducer(uiReducer, initialState);

  const actions: UIActions = useMemo(() => ({
    setLeftPanelWidth: (width) => dispatch({ type: 'SET', payload: { leftPanelWidth: width } }),
    setRightPanelWidth: (width) => dispatch({ type: 'SET', payload: { rightPanelWidth: width } }),
    setBottomPanelHeight: (height) => dispatch({ type: 'SET', payload: { bottomPanelHeight: height } }),
    setInspectorWidth: (width) => dispatch({ type: 'SET', payload: { inspectorWidth: width } }),
    setLeftPanelTab: (tab) => dispatch({ type: 'SET', payload: { leftPanelTab: tab } }),
    setRightPanelTab: (tab) => dispatch({ type: 'SET', payload: { rightPanelTab: tab } }),
    setCanvasZoom: (zoom) => dispatch({ type: 'SET', payload: { canvasZoom: zoom } }),
    setCanvasPan: (x, y) => dispatch({ type: 'SET', payload: { canvasPanX: x, canvasPanY: y } }),
    setCanvasDevice: (deviceId) => dispatch({ type: 'SET', payload: { canvasDevice: deviceId } }),
    setExpandedPaths: (paths) => dispatch({ type: 'SET', payload: { expandedPaths: paths } }),
    setLayersExpandedPaths: (paths) => dispatch({ type: 'SET', payload: { layersExpandedPaths: paths } }),
    setLayersPanelWidth: (width) => dispatch({ type: 'SET', payload: { layersPanelWidth: width } }),
    setIsLayersPanelOpen: (isOpen) => dispatch({ type: 'SET', payload: { isLayersPanelOpen: isOpen } }),
    setIsLayersPanelCollapsed: (isCollapsed) => dispatch({ type: 'SET', payload: { isLayersPanelCollapsed: isCollapsed } }),
    setIsLeftPanelCollapsed: (isCollapsed) => dispatch({ type: 'SET', payload: { isLeftPanelCollapsed: isCollapsed } }),
    setIsMinimapExpanded: (isExpanded) => dispatch({ type: 'SET', payload: { isMinimapExpanded: isExpanded } }),
    setIsJsonWrapEnabled: (enabled) => dispatch({ type: 'SET', payload: { isJsonWrapEnabled: enabled } }),
    setDarkMode: (isDark) => dispatch({ type: 'SET', payload: { isDarkMode: isDark } }),
    setIsInspectorOpen: (isOpen) => dispatch({ type: 'SET', payload: { isInspectorOpen: isOpen } }),
    setIsErrorConsoleOpen: (isOpen) => dispatch({ type: 'SET', payload: { isErrorConsoleOpen: isOpen } }),
    setViewMode: (mode) => dispatch({ type: 'SET', payload: { viewMode: mode } }),
    resetToDefaults: () => dispatch({ type: 'RESET' }),
  }), [dispatch]);

  // ── Sync storeRef ──

  useEffect(() => {
    uiStoreRef.current = { ...state, ...actions };
  });

  // ── Persist to localStorage (debounced) ──

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const payload = {
        _version: UI_STORAGE_VERSION,
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        inspectorWidth: state.inspectorWidth,
        layersPanelWidth: state.layersPanelWidth,
        isInspectorOpen: state.isInspectorOpen,
        isErrorConsoleOpen: state.isErrorConsoleOpen,
        isLayersPanelOpen: state.isLayersPanelOpen,
        isLayersPanelCollapsed: state.isLayersPanelCollapsed,
        isLeftPanelCollapsed: state.isLeftPanelCollapsed,
        isMinimapExpanded: state.isMinimapExpanded,
        leftPanelTab: state.leftPanelTab,
        rightPanelTab: state.rightPanelTab,
        canvasZoom: state.canvasZoom,
        canvasPanX: state.canvasPanX,
        canvasPanY: state.canvasPanY,
        canvasDevice: state.canvasDevice,
        expandedPaths: state.expandedPaths,
        layersExpandedPaths: state.layersExpandedPaths,
        isJsonWrapEnabled: state.isJsonWrapEnabled,
        isDarkMode: state.isDarkMode,
      };
      safeSetItem(UI_STORAGE_KEY, JSON.stringify(payload));
    }, 300);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [state]);

  return (
    <UIStateContext.Provider value={state}>
      <UIActionsContext.Provider value={actions}>
        {children}
      </UIActionsContext.Provider>
    </UIStateContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useUIState(): UIState {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error('useUIState must be used within a UIProvider');
  return ctx;
}

export function useUIActions(): UIActions {
  const ctx = useContext(UIActionsContext);
  if (!ctx) throw new Error('useUIActions must be used within a UIProvider');
  return ctx;
}

/** Convenience hook returning both state and actions */
export function useUI(): UIState & UIActions {
  const state = useUIState();
  const actions = useUIActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
