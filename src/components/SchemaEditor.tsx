import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { TreeNode } from './TreeView';
import { Badge } from './ui/Badge';
import { Collapsible } from './ui/Collapsible';

export function SchemaEditor() {
  const {
    schema,
    schemaContext,
    data,
    errors,
    isValid,
    expandedPaths,
    selectedPath,
    editingPath,
    updateValue,
    toggleExpanded,
    setSelectedPath,
    setEditingPath,
  } = useEditorStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to selected item when selection changes
  useEffect(() => {
    if (selectedPath && containerRef.current) {
      const nodeId = `node-${selectedPath}`;
      
      // Try to scroll to element, with retries for newly expanded content
      const scrollToElement = (attempts: number = 0) => {
        const element = document.getElementById(nodeId);
        
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else if (attempts < 5) {
          // Retry after a delay - nodes may still be rendering after expansion
          setTimeout(() => scrollToElement(attempts + 1), 100);
        }
      };
      
      // Initial delay to allow React to render expanded nodes
      setTimeout(() => scrollToElement(), 100);
    }
  }, [selectedPath]);

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

  return (
    <div ref={containerRef} className="h-full overflow-auto p-4 tree-wrap-text">
      <Collapsible
        nodeId="node-root"
        isOpen={isRootExpanded}
        onToggle={() => toggleExpanded(rootPathStr)}
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
            onChange={(newValue) => updateValue([], newValue)}
            schema={schema}
            context={schemaContext}
            path={rootPath}
            depth={0}
            expandedPaths={expandedPaths}
            onToggleExpand={toggleExpanded}
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
