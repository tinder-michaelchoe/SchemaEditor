/**
 * Plugin Templates
 * 
 * This directory contains templates for common plugin patterns.
 * Copy and customize these templates to create new plugins.
 * 
 * Available templates:
 * - sidebar-plugin: Adds a panel to the sidebar
 * - view-plugin: Adds a main content view
 * - service-plugin: Provides a service for other plugins
 * - extension-contributor: Contributes to extension points
 * 
 * Usage:
 * 1. Copy the template file to src/plugins/your-plugin-name/
 * 2. Rename to index.ts
 * 3. Update the manifest (id, name, description, capabilities)
 * 4. Implement your plugin logic
 * 5. Register in the plugin registry
 */

// Re-export templates for programmatic access
export { default as sidebarPluginTemplate } from './sidebar-plugin.template';
export { default as viewPluginTemplate } from './view-plugin.template';
export { default as servicePluginTemplate } from './service-plugin.template';
export { default as extensionContributorTemplate } from './extension-contributor.template';

/**
 * Helper to create a new plugin from a template
 * 
 * @example
 * ```typescript
 * import { createFromTemplate } from '@/plugins/templates';
 * 
 * const myPlugin = createFromTemplate('sidebar', {
 *   id: 'my-plugin',
 *   name: 'My Plugin',
 *   description: 'Does something cool',
 * });
 * ```
 */
export type TemplateType = 'sidebar' | 'view' | 'service' | 'extension-contributor';

export interface TemplateOptions {
  id: string;
  name: string;
  description: string;
}

/**
 * Get template information
 */
export function getTemplateInfo(type: TemplateType): {
  name: string;
  description: string;
  capabilities: string[];
  hasUI: boolean;
} {
  switch (type) {
    case 'sidebar':
      return {
        name: 'Sidebar Plugin',
        description: 'Adds a panel to the left or right sidebar',
        capabilities: ['document:read', 'selection:read', 'ui:slots', 'ui:theme'],
        hasUI: true,
      };
    case 'view':
      return {
        name: 'View Plugin',
        description: 'Adds a main content view or preview panel',
        capabilities: ['document:read', 'document:write', 'selection:read', 'selection:write', 'ui:slots', 'events:subscribe'],
        hasUI: true,
      };
    case 'service':
      return {
        name: 'Service Plugin',
        description: 'Provides a service for other plugins to consume',
        capabilities: ['services:provide'],
        hasUI: false,
      };
    case 'extension-contributor':
      return {
        name: 'Extension Contributor',
        description: 'Contributes to extension points defined by other plugins',
        capabilities: ['extensions:contribute'],
        hasUI: false,
      };
  }
}

/**
 * Get all available template types
 */
export function getAvailableTemplates(): TemplateType[] {
  return ['sidebar', 'view', 'service', 'extension-contributor'];
}
