import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'canvas-view',
  name: 'Canvas View',
  version: '1.0.0',
  description: 'Visual canvas for direct manipulation of CLADS components',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:main:view'],
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'selection:write',
    'ui:read',
    'ui:write',
    'events:emit',
    'events:subscribe',
    'extensions:define',
    'services:consume',
  ],
  extensionPoints: [
    {
      id: 'canvas-view.nodeRenderer',
      description: 'Custom renderers for specific component types',
      schema: {
        type: 'object',
        properties: {
          componentType: { type: 'string' },
          component: { type: 'function' },
          priority: { type: 'number' },
        },
        required: ['componentType', 'component'],
      },
    },
    {
      id: 'canvas-view.overlay',
      description: 'Overlay widgets (rulers, guides, etc.)',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          component: { type: 'function' },
          layer: { type: 'string', enum: ['background', 'foreground'] },
        },
        required: ['id', 'component'],
      },
    },
  ],
  consumes: ['drag-drop-manager', 'style-resolver'],
  emits: [
    'canvas:zoom-changed',
    'canvas:pan-changed',
    'canvas:node-clicked',
    'canvas:node-double-clicked',
    'canvas:node-dragged',
    'canvas:node-resized',
  ],
  subscribes: ['selection:changed', 'document:changed'],
};
