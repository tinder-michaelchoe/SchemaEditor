import type { PluginManifest } from '@/core/types/plugin';

export const manifest: PluginManifest = {
  id: 'output-panel',
  name: 'Output Panel',
  version: '1.0.0',
  description: 'Tabbed panel combining Device Preview and JSON Output',
  apiVersion: '1.0',
  activation: 'lazy',
  activationEvents: ['onSlot:sidebar:left'],
  capabilities: [
    'document:read',
    'selection:read',
    'selection:write',
    'ui:read',
    'events:subscribe',
    'storage:local',
  ],
  subscribes: ['document:changed', 'selection:changed'],
};
