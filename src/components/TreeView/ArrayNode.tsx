import { useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { useEditorStore } from '../../store/editorStore';

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
  const moveArrayItem = useEditorStore((state) => state.moveArrayItem);
  const moveItemBetweenArrays = useEditorStore((state) => state.moveItemBetweenArrays);
  
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
    <div className="space-y-1">
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
          <div className="text-sm text-[var(--text-tertiary)] italic py-2 pl-6">
            Empty array
          </div>
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
                      <span className="flex items-center gap-2">
                        <span>[{index}]</span>
                        {item && typeof item === 'object' && 'type' in item && (
                          <span className="text-[var(--text-tertiary)]">
                            {String((item as Record<string, unknown>).type)}
                          </span>
                        )}
                      </span>
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
                          className="text-[var(--error-color)] hover:text-[var(--error-color)]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )
                    }
                  >
                    <div className="p-3">
                      {itemErrors && (
                        <div className="mb-2 text-xs text-[var(--error-color)]">
                          {itemErrors.map((e, i) => (
                            <div key={i}>{e.message}</div>
                          ))}
                        </div>
                      )}
                      {renderNode({
                        value: item,
                        onChange: (newValue) => handleItemChange(index, newValue),
                        schema: resolvedItemSchema,
                        path: itemPath,
                        depth: depth + 1,
                      })}
                    </div>
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
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddItem}
          className="w-full mt-2 ml-6"
          style={{ width: 'calc(100% - 24px)' }}
        >
          <Plus className="w-3 h-3" />
          Add Item
        </Button>
      )}
      
      {resolved.minItems !== undefined && resolved.maxItems !== undefined && (
        <div className="text-xs text-[var(--text-tertiary)] mt-1 ml-6">
          {resolved.minItems} - {resolved.maxItems} items allowed
        </div>
      )}
    </div>
  );
}

// Helper to parse path string back to array
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

// Separate component for primitive array items
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
    <div
      ref={rowRef}
      id={`node-${itemPathStr}`}
      onClick={onSelect}
      onFocus={() => onEditingChange(itemPathStr)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onEditingChange(null);
        }
      }}
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-all
        border cursor-pointer
        ${isEditing 
          ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30' 
          : isSelected
            ? 'bg-[var(--accent-color)]/5 border-[var(--accent-color)] ring-1 ring-[var(--accent-color)]/20'
            : hasError 
              ? 'bg-[var(--bg-secondary)] border-[var(--error-color)]'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/50'
        }
      `}
    >
      <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">
        [{index}]
      </span>
      <div className="flex-1 min-w-0">
        {itemErrors && (
          <div className="mb-1 text-xs text-[var(--error-color)]">
            {itemErrors.map((e, i) => (
              <div key={i}>{e.message}</div>
            ))}
          </div>
        )}
        {renderNode({
          value: item,
          onChange,
          schema: itemSchema,
          path,
          depth: depth + 1,
        })}
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-[var(--error-color)] hover:text-[var(--error-color)] flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
