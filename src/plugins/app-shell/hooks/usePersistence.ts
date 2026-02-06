import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PersistentUIState {
  // Panel sizes
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  inspectorWidth: number;
  layersPanelWidth: number;
  
  // Panel visibility
  isInspectorOpen: boolean;
  isErrorConsoleOpen: boolean;
  isLayersPanelOpen: boolean;
  isLayersPanelCollapsed: boolean;
  isLeftPanelCollapsed: boolean;
  isMinimapExpanded: boolean;

  // Active tabs
  leftPanelTab: string;
  rightPanelTab: string;
  
  // Canvas state
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  canvasDevice: string;
  
  // Tree state
  expandedPaths: string[];
  
  // Layers panel state
  layersExpandedPaths: string[];
  
  // JSON Output state
  isJsonWrapEnabled: boolean;
  
  // Theme
  isDarkMode: boolean;
  
  // Actions
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
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
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
  leftPanelTab: 'json', // Default to JSON Output
  rightPanelTab: 'tree',
  canvasZoom: 1,
  canvasPanX: 0,
  canvasPanY: 0,
  canvasDevice: 'iphone-17-pro',
  expandedPaths: ['root'],
  layersExpandedPaths: ['root.children'],
  isJsonWrapEnabled: true, // Default to on for JSON output
  isDarkMode: false,
};

export const usePersistentUIStore = create<PersistentUIState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      
      setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),
      setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
      setInspectorWidth: (width) => set({ inspectorWidth: width }),
      setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPan: (x, y) => set({ canvasPanX: x, canvasPanY: y }),
      setCanvasDevice: (deviceId) => set({ canvasDevice: deviceId }),
      setExpandedPaths: (paths) => set({ expandedPaths: paths }),
      setLayersExpandedPaths: (paths) => set({ layersExpandedPaths: paths }),
      setLayersPanelWidth: (width) => set({ layersPanelWidth: width }),
      setIsLayersPanelOpen: (isOpen) => set({ isLayersPanelOpen: isOpen }),
      setIsLayersPanelCollapsed: (isCollapsed) => set({ isLayersPanelCollapsed: isCollapsed }),
      setIsLeftPanelCollapsed: (isCollapsed) => set({ isLeftPanelCollapsed: isCollapsed }),
      setIsMinimapExpanded: (isExpanded) => set({ isMinimapExpanded: isExpanded }),
      setIsJsonWrapEnabled: (enabled) => set({ isJsonWrapEnabled: enabled }),
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      setIsInspectorOpen: (isOpen) => set({ isInspectorOpen: isOpen }),
      setIsErrorConsoleOpen: (isOpen) => set({ isErrorConsoleOpen: isOpen }),
      resetToDefaults: () => set(DEFAULT_STATE),
    }),
    {
      name: 'schema-editor-ui-state',
      version: 1,
      partialize: (state) => ({
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
      }),
    }
  )
);

/**
 * Hook to access and manage persistent UI state
 */
export function usePersistence() {
  const store = usePersistentUIStore();
  return store;
}
