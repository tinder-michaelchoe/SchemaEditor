import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Collapsible } from '../ui/Collapsible';
import type { JSONSchema, SchemaContext } from '../../types/schema';
import { 
  resolveSchema, 
  getSchemaLabel, 
  isPropertyRequired,
  allowsAdditionalProperties,
  getAdditionalPropertiesSchema,
} from '../../utils/schemaUtils';
import { generateDefaultValue } from '../../utils/defaultValue';
import { pathToString } from '../../utils/pathUtils';

interface ObjectNodeProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
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

export function ObjectNode({
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
}: ObjectNodeProps) {
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  
  const resolved = resolveSchema(schema, context);
  const obj = typeof value === 'object' && value !== null && !Array.isArray(value) 
    ? value 
    : {};
  
  const definedProperties = Object.keys(resolved.properties || {});
  const existingKeys = Object.keys(obj);
  
  // Additional properties (not in schema)
  const additionalKeys = existingKeys.filter(k => !definedProperties.includes(k));
  
  const canAddAdditional = allowsAdditionalProperties(resolved, context);
  const additionalPropsSchema = getAdditionalPropertiesSchema(resolved, context);

  const handlePropertyChange = (key: string, newValue: unknown) => {
    onChange({ ...obj, [key]: newValue });
  };

  const handleRemoveProperty = (key: string) => {
    const { [key]: _, ...rest } = obj;
    onChange(rest);
  };

  const handleAddProperty = () => {
    if (!newPropertyKey.trim() || existingKeys.includes(newPropertyKey)) {
      return;
    }
    
    const newValue = additionalPropsSchema 
      ? generateDefaultValue(additionalPropsSchema, context)
      : null;
    
    onChange({ ...obj, [newPropertyKey]: newValue });
    setNewPropertyKey('');
    setIsAddingProperty(false);
  };

  const renderProperty = (
    key: string,
    propSchema: JSONSchema,
    isRequired: boolean,
    isAdditional: boolean = false
  ) => {
    const propPath = [...path, key];
    const propPathStr = pathToString(propPath);
    const isExpanded = expandedPaths.has(propPathStr);
    const propErrors = errors.get(`/${propPath.join('/')}`);
    const hasError = !!propErrors;
    const propValue = obj[key];
    const isSelected = selectedPath === propPathStr;
    const isEditing = editingPath === propPathStr;
    
    const resolvedPropSchema = resolveSchema(propSchema, context);
    const propTypes = resolvedPropSchema.type 
      ? (Array.isArray(resolvedPropSchema.type) ? resolvedPropSchema.type : [resolvedPropSchema.type])
      : [];
    
    // Check if property is a complex type
    const isComplex = propTypes.includes('object') || propTypes.includes('array') ||
      resolvedPropSchema.oneOf || resolvedPropSchema.anyOf || resolvedPropSchema.allOf;

    if (isComplex) {
      return (
        <Collapsible
          key={key}
          nodeId={`node-${propPathStr}`}
          isOpen={isExpanded}
          onToggle={() => onToggleExpand(propPathStr)}
          onSelect={() => onSelect(propPathStr)}
          isSelected={isSelected}
          title={key}
          subtitle={resolvedPropSchema.description}
          badge={
            <div className="flex items-center gap-1">
              {isRequired && <Badge variant="required">required</Badge>}
              <Badge variant="type">{getSchemaLabel(resolvedPropSchema, context)}</Badge>
            </div>
          }
          error={hasError}
          actions={
            isAdditional && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveProperty(key)}
                className="text-[var(--error-color)] hover:text-[var(--error-color)]"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )
          }
        >
          <div className="p-3">
            {propErrors && (
              <div className="mb-2 text-xs text-[var(--error-color)]">
                {propErrors.map((e, i) => (
                  <div key={i}>{e.message}</div>
                ))}
              </div>
            )}
            {renderNode({
              value: propValue,
              onChange: (newValue) => handlePropertyChange(key, newValue),
              schema: resolvedPropSchema,
              path: propPath,
              depth: depth + 1,
            })}
          </div>
        </Collapsible>
      );
    }

    // Render inline for primitives
    return (
      <PrimitiveRow
        key={key}
        propKey={key}
        propPathStr={propPathStr}
        propValue={propValue}
        propSchema={resolvedPropSchema}
        isRequired={isRequired}
        isAdditional={isAdditional}
        hasError={hasError}
        propErrors={propErrors}
        isSelected={isSelected}
        isEditing={isEditing}
        onSelect={() => onSelect(propPathStr)}
        onEditingChange={onEditingChange}
        onChange={(newValue) => handlePropertyChange(key, newValue)}
        onRemove={() => handleRemoveProperty(key)}
        renderNode={renderNode}
        path={propPath}
        depth={depth}
      />
    );
  };

  return (
    <div className="space-y-1">
      {/* Defined properties */}
      {definedProperties.map((key) => {
        const propSchema = resolved.properties![key];
        const isRequired = isPropertyRequired(resolved, key, context);
        return renderProperty(key, propSchema, isRequired, false);
      })}
      
      {/* Additional properties */}
      {additionalKeys.length > 0 && (
        <>
          {additionalKeys.length > 0 && definedProperties.length > 0 && (
            <div className="text-xs text-[var(--text-tertiary)] mt-2 mb-1">
              Additional Properties
            </div>
          )}
          {additionalKeys.map((key) => 
            renderProperty(key, additionalPropsSchema || {}, false, true)
          )}
        </>
      )}
      
      {/* Add property button */}
      {canAddAdditional && (
        <div className="mt-2">
          {isAddingProperty ? (
            <div className="flex items-center gap-2">
              <Input
                value={newPropertyKey}
                onChange={(e) => setNewPropertyKey(e.target.value)}
                placeholder="Property name..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProperty();
                  if (e.key === 'Escape') {
                    setIsAddingProperty(false);
                    setNewPropertyKey('');
                  }
                }}
              />
              <Button variant="primary" size="sm" onClick={handleAddProperty}>
                Add
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsAddingProperty(false);
                  setNewPropertyKey('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingProperty(true)}
              className="w-full"
            >
              <Plus className="w-3 h-3" />
              Add Property
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Separate component for primitive rows to handle editing state
interface PrimitiveRowProps {
  propKey: string;
  propPathStr: string;
  propValue: unknown;
  propSchema: JSONSchema;
  isRequired: boolean;
  isAdditional: boolean;
  hasError: boolean;
  propErrors?: { message: string }[];
  isSelected: boolean;
  isEditing: boolean;
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

function PrimitiveRow({
  propKey,
  propPathStr,
  propValue,
  propSchema,
  isRequired,
  isAdditional,
  hasError,
  propErrors,
  isSelected,
  isEditing,
  onSelect,
  onEditingChange,
  onChange,
  onRemove,
  renderNode,
  path,
  depth,
}: PrimitiveRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when selected or editing
  useEffect(() => {
    if ((isSelected || isEditing) && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected, isEditing]);

  return (
    <div
      ref={rowRef}
      id={`node-${propPathStr}`}
      onClick={onSelect}
      onFocus={() => onEditingChange(propPathStr)}
      onBlur={(e) => {
        // Only clear editing if focus is leaving this row entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onEditingChange(null);
        }
      }}
      className={`
        flex items-start gap-2 p-2 rounded-lg transition-all
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
      <div className="flex-shrink-0 min-w-[120px] pt-1.5">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {propKey}
          </span>
          {isRequired && (
            <span className="text-[var(--error-color)] text-xs">*</span>
          )}
        </div>
        {propSchema.description && (
          <div className="text-xs text-[var(--text-tertiary)] truncate max-w-[200px]" title={propSchema.description}>
            {propSchema.description}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {propErrors && (
          <div className="mb-1 text-xs text-[var(--error-color)]">
            {propErrors.map((e, i) => (
              <div key={i}>{e.message}</div>
            ))}
          </div>
        )}
        {renderNode({
          value: propValue,
          onChange,
          schema: propSchema,
          path,
          depth: depth + 1,
        })}
      </div>
      {isAdditional && (
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
