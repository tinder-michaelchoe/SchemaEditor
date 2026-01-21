import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'drag-drop-service',
  name: 'Drag Drop Service',
  version: '1.0.0',
  description: 'Coordinates drag-drop operations across the application',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: [
    'document:read',
    'document:write',
    'events:emit',
    'services:provide',
  ],
  provides: [
    {
      id: 'drag-drop-manager',
      interface: 'IDragDropManager',
    },
  ],
  emits: [
    'drag:start',
    'drag:move',
    'drag:end',
    'drop',
  ],
};
