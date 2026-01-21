/**
 * TreeViewPanel Component
 * 
 * The main tree view panel that renders the JSON editor.
 * This is a plugin-aware wrapper around the core TreeNode components.
 */

import { useEffect, useRef } from 'react';
import { usePluginAPI } from '../../../core/hooks/usePluginAPI';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { useSelectionStore } from '../../../core/store/selectionStore';
import { useUIStore } from '../../../core/store/uiStore';
import { TreeNode } from '../../../components/TreeView/TreeNode';
import { Badge } from '../../../components/ui/Badge';
import { Collapsible } from '../../../components/ui/Collapsible';
import type { SchemaContext } from '../../../types/schema';

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
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
        <div className="text-center">
          <p className="text-lg mb-2">No schema loaded</p>
          <p className="text-sm">Load a JSON Schema to start editing</p>
        </div>
      </div>
    );
  }
  
  const rootPath: (string | number)[] = [];
  const rootPathStr = 'root';
  const isRootExpanded = expandedPaths.has(rootPathStr);
  const rootErrors = errors.get('/');
  const isRootSelected = selectedPath === rootPathStr;
  const isValid = errors.size === 0;
  
  return (
    <div ref={containerRef} className="h-full overflow-auto p-4">
      <Collapsible
        nodeId="node-root"
        isOpen={isRootExpanded}
        onToggle={() => handleToggleExpand(rootPathStr)}
        onSelect={() => setSelectedPath(rootPathStr)}
        isSelected={isRootSelected}
        title={schema.title || 'Document'}
        subtitle={schema.description}
        badge={
          <div className="flex items-center gap-1">
            {!isValid && <Badge variant="error">Invalid</Badge>}
            <Badge variant="type">object</Badge>
          </div>
        }
        error={!!rootErrors}
      >
        <div className="p-3">
          {rootErrors && (
            <div className="mb-3 p-2 rounded-lg bg-[var(--error-color)]/10 border border-[var(--error-color)]">
              {rootErrors.map((e, i) => (
                <div key={i} className="text-sm text-[var(--error-color)]">
                  {e.message}
                </div>
              ))}
            </div>
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
        </div>
      </Collapsible>
    </div>
  );
}

export default TreeViewPanel;
