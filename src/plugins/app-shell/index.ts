import { definePlugin } from '@/core';
import { manifest } from './manifest';

export default definePlugin({
  manifest,
  onActivate: (ctx) => {
    console.log('[app-shell] Plugin activated');
  },
  onDeactivate: () => {
    console.log('[app-shell] Plugin deactivated');
  },
});

export { manifest };
export { AppShell } from './components/AppShell';
export { TabbedPanel } from './components/TabbedPanel';
export type { TabDefinition } from './components/TabbedPanel';
export { ResizableDivider } from './components/ResizableDivider';
export { Toolbar } from './components/Toolbar';
export { usePersistence } from './hooks/usePersistence';
