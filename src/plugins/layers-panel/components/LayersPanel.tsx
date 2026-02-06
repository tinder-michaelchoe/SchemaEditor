import React, { useCallback, useMemo } from 'react';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';
import { LayerTree } from './LayerTree';
import { stringToPath, pathToString } from '@/utils/pathUtils';

export function LayersPanel() {
  const {
    data,
    selectedPath,
    setSelectedPath,
    updateValue,
    moveArrayItem,
    moveItemBetweenArrays,
  } = useEditorStore();

  const {
    layersExpandedPaths,
    setLayersExpandedPaths,
  } = usePersistentUIStore();

  // Get expanded paths as Set for efficient lookup
  const expandedPathsSet = useMemo(() => {
    return new Set(layersExpandedPaths || ['root.children']);
  }, [layersExpandedPaths]);

  // Get root children from data
  const rootChildren = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    const root = (data as Record<string, unknown>).root as Record<string, unknown> | undefined;
    if (!root || typeof root !== 'object') return [];
    return (root.children as Record<string, unknown>[]) || [];
  }, [data]);

  // Handle selection
  const handleSelect = useCallback((path: string) => {
    setSelectedPath(path);
  }, [setSelectedPath]);

  // Handle expand/collapse
  const handleToggleExpand = useCallback((path: string) => {
    const newExpanded = new Set(expandedPathsSet);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setLayersExpandedPaths(Array.from(newExpanded));
  }, [expandedPathsSet, setLayersExpandedPaths]);

  // Handle visibility toggle
  const handleToggleVisibility = useCallback((path: string, visible: boolean) => {
    const pathArray = stringToPath(path);
    updateValue([...pathArray, '_visible'], visible);
  }, [updateValue]);

  // Handle lock toggle
  const handleToggleLock = useCallback((path: string, locked: boolean) => {
    const pathArray = stringToPath(path);
    updateValue([...pathArray, '_locked'], locked);
  }, [updateValue]);

  // Handle rename
  const handleRename = useCallback((path: string, name: string) => {
    const pathArray = stringToPath(path);
    updateValue([...pathArray, '_name'], name);
  }, [updateValue]);

  // Handle reorder via drag and drop
  const handleReorder = useCallback((sourcePath: string, targetPath: string, position: 'before' | 'after' | 'inside') => {
    console.log('🔄 handleReorder:', { sourcePath, targetPath, position });

    // Parse paths to get parent and index
    const sourcePathArray = stringToPath(sourcePath);
    const targetPathArray = stringToPath(targetPath);

    // Get source parent path and index
    const sourceIndex = sourcePathArray[sourcePathArray.length - 1] as number;
    const sourceParentPath = sourcePathArray.slice(0, -1);

    // Get target parent path and index
    const targetIndex = targetPathArray[targetPathArray.length - 1] as number;
    const targetParentPath = targetPathArray.slice(0, -1);

    console.log('📍 Indices:', { sourceIndex, targetIndex });

    // Determine final target path based on position
    let finalTargetParentPath = targetParentPath;
    let finalTargetIndex = targetIndex;

    if (position === 'inside') {
      // Move inside target (target becomes parent)
      finalTargetParentPath = [...targetPathArray, 'children'];
      finalTargetIndex = 0; // Insert at beginning
    } else if (position === 'after') {
      finalTargetIndex = targetIndex + 1;
    }
    // For 'before': finalTargetIndex stays as targetIndex

    // Check if same parent (simple reorder within array)
    const sourceParentStr = pathToString(sourceParentPath);
    const finalTargetParentStr = pathToString(finalTargetParentPath);

    if (sourceParentStr === finalTargetParentStr) {
      // Same parent - reorder within array
      // Note: moveArrayItem in the store already handles the index adjustment
      // when removing and re-inserting, so we pass finalTargetIndex directly

      console.log('➡️ Moving within same array:', { sourceIndex, toIndex: finalTargetIndex });

      if (sourceIndex !== finalTargetIndex) {
        moveArrayItem(sourceParentPath, sourceIndex, finalTargetIndex);
      } else {
        console.log('⏸️ Skipping - source and target are the same');
      }
    } else {
      // Different parents - move between arrays
      console.log('↔️ Moving between arrays:', { sourceIndex, targetIndex: finalTargetIndex });
      moveItemBetweenArrays(sourceParentPath, sourceIndex, finalTargetParentPath, finalTargetIndex);
    }
  }, [moveArrayItem, moveItemBetweenArrays]);

  // Expand all layers
  const handleExpandAll = useCallback(() => {
    const allPaths = new Set<string>(['root.children']);
    
    const collectPaths = (nodes: Record<string, unknown>[], basePath: string) => {
      nodes.forEach((node, index) => {
        const nodePath = `${basePath}[${index}]`;
        const children = node.children as Record<string, unknown>[] | undefined;
        if (children && children.length > 0) {
          allPaths.add(nodePath);
          collectPaths(children, `${nodePath}.children`);
        }
      });
    };
    
    collectPaths(rootChildren, 'root.children');
    setLayersExpandedPaths(Array.from(allPaths));
  }, [rootChildren, setLayersExpandedPaths]);

  // Collapse all layers
  const handleCollapseAll = useCallback(() => {
    setLayersExpandedPaths(['root.children']);
  }, [setLayersExpandedPaths]);

  const hasLayers = rootChildren.length > 0;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Layers</span>
        </div>
        
        {/* Expand/Collapse buttons */}
        {hasLayers && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              title="Expand all"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              title="Collapse all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Layer Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {hasLayers ? (
          <LayerTree
            nodes={rootChildren}
            basePath="root.children"
            selectedPath={selectedPath}
            expandedPaths={expandedPathsSet}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onRename={handleRename}
            onReorder={handleReorder}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Layers className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
            <p className="text-sm text-[var(--text-tertiary)]">
              No layers yet
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Add components to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
