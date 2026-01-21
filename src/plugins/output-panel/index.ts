import { definePlugin } from '@/core';
import { manifest } from './manifest';

export default definePlugin({
  manifest,
  onActivate: (ctx) => {
    console.log('[output-panel] Plugin activated');
  },
  onDeactivate: () => {
    console.log('[output-panel] Plugin deactivated');
  },
});

export { manifest };
export { OutputPanel } from './components/OutputPanel';
