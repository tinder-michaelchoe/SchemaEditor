import { useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styled, { css } from 'styled-components';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Collapsible } from '../ui/Collapsible';
import type { JSONSchema, SchemaContext } from '../../types/schema';
import { resolveSchema, getSchemaLabel } from '../../utils/schemaUtils';
import { generateDefaultValue } from '../../utils/defaultValue';
import { pathToString } from '../../utils/pathUtils';
import { DraggableArrayItem } from './DraggableArrayItem';
import { ChildrenDropIndicator } from './ChildrenDropIndicator';
import type { DragItemData } from './DraggableArrayItem';
import { useEditorActions } from '../../store/EditorContext';

/* ------------------------------------------------------------------ */
/*  Styled components                                                  */
/* ------------------------------------------------------------------ */

const SpacedContainer = styled.div`
  & > * + * {
    margin-top: 0.25rem;
  }
`;

const EmptyMessage = styled.div`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textTertiary};
  font-style: italic;
  padding: 0.5rem 0;
  padding-left: 1.5rem;
`;

const ItemCountHint = styled.div`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  margin-top: 0.25rem;
  margin-left: 1.5rem;
`;

const AddButtonWrapper = styled.div`
  width: calc(100% - 24px);
  margin-top: 0.5rem;
  margin-left: 1.5rem;
`;

const ItemTypeLabel = styled.span`
  color: ${p => p.theme.colors.textTertiary};
`;

const TitleSpan = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CollapsibleContent = styled.div`
  padding: 0.75rem;
`;

const ErrorBlock = styled.div<{ $marginBottom?: string }>`
  margin-bottom: ${p => p.$marginBottom ?? '0.5rem'};
  font-size: 0.75rem;
  color: ${p => p.theme.colors.error};
`;

const DeleteIcon = styled(Trash2)`
  color: ${p => p.theme.colors.error};
`;

/* -- ArrayPrimitiveRow styled components ----------------------------- */

const PrimitiveRowWrapper = styled.div<{
  $isEditing: boolean;
  $isSelected: boolean;
  $hasError: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.lg};
  transition: all 0.15s;
  border: 1px solid;
  cursor: pointer;

  ${p =>
    p.$isEditing
      ? css`
          background: ${p.theme.colors.accent}1a;
          border-color: ${p.theme.colors.accent};
          box-shadow: 0 0 0 2px ${p.theme.colors.accent}4d;
        `
      : p.$isSelected
        ? css`
            background: ${p.theme.colors.accent}0d;
            border-color: ${p.theme.colors.accent};
            box-shadow: 0 0 0 1px ${p.theme.colors.accent}33;
          `
        : p.$hasError
          ? css`
              background: ${p.theme.colors.bgSecondary};
              border-color: ${p.theme.colors.error};
            `
          : css`
              background: ${p.theme.colors.bgSecondary};
              border-color: ${p.theme.colors.border};
              &:hover {
                border-color: ${p.theme.colors.accent}80;
              }
            `}
`;

const IndexLabel = styled.span`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textSecondary};
  flex-shrink: 0;
`;

const FlexContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const DeleteButtonShrink = styled.div`
  flex-shrink: 0;
`;

/* ------------------------------------------------------------------ */
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */

interface ArrayNodeProps {
  value: unknown[];
  onChange: (value: unknown[]) => void;
  schema: JSONSchema;
  context: SchemaContext;
  path: (string | number)[];
  depth: number;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  selectedPath: string | null;
  editingPath: string | null;
  onSelect: (path: string) => void;
  onEditingChange: (path: string | null) => void;
  errors: Map<string, { message: string }[]>;
  renderNode: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    schema: JSONSchema;
    path: (string | number)[];
    depth: number;
  }) => React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  ArrayNode                                                          */
/* ------------------------------------------------------------------ */

export function ArrayNode({
  value,
  onChange,
  schema,
  context,
  path,
  depth,
  expandedPaths,
  onToggleExpand,
  selectedPath,
  editingPath,
  onSelect,
  onEditingChange,
  errors,
  renderNode,
}: ArrayNodeProps) {
  const resolved = resolveSchema(schema, context);
  const items = Array.isArray(value) ? value : [];

  // Check if this is a "children" array (enables drag-drop)
  const lastPathSegment = path[path.length - 1];
  const isChildrenArray = lastPathSegment === 'children';
  const arrayPathStr = pathToString(path);

  // Get store actions for drag-drop
  const { moveArrayItem, moveItemBetweenArrays } = useEditorActions();

  // Get item schema
  const itemSchema = resolved.items && !Array.isArray(resolved.items)
    ? resolved.items
    : {};

  const resolvedItemSchema = resolveSchema(itemSchema, context);

  const handleAddItem = () => {
    const newItem = generateDefaultValue(resolvedItemSchema, context);
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleItemChange = (index: number, newValue: unknown) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  // Handle drop for reordering
  const handleDrop = useCallback((sourceData: DragItemData, targetIndex: number) => {
    const { sourcePath, sourceIndex } = sourceData;

    if (sourcePath === arrayPathStr) {
      // Same array - reorder
      moveArrayItem(path, sourceIndex, targetIndex);
    } else {
      // Different array - move between arrays
      // Parse source path to array format
      const sourcePathArray = parsePathString(sourcePath);
      moveItemBetweenArrays(sourcePathArray, sourceIndex, path, targetIndex);
    }
  }, [arrayPathStr, path, moveArrayItem, moveItemBetweenArrays]);

  // Validate if a drop is allowed
  const isValidDrop = useCallback((sourceData: DragItemData): boolean => {
    const { sourcePath, sourceIndex } = sourceData;

    // Can't drop an item into its own descendants
    // e.g., can't drop root.children[0] into root.children[0].children
    const sourceItemPath = `${sourcePath}[${sourceIndex}]`;
    if (arrayPathStr.startsWith(sourceItemPath)) {
      return false;
    }

    // Check schema constraints for cross-array moves
    if (sourcePath !== arrayPathStr) {
      // Check maxItems constraint on target
      if (resolved.maxItems !== undefined && items.length >= resolved.maxItems) {
        return false;
      }
    }

    return true;
  }, [arrayPathStr, items.length, resolved.maxItems]);

  const canAddMore = resolved.maxItems === undefined || items.length < resolved.maxItems;
  const canRemove = resolved.minItems === undefined || items.length > resolved.minItems;

  // Get item type label for drag preview
  const getItemTypeLabel = (item: unknown): string => {
    if (item && typeof item === 'object' && 'type' in item) {
      return String((item as Record<string, unknown>).type);
    }
    return getSchemaLabel(resolvedItemSchema, context);
  };

  return (
    <SpacedContainer>
      {items.length === 0 ? (
        <>
          {isChildrenArray && (
            <ChildrenDropIndicator
              targetArrayPath={arrayPathStr}
              targetIndex={0}
              onDrop={handleDrop}
              isValidDrop={isValidDrop}
            />
          )}
          <EmptyMessage>
            Empty array
          </EmptyMessage>
        </>
      ) : (
        items.map((item, index) => {
          const itemPath = [...path, index];
          const itemPathStr = pathToString(itemPath);
          const isExpanded = expandedPaths.has(itemPathStr);
          const itemErrors = errors.get(`/${itemPath.join('/')}`);
          const hasError = !!itemErrors;
          const isSelected = selectedPath === itemPathStr;
          const isEditing = editingPath === itemPathStr;

          // Check if item is a primitive or complex type
          const itemType = typeof item;
          const isComplex = itemType === 'object' && item !== null;
          const itemTypeLabel = getItemTypeLabel(item);

          // Wrap content in draggable if this is a children array
          const wrapInDraggable = (content: React.ReactNode) => {
            if (!isChildrenArray) return content;

            return (
              <DraggableArrayItem
                arrayPath={arrayPathStr}
                index={index}
                itemType={itemTypeLabel}
              >
                {content}
              </DraggableArrayItem>
            );
          };

          if (isComplex) {
            return (
              <div key={index}>
                {/* Drop indicator before this item */}
                {isChildrenArray && (
                  <ChildrenDropIndicator
                    targetArrayPath={arrayPathStr}
                    targetIndex={index}
                    onDrop={handleDrop}
                    isValidDrop={isValidDrop}
                  />
                )}

                {wrapInDraggable(
                  <Collapsible
                    nodeId={`node-${itemPathStr}`}
                    isOpen={isExpanded}
                    onToggle={() => onToggleExpand(itemPathStr)}
                    onSelect={() => onSelect(itemPathStr)}
                    isSelected={isSelected}
                    title={
                      <TitleSpan>
                        <span>[{index}]</span>
                        {item && typeof item === 'object' && 'type' in item && (
                          <ItemTypeLabel>
                            {String((item as Record<string, unknown>).type)}
                          </ItemTypeLabel>
                        )}
                      </TitleSpan>
                    }
                    badge={
                      <Badge variant="type">
                        {getSchemaLabel(resolvedItemSchema, context)}
                      </Badge>
                    }
                    error={hasError}
                    actions={
                      canRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon size={12} />
                        </Button>
                      )
                    }
                  >
                    <CollapsibleContent>
                      {itemErrors && (
                        <ErrorBlock>
                          {itemErrors.map((e, i) => (
                            <div key={i}>{e.message}</div>
                          ))}
                        </ErrorBlock>
                      )}
                      {renderNode({
                        value: item,
                        onChange: (newValue) => handleItemChange(index, newValue),
                        schema: resolvedItemSchema,
                        path: itemPath,
                        depth: depth + 1,
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Drop indicator after last item */}
                {isChildrenArray && index === items.length - 1 && (
                  <ChildrenDropIndicator
                    targetArrayPath={arrayPathStr}
                    targetIndex={items.length}
                    onDrop={handleDrop}
                    isValidDrop={isValidDrop}
                  />
                )}
              </div>
            );
          }

          // Render inline for primitives
          return (
            <div key={index}>
              {/* Drop indicator before this item */}
              {isChildrenArray && (
                <ChildrenDropIndicator
                  targetArrayPath={arrayPathStr}
                  targetIndex={index}
                  onDrop={handleDrop}
                  isValidDrop={isValidDrop}
                />
              )}

              {wrapInDraggable(
                <ArrayPrimitiveRow
                  index={index}
                  itemPathStr={itemPathStr}
                  item={item}
                  itemSchema={resolvedItemSchema}
                  hasError={hasError}
                  itemErrors={itemErrors}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  canRemove={canRemove}
                  onSelect={() => onSelect(itemPathStr)}
                  onEditingChange={onEditingChange}
                  onChange={(newValue) => handleItemChange(index, newValue)}
                  onRemove={() => handleRemoveItem(index)}
                  renderNode={renderNode}
                  path={itemPath}
                  depth={depth}
                />
              )}

              {/* Drop indicator after last item */}
              {isChildrenArray && index === items.length - 1 && (
                <ChildrenDropIndicator
                  targetArrayPath={arrayPathStr}
                  targetIndex={items.length}
                  onDrop={handleDrop}
                  isValidDrop={isValidDrop}
                />
              )}
            </div>
          );
        })
      )}

      {canAddMore && (
        <AddButtonWrapper>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            style={{ width: '100%' }}
          >
            <Plus size={12} />
            Add Item
          </Button>
        </AddButtonWrapper>
      )}

      {resolved.minItems !== undefined && resolved.maxItems !== undefined && (
        <ItemCountHint>
          {resolved.minItems} - {resolved.maxItems} items allowed
        </ItemCountHint>
      )}
    </SpacedContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper to parse path string back to array                          */
/* ------------------------------------------------------------------ */

function parsePathString(pathStr: string): (string | number)[] {
  const result: (string | number)[] = [];
  const parts = pathStr.split('.');

  for (const part of parts) {
    // Check for array notation like "children[0]"
    const match = part.match(/^(.+?)\[(\d+)\]$/);
    if (match) {
      result.push(match[1]);
      result.push(parseInt(match[2], 10));
    } else if (/^\d+$/.test(part)) {
      result.push(parseInt(part, 10));
    } else {
      result.push(part);
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  ArrayPrimitiveRow                                                  */
/* ------------------------------------------------------------------ */

interface ArrayPrimitiveRowProps {
  index: number;
  itemPathStr: string;
  item: unknown;
  itemSchema: JSONSchema;
  hasError: boolean;
  itemErrors?: { message: string }[];
  isSelected: boolean;
  isEditing: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onEditingChange: (path: string | null) => void;
  onChange: (value: unknown) => void;
  onRemove: () => void;
  renderNode: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    schema: JSONSchema;
    path: (string | number)[];
    depth: number;
  }) => React.ReactNode;
  path: (string | number)[];
  depth: number;
}

function ArrayPrimitiveRow({
  index,
  itemPathStr,
  item,
  itemSchema,
  hasError,
  itemErrors,
  isSelected,
  isEditing,
  canRemove,
  onSelect,
  onEditingChange,
  onChange,
  onRemove,
  renderNode,
  path,
  depth,
}: ArrayPrimitiveRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isSelected || isEditing) && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected, isEditing]);

  return (
    <PrimitiveRowWrapper
      ref={rowRef}
      id={`node-${itemPathStr}`}
      onClick={onSelect}
      onFocus={() => onEditingChange(itemPathStr)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onEditingChange(null);
        }
      }}
      $isEditing={isEditing}
      $isSelected={isSelected}
      $hasError={hasError}
    >
      <IndexLabel>
        [{index}]
      </IndexLabel>
      <FlexContent>
        {itemErrors && (
          <ErrorBlock $marginBottom="0.25rem">
            {itemErrors.map((e, i) => (
              <div key={i}>{e.message}</div>
            ))}
          </ErrorBlock>
        )}
        {renderNode({
          value: item,
          onChange,
          schema: itemSchema,
          path,
          depth: depth + 1,
        })}
      </FlexContent>
      {canRemove && (
        <DeleteButtonShrink>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
          >
            <DeleteIcon size={12} />
          </Button>
        </DeleteButtonShrink>
      )}
    </PrimitiveRowWrapper>
  );
}
