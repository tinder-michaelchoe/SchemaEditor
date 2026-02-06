import React, { useCallback, useMemo } from 'react';
import { Monitor, Code, ChevronDown, ChevronRight, RotateCcw, WrapText } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { DevicePreview } from '@/components/Preview/DevicePreview';
import { RawJSONPreview } from '@/components/Preview/RawJSONPreview';
import { Button } from '@/components/ui/Button';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';

type TabId = 'preview' | 'json';

// Strip editor-only properties from data for display
function stripEditorProperties(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripEditorProperties);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Skip editor-only properties (prefixed with underscore)
    // Examples: _aspectRatioLocked, _pinnedEdges, _bounds
    if (key.startsWith('_')) {
      continue;
    }
    result[key] = stripEditorProperties(value);
  }
  return result;
}

export function OutputPanel() {
  const { leftPanelTab, setLeftPanelTab, isJsonWrapEnabled, setIsJsonWrapEnabled } = usePersistentUIStore();

  // Use persisted tab, default to 'json' if invalid
  const activeTab: TabId = (leftPanelTab === 'preview' || leftPanelTab === 'json')
    ? leftPanelTab
    : 'json';
  
  const {
    data,
    selectedPath,
    editingPath,
    setSelectedPath,
    expandPaths,
    expandAll,
    collapseAll,
    resetData,
  } = useEditorStore();

  // Strip editor-only properties for display in JSON output
  const displayData = useMemo(() => stripEditorProperties(data), [data]);

  const handleTabChange = useCallback((tab: TabId) => {
    setLeftPanelTab(tab);
  }, [setLeftPanelTab]);

  // Handle selection from JSON preview
  const handleSelectFromPreview = useCallback((path: string) => {
    const pathsToExpand: string[] = ['root'];
    
    if (path !== 'root') {
      const regex = /([^.\[\]]+)|\[(\d+)\]/g;
      let match;
      let currentPath = '';
      
      while ((match = regex.exec(path)) !== null) {
        if (match[1] !== undefined) {
          currentPath = currentPath ? `${currentPath}.${match[1]}` : match[1];
        } else if (match[2] !== undefined) {
          currentPath += `[${match[2]}]`;
        }
        pathsToExpand.push(currentPath);
      }
    }
    
    expandPaths(pathsToExpand);
    setSelectedPath(path);
  }, [expandPaths, setSelectedPath]);

  const tabs = [
    { id: 'preview' as const, label: 'Preview', icon: Monitor },
    { id: 'json' as const, label: 'JSON', icon: Code },
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Tab Header - Centered with improved styling */}
      <div className="relative flex items-center justify-center px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        {/* Centered Tab Buttons */}
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md
                  transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right-side buttons - positioned on the right */}
        {activeTab === 'json' && (
          <div className="absolute right-3 flex items-center gap-1">
            {/* Expand/Collapse/Reset buttons - only visible for JSON tab */}
            <Button variant="ghost" size="sm" onClick={expandAll} title="Expand All">
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll} title="Collapse All">
              <ChevronRight className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetData} title="Reset">
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'preview' ? (
          <DevicePreview data={data} className="h-full" />
        ) : (
          <RawJSONPreview
            data={displayData}
            selectedPath={selectedPath}
            editingPath={editingPath}
            onSelectPath={handleSelectFromPreview}
            wrapText={isJsonWrapEnabled}
            className="h-full"
          />
        )}
      </div>

      {/* Bottom Toolbar - only visible for JSON tab */}
      {activeTab === 'json' && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsJsonWrapEnabled(!isJsonWrapEnabled)} 
              title={isJsonWrapEnabled ? 'Disable text wrapping' : 'Enable text wrapping'}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all
                ${isJsonWrapEnabled 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <WrapText className="w-3.5 h-3.5" />
              <span>Wrap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
