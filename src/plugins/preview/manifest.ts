/**
 * Preview Plugin Manifest
 * 
 * Provides live device preview of CLADS documents using WASM renderer.
 */

import type { PluginManifest } from '../../core/types';

export const manifest: PluginManifest = {
  id: 'preview',
  version: '1.0.0',
  name: 'Device Preview',
  description: 'Live preview of CLADS documents in a device frame',
  
  capabilities: [
    'document:read',      // Read document data
    'ui:slots',           // Render to UI slots
    'ui:theme',           // Access theme info
    'events:subscribe',   // Listen for document changes
    'events:emit',        // Emit preview events
  ],
  
  // Activate on startup for live preview
  activationEvents: ['*'],
  
  slots: [
    {
      slot: 'main:view',
      component: 'PreviewPanel',
      priority: 50, // Lower than tree-view
    },
  ],
  
  // Extension points for custom preview renderers
  extensionPoints: [
    {
      id: 'preview.renderer',
      description: 'Custom preview renderers for different document types',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          component: { type: 'unknown' },
        },
        required: ['id', 'name', 'component'],
      },
    },
  ],
  
  emits: [
    'preview:rendered',
    'preview:error',
    'preview:loading',
  ],
};

export default manifest;
