import React, { useState, useCallback } from 'react';
import { CanvasView } from './CanvasView';
import { SplitView } from './SplitView';
import { SchemaEditor } from '@/components/SchemaEditor';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';
import { PalettePopover } from '@/plugins/component-palette/components/PalettePopover';
import { useEditorStore } from '@/store/editorStore';
import { stringToPath } from '@/utils/pathUtils';

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
  const { schema, selectedPath, data, addArrayItem } = useEditorStore();
  
  // Map stored tab to view mode
  const viewMode = (rightPanelTab as ViewMode) || defaultViewMode;

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setRightPanelTab(mode);
  }, [setRightPanelTab]);

  // Handle component selection from palette
  const handleComponentSelect = useCallback((component: { type: string; defaultProps: Record<string, unknown> }) => {
    console.log('handleComponentSelect called with:', component);
    console.log('Current selectedPath:', selectedPath);
    
    // Create the new component
    const newComponent = {
      type: component.type,
      ...component.defaultProps,
    };

    // Determine target path for adding the component
    // Based on the CLADS schema, components go in root.children
    let targetPathStr: string;
    
    if (!selectedPath || selectedPath === 'root' || selectedPath === '') {
      // No selection or root selected - add to root.children
      targetPathStr = 'root.children';
    } else if (selectedPath.startsWith('root.children')) {
      // Selected something in the tree - check if it's a container
      if (selectedPath.endsWith('.children')) {
        // Already pointing to a children array
        targetPathStr = selectedPath;
      } else {
        // Selected a specific node - add to its children
        targetPathStr = `${selectedPath}.children`;
      }
    } else {
      // Default to root.children
      targetPathStr = 'root.children';
    }
    
    // Convert string path to array path
    const targetPath = stringToPath(targetPathStr);
    
    console.log('Adding component:', newComponent.type, 'to path:', targetPathStr, targetPath);
    
    addArrayItem(targetPath, newComponent);
  }, [selectedPath, addArrayItem]);

  // Palette popover for canvas views
  const paletteSlot = schema ? (
    <PalettePopover onComponentSelect={handleComponentSelect} />
  ) : null;

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
        
        {viewMode === 'canvas' && <CanvasView paletteSlot={paletteSlot} />}
        
        {viewMode === 'split' && (
          <SplitView
            leftPanel={<SchemaEditor />}
            rightPanel={<CanvasView paletteSlot={paletteSlot} />}
            initialSplit={50}
          />
        )}
      </div>
    </div>
  );
}
