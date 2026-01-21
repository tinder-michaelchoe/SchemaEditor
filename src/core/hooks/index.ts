/**
 * Core Hooks Index
 * 
 * Re-exports all core hooks for convenient importing.
 */

// Plugin API hooks
export { usePluginAPI, usePluginId, PluginIdContext } from './usePluginAPI';

// Plugin Context hooks
export {
  usePluginContext,
  usePluginContextOptional,
  PluginContextContext,
} from './usePluginContext';

// Extension hooks
export {
  useExtensions,
  useExtensionsWithMetadata,
  useHasExtensionPoint,
  useSortedExtensions,
  useFindExtension,
} from './useExtensions';

// Service hooks
export {
  useService,
  useRequiredService,
  useHasService,
  useServiceWhenAvailable,
  useServices,
} from './useService';
