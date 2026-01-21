import React, { useCallback, useState } from 'react';
import { LayerItem } from './LayerItem';

interface LayerTreeProps {
  nodes: Record<string, unknown>[];
  basePath: string;
  depth?: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onToggleVisibility: (path: string, visible: boolean) => void;
  onToggleLock: (path: string, locked: boolean) => void;
  onRename: (path: string, name: string) => void;
  onReorder: (sourcePath: string, targetPath: string, position: 'before' | 'after' | 'inside') => void;
}

// Drop indicator component
function DropIndicator({ depth, isActive }: { depth: number; isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <div 
      className="h-0.5 bg-[var(--accent-color)] rounded-full mx-1 my-0.5"
      style={{ marginLeft: `${depth * 16 + 8}px` }}
    />
  );
}

// Container types that can have children
const CONTAINER_TYPES = ['vstack', 'hstack', 'zstack', 'sectionLayout', 'forEach'];

export function LayerTree({
  nodes,
  basePath,
  depth = 0,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onReorder,
}: LayerTreeProps) {
  // Track drop indicator position
  const [dropIndicator, setDropIndicator] = useState<{ index: number; position: 'before' | 'after' } | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, path: string) => {
    e.dataTransfer.setData('text/plain', path);
    e.dataTransfer.setData('application/x-layer-path', path);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drag over - show drop indicator
  const handleDragOver = useCallback((e: React.DragEvent, targetPath: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // Determine drop position based on mouse position within the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    const position = y < height / 2 ? 'before' : 'after';
    setDropIndicator({ index, position });
  }, []);

  // Handle drag leave - hide drop indicator
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the tree
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropIndicator(null);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicator(null);
    
    const sourcePath = e.dataTransfer.getData('application/x-layer-path') || e.dataTransfer.getData('text/plain');
    
    if (sourcePath && sourcePath !== targetPath) {
      // Determine drop position based on mouse position within the element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      
      const position = y < height / 2 ? 'before' : 'after';
      onReorder(sourcePath, targetPath, position);
    }
  }, [onReorder]);

  // Clear drop indicator when drag ends
  const handleDragEnd = useCallback(() => {
    setDropIndicator(null);
  }, []);

  return (
    <div className="layer-tree" onDragLeave={handleDragLeave}>
      {nodes.map((node, index) => {
        const nodePath = `${basePath}[${index}]`;
        const nodeType = (node.type as string) || 'unknown';
        const isContainer = CONTAINER_TYPES.includes(nodeType);
        const children = (node.children as Record<string, unknown>[]) || [];
        const hasChildren = isContainer && children.length > 0;
        const isExpanded = expandedPaths.has(nodePath);
        const isSelected = selectedPath === nodePath;

        return (
          <div key={nodePath} className="group">
            {/* Drop indicator before */}
            <DropIndicator 
              depth={depth} 
              isActive={dropIndicator?.index === index && dropIndicator?.position === 'before'} 
            />
            
            <LayerItem
              node={node}
              path={nodePath}
              depth={depth}
              isSelected={isSelected}
              isExpanded={isExpanded}
              hasChildren={hasChildren}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onRename={onRename}
              onDragStart={handleDragStart}
              onDragOver={(e, path) => handleDragOver(e, path, index)}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
            
            {/* Render children recursively if expanded */}
            {hasChildren && isExpanded && (
              <LayerTree
                nodes={children}
                basePath={`${nodePath}.children`}
                depth={depth + 1}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onToggleVisibility={onToggleVisibility}
                onToggleLock={onToggleLock}
                onRename={onRename}
                onReorder={onReorder}
              />
            )}
            
            {/* Drop indicator after (only for last item) */}
            {index === nodes.length - 1 && (
              <DropIndicator 
                depth={depth} 
                isActive={dropIndicator?.index === index && dropIndicator?.position === 'after'} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
