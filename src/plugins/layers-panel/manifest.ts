import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'layers-panel',
  name: 'Layers Panel',
  version: '1.0.0',
  description: 'Figma-style layers panel for viewing and managing component hierarchy',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:sidebar:left'],
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'selection:write',
    'ui:read',
    'events:subscribe',
    'events:emit',
  ],
  subscribes: ['selection:changed', 'document:changed'],
  emits: ['layers:visibility-changed', 'layers:lock-changed'],
};
