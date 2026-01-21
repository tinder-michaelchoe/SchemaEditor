import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'component-palette',
  name: 'Component Palette',
  version: '1.0.0',
  description: 'Toolbar popover with draggable CLADS components',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:toolbar'],
  capabilities: [
    'document:read',
    'document:write',
    'ui:read',
    'events:emit',
    'services:consume',
    'extensions:define',
  ],
  extensionPoints: [
    {
      id: 'component-palette.component',
      description: 'Custom components to add to the palette',
      schema: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          icon: { type: 'string' },
          description: { type: 'string' },
          defaultProps: { type: 'object' },
        },
        required: ['type', 'name', 'category'],
      },
    },
  ],
  consumes: ['drag-drop-manager'],
  emits: [
    'palette:component-selected',
    'palette:drag-start',
    'palette:drag-end',
  ],
};
