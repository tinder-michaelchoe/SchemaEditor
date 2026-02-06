import styled from 'styled-components';
import type { JSONSchema, SchemaContext } from '../../types/schema';
import { resolveSchema, getSchemaTypes, mergeAllOf } from '../../utils/schemaUtils';
import { StringNode } from './StringNode';
import { NumberNode } from './NumberNode';
import { BooleanNode } from './BooleanNode';
import { NullNode } from './NullNode';
import { EnumNode } from './EnumNode';
import { ConstNode } from './ConstNode';
import { ArrayNode } from './ArrayNode';
import { ObjectNode } from './ObjectNode';
import { UnionNode } from './UnionNode';

interface TreeNodeProps {
  value: unknown;
  onChange: (value: unknown) => void;
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
}

const MAX_DEPTH = 20;

const MaxDepthMessage = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
  font-style: italic;
`;

const CircularRefMessage = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.warning};
  font-style: italic;
`;

const UnknownTypeWrapper = styled.div`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textSecondary};
`;

export function TreeNode({
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
}: TreeNodeProps) {
  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    return (
      <MaxDepthMessage>
        Max depth reached
      </MaxDepthMessage>
    );
  }

  const resolved = resolveSchema(schema, context);

  // Handle circular references
  if ((resolved as { _isCircular?: boolean })._isCircular) {
    return (
      <CircularRefMessage>
        Circular reference detected
      </CircularRefMessage>
    );
  }

  // Handle const
  if (resolved.const !== undefined) {
    return <ConstNode value={resolved.const} />;
  }

  // Handle enum
  if (resolved.enum) {
    return (
      <EnumNode
        value={value}
        onChange={onChange}
        options={resolved.enum}
      />
    );
  }

  // Handle allOf - merge schemas
  if (resolved.allOf && resolved.allOf.length > 0) {
    const merged = mergeAllOf(resolved.allOf, context);
    return (
      <TreeNode
        value={value}
        onChange={onChange}
        schema={merged}
        context={context}
        path={path}
        depth={depth}
        expandedPaths={expandedPaths}
        onToggleExpand={onToggleExpand}
        selectedPath={selectedPath}
        editingPath={editingPath}
        onSelect={onSelect}
        onEditingChange={onEditingChange}
        errors={errors}
      />
    );
  }

  // Handle oneOf/anyOf - discriminated union
  if (resolved.oneOf || resolved.anyOf) {
    return (
      <UnionNode
        value={value}
        onChange={onChange}
        schema={resolved}
        context={context}
        path={path}
        depth={depth}
        renderNode={(props) => (
          <TreeNode
            {...props}
            context={context}
            expandedPaths={expandedPaths}
            onToggleExpand={onToggleExpand}
            selectedPath={selectedPath}
            editingPath={editingPath}
            onSelect={onSelect}
            onEditingChange={onEditingChange}
            errors={errors}
          />
        )}
      />
    );
  }

  // Get types from schema
  const types = getSchemaTypes(resolved);

  // If multiple types, we need a type selector (simplified - just use first type)
  const primaryType = types[0];

  // Render based on type
  switch (primaryType) {
    case 'null':
      return <NullNode />;

    case 'boolean':
      return (
        <BooleanNode
          value={value as boolean}
          onChange={onChange}
        />
      );

    case 'integer':
    case 'number':
      return (
        <NumberNode
          value={value as number | null}
          onChange={onChange}
          schema={{ ...resolved, type: primaryType }}
        />
      );

    case 'string':
      // Get property name from path (last string segment)
      const propertyName = path.length > 0
        ? path.filter(p => typeof p === 'string').pop() as string | undefined
        : undefined;

      return (
        <StringNode
          value={value as string}
          onChange={onChange}
          schema={resolved}
          propertyName={propertyName}
        />
      );

    case 'array':
      return (
        <ArrayNode
          value={value as unknown[]}
          onChange={onChange}
          schema={resolved}
          context={context}
          path={path}
          depth={depth}
          expandedPaths={expandedPaths}
          onToggleExpand={onToggleExpand}
          selectedPath={selectedPath}
          editingPath={editingPath}
          onSelect={onSelect}
          onEditingChange={onEditingChange}
          errors={errors}
          renderNode={(props) => (
            <TreeNode
              {...props}
              context={context}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              selectedPath={selectedPath}
              editingPath={editingPath}
              onSelect={onSelect}
              onEditingChange={onEditingChange}
              errors={errors}
            />
          )}
        />
      );

    case 'object':
      return (
        <ObjectNode
          value={value as Record<string, unknown>}
          onChange={onChange}
          schema={resolved}
          context={context}
          path={path}
          depth={depth}
          expandedPaths={expandedPaths}
          onToggleExpand={onToggleExpand}
          selectedPath={selectedPath}
          editingPath={editingPath}
          onSelect={onSelect}
          onEditingChange={onEditingChange}
          errors={errors}
          renderNode={(props) => (
            <TreeNode
              {...props}
              context={context}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              selectedPath={selectedPath}
              editingPath={editingPath}
              onSelect={onSelect}
              onEditingChange={onEditingChange}
              errors={errors}
            />
          )}
        />
      );

    default:
      // Unknown or any type - render as JSON string input
      return (
        <UnknownTypeWrapper>
          <StringNode
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(newValue) => {
              try {
                onChange(JSON.parse(newValue as string));
              } catch {
                onChange(newValue);
              }
            }}
            schema={{ format: 'textarea' }}
          />
        </UnknownTypeWrapper>
      );
  }
}
