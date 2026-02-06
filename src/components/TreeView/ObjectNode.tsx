import { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Collapsible } from '../ui/Collapsible';
import { truncateText } from '@/styles/mixins';
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

/* ── Styled Components ── */

const SpacedContainer = styled.div`
  & > * + * {
    margin-top: 0.25rem;
  }
`;

const BadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SectionLabel = styled.div`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
`;

const CollapsibleContent = styled.div`
  padding: 0.75rem;
`;

const ErrorMessages = styled.div<{ $marginBottom?: string }>`
  margin-bottom: ${p => p.$marginBottom ?? '0.5rem'};
  font-size: 0.75rem;
  color: ${p => p.theme.colors.error};
`;

const AddPropertySection = styled.div`
  margin-top: 0.5rem;
`;

const AddPropertyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DeleteButton = styled(Button)`
  color: ${p => p.theme.colors.error};
  &:hover {
    color: ${p => p.theme.colors.error};
  }
`;

const FlexShrinkDeleteButton = styled(DeleteButton)`
  flex-shrink: 0;
`;

/* ── PrimitiveRow styled components ── */

const PrimitiveRowContainer = styled.div<{
  $isEditing: boolean;
  $isSelected: boolean;
  $hasError: boolean;
}>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.lg};
  transition: all 0.15s ease;
  border: 1px solid;
  cursor: pointer;

  ${p => p.$isEditing && css`
    background: ${p.theme.colors.accent}1a;
    border-color: ${p.theme.colors.accent};
    box-shadow: 0 0 0 2px ${p.theme.colors.accent}4d;
  `}

  ${p => !p.$isEditing && p.$isSelected && css`
    background: ${p.theme.colors.accent}0d;
    border-color: ${p.theme.colors.accent};
    box-shadow: 0 0 0 1px ${p.theme.colors.accent}33;
  `}

  ${p => !p.$isEditing && !p.$isSelected && p.$hasError && css`
    background: ${p.theme.colors.bgSecondary};
    border-color: ${p.theme.colors.error};
  `}

  ${p => !p.$isEditing && !p.$isSelected && !p.$hasError && css`
    background: ${p.theme.colors.bgSecondary};
    border-color: ${p.theme.colors.border};

    &:hover {
      border-color: ${p.theme.colors.accent}80;
    }
  `}
`;

const PropertyLabel = styled.div`
  flex-shrink: 0;
  min-width: 120px;
  padding-top: 0.375rem;
`;

const PropertyNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PropertyName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const RequiredMarker = styled.span`
  color: ${p => p.theme.colors.error};
  font-size: 0.75rem;
`;

const PropertyDescription = styled.div`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  ${truncateText}
  max-width: 200px;
`;

const ValueContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

/* ── Types ── */

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
            <BadgeGroup>
              {isRequired && <Badge variant="required">required</Badge>}
              <Badge variant="type">{getSchemaLabel(resolvedPropSchema, context)}</Badge>
            </BadgeGroup>
          }
          error={hasError}
          actions={
            isAdditional && (
              <DeleteButton
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveProperty(key)}
              >
                <Trash2 size={12} />
              </DeleteButton>
            )
          }
        >
          <CollapsibleContent>
            {propErrors && (
              <ErrorMessages>
                {propErrors.map((e, i) => (
                  <div key={i}>{e.message}</div>
                ))}
              </ErrorMessages>
            )}
            {renderNode({
              value: propValue,
              onChange: (newValue) => handlePropertyChange(key, newValue),
              schema: resolvedPropSchema,
              path: propPath,
              depth: depth + 1,
            })}
          </CollapsibleContent>
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
    <SpacedContainer>
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
            <SectionLabel>
              Additional Properties
            </SectionLabel>
          )}
          {additionalKeys.map((key) =>
            renderProperty(key, additionalPropsSchema || {}, false, true)
          )}
        </>
      )}

      {/* Add property button */}
      {canAddAdditional && (
        <AddPropertySection>
          {isAddingProperty ? (
            <AddPropertyRow>
              <Input
                value={newPropertyKey}
                onChange={(e) => setNewPropertyKey(e.target.value)}
                placeholder="Property name..."
                style={{ flex: 1 }}
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
            </AddPropertyRow>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingProperty(true)}
              style={{ width: '100%' }}
            >
              <Plus size={12} />
              Add Property
            </Button>
          )}
        </AddPropertySection>
      )}
    </SpacedContainer>
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
    <PrimitiveRowContainer
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
      $isEditing={isEditing}
      $isSelected={isSelected}
      $hasError={hasError}
    >
      <PropertyLabel>
        <PropertyNameRow>
          <PropertyName>
            {propKey}
          </PropertyName>
          {isRequired && (
            <RequiredMarker>*</RequiredMarker>
          )}
        </PropertyNameRow>
        {propSchema.description && (
          <PropertyDescription title={propSchema.description}>
            {propSchema.description}
          </PropertyDescription>
        )}
      </PropertyLabel>
      <ValueContainer>
        {propErrors && (
          <ErrorMessages $marginBottom="0.25rem">
            {propErrors.map((e, i) => (
              <div key={i}>{e.message}</div>
            ))}
          </ErrorMessages>
        )}
        {renderNode({
          value: propValue,
          onChange,
          schema: propSchema,
          path,
          depth: depth + 1,
        })}
      </ValueContainer>
      {isAdditional && (
        <FlexShrinkDeleteButton
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          <Trash2 size={12} />
        </FlexShrinkDeleteButton>
      )}
    </PrimitiveRowContainer>
  );
}
