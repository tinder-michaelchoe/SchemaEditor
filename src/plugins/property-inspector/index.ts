import { definePlugin } from '@/core';
import { manifest } from './manifest';

export default definePlugin({
  manifest,
  onActivate: (ctx) => {
    console.log('[property-inspector] Plugin activated');
  },
  onDeactivate: () => {
    console.log('[property-inspector] Plugin deactivated');
  },
});

export { manifest };
export { InspectorPanel } from './components/InspectorPanel';
export { PropertySection } from './components/PropertySection';
export { PropertyRow } from './components/PropertyRow';
export { StylesPanel } from './components/StylesPanel';

// Export editors
export { TextEditor } from './editors/TextEditor';
export { NumberEditor } from './editors/NumberEditor';
export { BooleanEditor } from './editors/BooleanEditor';
export { EnumEditor } from './editors/EnumEditor';
export { ArrayEditor } from './editors/ArrayEditor';
export { ObjectEditor } from './editors/ObjectEditor';
