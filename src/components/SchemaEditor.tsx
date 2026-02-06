import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useEditor } from '../store/EditorContext';
import { TreeNode } from './TreeView';
import { Badge } from './ui/Badge';
import { Collapsible } from './ui/Collapsible';

/* ── Styled Components ── */

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${p => p.theme.colors.textSecondary};
`;

const EmptyStateInner = styled.div`
  text-align: center;
`;

const EmptyTitle = styled.p`
  font-size: ${p => p.theme.fontSizes.lg};
  margin: 0 0 0.5rem;
`;

const EmptySubtitle = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
  margin: 0;
`;

const ScrollContainer = styled.div`
  height: 100%;
  overflow: auto;
  padding: 1rem;

  /* Allow long text in tree nodes to wrap */
  word-break: break-word;
`;

const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ContentArea = styled.div`
  padding: 0.75rem;
`;

const ErrorBlock = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.lg};
  background: ${p => p.theme.colors.error}1a;
  border: 1px solid ${p => p.theme.colors.error};
`;

const ErrorMessage = styled.div`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.error};
`;

/* ── Component ── */

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
  } = useEditor();

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
      <EmptyState>
        <EmptyStateInner>
          <EmptyTitle>No schema loaded</EmptyTitle>
          <EmptySubtitle>Load a JSON Schema to start editing</EmptySubtitle>
        </EmptyStateInner>
      </EmptyState>
    );
  }

  const rootPath: (string | number)[] = [];
  const rootPathStr = 'root';
  const isRootExpanded = expandedPaths.has(rootPathStr);
  const rootErrors = errors.get('/');
  const isRootSelected = selectedPath === rootPathStr;

  return (
    <ScrollContainer ref={containerRef}>
      <Collapsible
        nodeId="node-root"
        isOpen={isRootExpanded}
        onToggle={() => toggleExpanded(rootPathStr)}
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
        <ContentArea>
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
        </ContentArea>
      </Collapsible>
    </ScrollContainer>
  );
}
