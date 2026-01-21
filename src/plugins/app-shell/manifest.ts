import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'app-shell',
  name: 'App Shell',
  version: '1.0.0',
  description: 'Main application layout with two-panel tabbed structure',
  apiVersion: '1.0',
  activation: 'eager',
  capabilities: [
    'document:read',
    'selection:read',
    'selection:write',
    'ui:read',
    'ui:write',
    'events:emit',
    'events:subscribe',
    'extensions:define',
    'storage:local',
  ],
  extensionPoints: [
    {
      id: 'app-shell.left-panel',
      description: 'Tabs for the left panel (output views)',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          icon: { type: 'string' },
          component: { type: 'function' },
          priority: { type: 'number' },
        },
        required: ['id', 'label', 'component'],
      },
    },
    {
      id: 'app-shell.right-panel',
      description: 'Tabs for the right panel (editor views)',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          icon: { type: 'string' },
          component: { type: 'function' },
          priority: { type: 'number' },
        },
        required: ['id', 'label', 'component'],
      },
    },
    {
      id: 'app-shell.toolbar',
      description: 'Toolbar items',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          component: { type: 'function' },
          position: { type: 'string', enum: ['left', 'center', 'right'] },
          priority: { type: 'number' },
        },
        required: ['id', 'component'],
      },
    },
  ],
  emits: [
    'app-shell:tab-changed',
    'app-shell:panel-resized',
    'app-shell:layout-changed',
  ],
};
