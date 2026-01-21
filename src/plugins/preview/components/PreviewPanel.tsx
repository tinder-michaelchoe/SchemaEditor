/**
 * Preview Panel Component
 * 
 * Plugin wrapper around the DevicePreview component.
 */

import React from 'react';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { DevicePreview } from '../../../components/Preview/DevicePreview';

export function PreviewPanel() {
  const ctx = usePluginContext();
  const { data } = useDocumentStore();
  
  // Log preview renders (useful for debugging)
  React.useEffect(() => {
    ctx.log.debug('Preview panel rendered with data update');
  }, [data, ctx]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Device Preview</h3>
      </div>
      <div className="flex-1 overflow-hidden">
        <DevicePreview data={data} className="h-full" />
      </div>
    </div>
  );
}

export default PreviewPanel;
