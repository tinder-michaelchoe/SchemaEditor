import { definePlugin } from '@/core';
import { manifest } from './manifest';

export default definePlugin({
  manifest,
  onActivate: (ctx) => {
    console.log('[component-palette] Plugin activated');
  },
  onDeactivate: () => {
    console.log('[component-palette] Plugin deactivated');
  },
});

export { manifest };
export { PalettePopover } from './components/PalettePopover';
export { FloatingPalette } from './components/FloatingPalette';
export { ComponentCard } from './components/ComponentCard';
export { CategorySection } from './components/CategorySection';
export {
  COMPONENT_DEFINITIONS,
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  getComponentByType,
} from './data/componentDefinitions';
export type { ComponentDefinition } from './data/componentDefinitions';
