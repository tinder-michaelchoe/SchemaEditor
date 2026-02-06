import React, { useCallback } from 'react';
import { CanvasView } from './CanvasView';
import { SplitView } from './SplitView';
import { SchemaEditor } from '@/components/SchemaEditor';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';
import { InspectorPanel } from '@/plugins/property-inspector/components/InspectorPanel';
import { useEditorStore } from '@/store/editorStore';

type ViewMode = 'tree' | 'canvas' | 'split';

interface EditorPanelProps {
  defaultViewMode?: ViewMode;
}

/**
 * Combined editor panel with Tree, Canvas, and Split view modes
 * This component manages the view mode state and renders the appropriate view
 */
export function EditorPanel({ defaultViewMode = 'tree' }: EditorPanelProps) {
  const { rightPanelTab, setRightPanelTab } = usePersistentUIStore();
  const { selectedPath } = useEditorStore();

  // Create inspector panel when a component is selected
  const inspectorPanel = selectedPath ? <InspectorPanel /> : null;

  // Map stored tab to view mode
  const viewMode = (rightPanelTab as ViewMode) || defaultViewMode;

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setRightPanelTab(mode);
  }, [setRightPanelTab]);

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        {(['tree', 'canvas', 'split'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => handleViewModeChange(mode)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md
              transition-colors duration-150
              ${viewMode === mode
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }
            `}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'tree' && <SchemaEditor />}

        {viewMode === 'canvas' && <CanvasView inspectorPanel={inspectorPanel} />}

        {viewMode === 'split' && (
          <SplitView
            leftPanel={<SchemaEditor />}
            rightPanel={<CanvasView inspectorPanel={inspectorPanel} />}
            initialSplit={50}
          />
        )}
      </div>
    </div>
  );
}
