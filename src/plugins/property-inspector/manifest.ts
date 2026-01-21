import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'property-inspector',
  name: 'Property Inspector',
  version: '1.0.0',
  description: 'Panel for editing selected node properties',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:sidebar:right'],
  capabilities: [
    'document:read',
    'document:write',
    'selection:read',
    'ui:read',
    'events:subscribe',
    'extensions:define',
    'services:consume',
  ],
  extensionPoints: [
    {
      id: 'property-inspector.editor',
      description: 'Custom property editors for specific types or patterns',
      schema: {
        type: 'object',
        properties: {
          propertyPattern: { type: 'string' },
          propertyType: { type: 'string' },
          component: { type: 'function' },
          priority: { type: 'number' },
        },
        required: ['component'],
      },
    },
  ],
  consumes: ['style-resolver'],
  subscribes: ['selection:changed'],
};
