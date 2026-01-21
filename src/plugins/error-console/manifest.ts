/**
 * Error Console Plugin Manifest
 * 
 * Provides a console panel for displaying validation errors.
 */

import type { PluginManifest } from '../../core/types';

export const manifest: PluginManifest = {
  id: 'error-console',
  version: '1.0.0',
  name: 'Error Console',
  description: 'Displays validation errors with line numbers and JSON paths',
  
  capabilities: [
    'document:read',      // Read document data and errors
    'selection:write',    // Navigate to error locations
    'ui:slots',           // Render to UI slots
    'ui:theme',           // Access theme info
    'events:subscribe',   // Listen for validation events
    'events:emit',        // Emit navigation events
  ],
  
  // Activate when validation errors occur
  activationEvents: ['onEvent:validation:complete'],
  
  slots: [
    {
      slot: 'panel:bottom',
      component: 'ErrorConsolePanel',
      priority: 100,
    },
  ],
  
  emits: [
    'error-console:navigate-to-error',
    'error-console:error-selected',
  ],
};

export default manifest;
