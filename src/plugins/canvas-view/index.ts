import { definePlugin } from '@/core';
import { manifest } from './manifest';

export default definePlugin({
  manifest,
  onActivate: (ctx) => {
    console.log('[canvas-view] Plugin activated');
  },
  onDeactivate: () => {
    console.log('[canvas-view] Plugin deactivated');
  },
});

export { manifest };

// Components
export { CanvasView } from './components/CanvasView';
export { CanvasNode } from './components/CanvasNode';
export { CanvasToolbar } from './components/CanvasToolbar';
export { CanvasMinimap } from './components/CanvasMinimap';
export { SplitView } from './components/SplitView';
export { EditorPanel } from './components/EditorPanel';
export { 
  SelectionOverlay, 
  HoverOverlay, 
  MultiSelectOverlay, 
  MarqueeOverlay,
} from './components/SelectionOverlay';
export { SmartGuides, DistanceIndicator } from './components/SmartGuides';

// Hooks
export { useCanvasNavigation } from './hooks/useCanvasNavigation';
export { useCanvasSelection } from './hooks/useCanvasSelection';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { useSmartGuides } from './hooks/useSmartGuides';
