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

// Container types that can have children
const CONTAINER_TYPES = ['vstack', 'hstack', 'zstack', 'sectionLayout', 'forEach'];

// Component to render a single node (used for header/footer in sections)
function SingleNodeRenderer({
  node,
  nodePath,
  depth,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onReorder,
}: {
  node: Record<string, unknown>;
  nodePath: string;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onToggleVisibility: (path: string, visible: boolean) => void;
  onToggleLock: (path: string, locked: boolean) => void;
  onRename: (path: string, name: string) => void;
  onReorder: (sourcePath: string, targetPath: string, position: 'before' | 'after' | 'inside') => void;
}) {
  const nodeType = (node.type as string) || 'unknown';
  const isContainer = CONTAINER_TYPES.includes(nodeType);
  const children = (node.children as Record<string, unknown>[]) || [];
  const hasChildren = isContainer && children.length > 0;
  const isExpanded = expandedPaths.has(nodePath);
  const isSelected = selectedPath === nodePath;

  return (
    <div>
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
        onReorder={onReorder}
      />
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
    </div>
  );
}

// Component to render sections within a sectionLayout
function SectionList({
  sections,
  basePath,
  depth,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onReorder,
}: Omit<LayerTreeProps, 'nodes'> & { sections: Record<string, unknown>[] }) {
  return (
    <div className="section-list">
      {sections.map((section, sectionIndex) => {
        const sectionPath = `${basePath}[${sectionIndex}]`;
        const sectionId = (section.id as string) || `Section ${sectionIndex + 1}`;
        const header = section.header as Record<string, unknown> | undefined;
        const footer = section.footer as Record<string, unknown> | undefined;
        const children = (section.children as Record<string, unknown>[]) || [];
        const hasContent = !!header || children.length > 0 || !!footer;
        const isExpanded = expandedPaths.has(sectionPath);
        const isSelected = selectedPath === sectionPath;

        // Create a pseudo-node for the section to display in LayerItem
        const sectionNode = {
          type: 'section',
          _name: sectionId,
          id: section.id,
        };

        return (
          <div key={sectionPath} className="group">
            <LayerItem
              node={sectionNode}
              path={sectionPath}
              depth={depth}
              isSelected={isSelected}
              isExpanded={isExpanded}
              hasChildren={hasContent}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onRename={onRename}
              onReorder={onReorder}
            />

            {/* Render section content if expanded */}
            {isExpanded && hasContent && (
              <div className="section-content">
                {/* Render header if present */}
                {header && (
                  <SingleNodeRenderer
                    node={{ ...header, _name: 'Header' }}
                    nodePath={`${sectionPath}.header`}
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

                {/* Render children if present */}
                {children.length > 0 && (
                  <LayerTree
                    nodes={children}
                    basePath={`${sectionPath}.children`}
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

                {/* Render footer if present */}
                {footer && (
                  <SingleNodeRenderer
                    node={{ ...footer, _name: 'Footer' }}
                    nodePath={`${sectionPath}.footer`}
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  return (
    <div className="layer-tree">
      {nodes.map((node, index) => {
        const nodePath = `${basePath}[${index}]`;
        const nodeType = (node.type as string) || 'unknown';
        const isContainer = CONTAINER_TYPES.includes(nodeType);
        const isSectionLayout = nodeType === 'sectionLayout';
        const children = (node.children as Record<string, unknown>[]) || [];
        const sections = (node.sections as Record<string, unknown>[]) || [];

        // sectionLayout has sections, other containers have children
        const hasChildren = isSectionLayout ? sections.length > 0 : (isContainer && children.length > 0);
        const isExpanded = expandedPaths.has(nodePath);
        const isSelected = selectedPath === nodePath;

        return (
          <div key={nodePath} className="group">
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
              onReorder={onReorder}
            />

            {/* Render sections for sectionLayout */}
            {isSectionLayout && isExpanded && sections.length > 0 && (
              <SectionList
                sections={sections}
                basePath={`${nodePath}.sections`}
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

            {/* Render children recursively if expanded (for other container types) */}
            {!isSectionLayout && hasChildren && isExpanded && (
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
          </div>
        );
      })}
    </div>
  );
}
