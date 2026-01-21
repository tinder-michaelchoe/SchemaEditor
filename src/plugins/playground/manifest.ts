/**
 * Plugin Playground Manifest
 * 
 * Interactive playground for testing and debugging plugins.
 * Shows event logs, state inspector, and plugin status.
 */

import type { PluginManifest } from '../../core/types';

export const manifest: PluginManifest = {
  id: 'plugin-playground',
  version: '1.0.0',
  name: 'Plugin Playground',
  description: 'Interactive playground for testing and debugging plugins',
  
  capabilities: [
    'document:read',
    'selection:read',
    'ui:slots',
    'ui:theme',
    'events:subscribe',
    'services:consume',
  ],
  
  // Developer tool - activate on demand
  activationEvents: ['onCommand:open-playground'],
  
  slots: [
    {
      slot: 'panel:bottom',
      component: 'PlaygroundPanel',
      priority: 50,
    },
  ],
  
  // Extension point for custom playground panels
  extensionPoints: [
    {
      id: 'plugin-playground.panel',
      description: 'Additional panels for the playground',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          icon: { type: 'string' },
          component: { type: 'unknown' },
        },
        required: ['id', 'label', 'component'],
      },
    },
  ],
};

export default manifest;
