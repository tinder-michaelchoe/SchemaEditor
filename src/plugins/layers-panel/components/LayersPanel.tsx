import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';
import { LayerTree } from './LayerTree';
import { stringToPath, pathToString } from '@/utils/pathUtils';

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.colors.bgSecondary};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${p => p.theme.colors.textSecondary};
`;

const HeaderTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const HeaderIconButton = styled.button`
  padding: 0.25rem;
  border-radius: ${p => p.theme.radii.sm};
  color: ${p => p.theme.colors.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
  }
`;

const TreeContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 1rem;
  color: ${p => p.theme.colors.textTertiary};
`;

const EmptyTitle = styled.p`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textTertiary};
`;

const EmptySubtitle = styled.p`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  margin-top: 0.25rem;
`;

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
    <PanelContainer>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <Layers size={16} />
          <HeaderTitle>Layers</HeaderTitle>
        </HeaderLeft>

        {/* Expand/Collapse buttons */}
        {hasLayers && (
          <HeaderButtons>
            <HeaderIconButton onClick={handleExpandAll} title="Expand all">
              <ChevronDown size={14} />
            </HeaderIconButton>
            <HeaderIconButton onClick={handleCollapseAll} title="Collapse all">
              <ChevronRight size={14} />
            </HeaderIconButton>
          </HeaderButtons>
        )}
      </Header>

      {/* Layer Tree */}
      <TreeContainer>
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
          <EmptyState>
            <Layers size={32} style={{ marginBottom: '0.5rem' }} />
            <EmptyTitle>No layers yet</EmptyTitle>
            <EmptySubtitle>Add components to see them here</EmptySubtitle>
          </EmptyState>
        )}
      </TreeContainer>
    </PanelContainer>
  );
}
