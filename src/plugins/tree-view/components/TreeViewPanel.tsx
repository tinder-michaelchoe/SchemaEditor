/**
 * TreeViewPanel Component
 * 
 * The main tree view panel that renders the JSON editor.
 * This is a plugin-aware wrapper around the core TreeNode components.
 */

import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { flexCenter } from '@/styles/mixins';
import { usePluginAPI } from '../../../core/hooks/usePluginAPI';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { useSelectionStore } from '../../../core/store/selectionStore';
import { useUIStore } from '../../../core/store/uiStore';
import { TreeNode } from '../../../components/TreeView/TreeNode';
import { Badge } from '../../../components/ui/Badge';
import { Collapsible } from '../../../components/ui/Collapsible';
import type { SchemaContext } from '../../../types/schema';

const EmptyStateWrapper = styled.div`
  ${flexCenter}
  height: 100%;
  color: ${p => p.theme.colors.textSecondary};
`;

const EmptyStateContent = styled.div`
  text-align: center;
`;

const EmptyStateTitle = styled.p`
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
`;

const EmptyStateSubtitle = styled.p`
  font-size: 0.875rem;
`;

const TreeContainer = styled.div`
  height: 100%;
  overflow: auto;
  padding: 1rem;
`;

const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CollapsibleContent = styled.div`
  padding: 0.75rem;
`;

const ErrorBlock = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: ${p => p.theme.colors.error}1a;
  border: 1px solid ${p => p.theme.colors.error};
`;

const ErrorMessage = styled.div`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.error};
`;

/**
 * TreeViewPanel - Main component for the tree view plugin
 * 
 * This component bridges the plugin system with the existing TreeNode
 * components, providing a clean integration point.
 */
export function TreeViewPanel() {
  const api = usePluginAPI();
  const ctx = usePluginContext();
  
  // Access stores directly for now (will be fully plugin-ized later)
  const { schema, data, errors, schemaContext } = useDocumentStore();
  const { selectedPath, editingPath, setSelectedPath, setEditingPath } = useSelectionStore();
  const { expandedPaths, toggleExpanded } = useUIStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Emit events when selection changes
  useEffect(() => {
    if (selectedPath && ctx.hasCapability('events:emit')) {
      ctx.events?.emit?.('tree-view:node-selected', { path: selectedPath });
    }
  }, [selectedPath, ctx]);
  
  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedPath && containerRef.current) {
      const nodeId = `node-${selectedPath}`;
      
      const scrollToElement = (attempts = 0) => {
        const element = document.getElementById(nodeId);
        
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else if (attempts < 5) {
          setTimeout(() => scrollToElement(attempts + 1), 100);
        }
      };
      
      setTimeout(() => scrollToElement(), 100);
    }
  }, [selectedPath]);
  
  // Handle value changes through the plugin API
  const handleValueChange = (path: (string | number)[], value: unknown) => {
    if (!ctx.hasCapability('document:write')) {
      ctx.log.warn('Cannot update value - missing document:write capability');
      return;
    }
    
    const pathStr = path.length === 0 ? '' : path.join('.');
    const success = api.setValueAtPath(pathStr, value);
    
    if (success && ctx.hasCapability('events:emit')) {
      ctx.events?.emit?.('tree-view:value-changed', { path: pathStr, value });
    }
  };
  
  // Handle expansion toggle
  const handleToggleExpand = (path: string) => {
    const wasExpanded = expandedPaths.has(path);
    toggleExpanded(path);
    
    if (ctx.hasCapability('events:emit')) {
      const eventType = wasExpanded ? 'tree-view:node-collapsed' : 'tree-view:node-expanded';
      ctx.events?.emit?.(eventType, { path });
    }
  };
  
  // Render loading/empty state
  if (!schema || !schemaContext) {
    return (
      <EmptyStateWrapper>
        <EmptyStateContent>
          <EmptyStateTitle>No schema loaded</EmptyStateTitle>
          <EmptyStateSubtitle>Load a JSON Schema to start editing</EmptyStateSubtitle>
        </EmptyStateContent>
      </EmptyStateWrapper>
    );
  }
  
  const rootPath: (string | number)[] = [];
  const rootPathStr = 'root';
  const isRootExpanded = expandedPaths.has(rootPathStr);
  const rootErrors = errors.get('/');
  const isRootSelected = selectedPath === rootPathStr;
  const isValid = errors.size === 0;
  
  return (
    <TreeContainer ref={containerRef}>
      <Collapsible
        nodeId="node-root"
        isOpen={isRootExpanded}
        onToggle={() => handleToggleExpand(rootPathStr)}
        onSelect={() => setSelectedPath(rootPathStr)}
        isSelected={isRootSelected}
        title={schema.title || 'Document'}
        subtitle={schema.description}
        badge={
          <BadgeGroup>
            {!isValid && <Badge variant="error">Invalid</Badge>}
            <Badge variant="type">object</Badge>
          </BadgeGroup>
        }
        error={!!rootErrors}
      >
        <CollapsibleContent>
          {rootErrors && (
            <ErrorBlock>
              {rootErrors.map((e, i) => (
                <ErrorMessage key={i}>
                  {e.message}
                </ErrorMessage>
              ))}
            </ErrorBlock>
          )}

          <TreeNode
            value={data}
            onChange={(newValue) => handleValueChange([], newValue)}
            schema={schema}
            context={schemaContext as SchemaContext}
            path={rootPath}
            depth={0}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            selectedPath={selectedPath}
            editingPath={editingPath}
            onSelect={setSelectedPath}
            onEditingChange={setEditingPath}
            errors={errors}
          />
        </CollapsibleContent>
      </Collapsible>
    </TreeContainer>
  );
}

export default TreeViewPanel;
