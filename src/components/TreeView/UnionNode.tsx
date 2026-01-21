import { useMemo } from 'react';
import { Select } from '../ui/Select';
import type { JSONSchema, SchemaContext } from '../../types/schema';
import { resolveSchema, getDiscriminator, getSchemaLabel } from '../../utils/schemaUtils';
import { generateDefaultForVariant } from '../../utils/defaultValue';

interface UnionNodeProps {
  value: unknown;
  onChange: (value: unknown) => void;
  schema: JSONSchema;
  context: SchemaContext;
  error?: boolean;
  disabled?: boolean;
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

export function UnionNode({
  value,
  onChange,
  schema,
  context,
  error,
  disabled,
  renderNode,
  path,
  depth,
}: UnionNodeProps) {
  const variants = schema.oneOf || schema.anyOf || [];
  
  // Check for discriminated union
  const discriminator = useMemo(() => getDiscriminator(schema, context), [schema, context]);
  
  // Find the current matching variant
  const { selectedIndex, selectedVariant } = useMemo(() => {
    if (discriminator && value && typeof value === 'object') {
      const discriminatorValue = (value as Record<string, unknown>)[discriminator.propertyName];
      for (let i = 0; i < variants.length; i++) {
        const resolved = resolveSchema(variants[i], context);
        const constValue = resolved.properties?.[discriminator.propertyName];
        if (constValue) {
          const resolvedConst = resolveSchema(constValue, context);
          if (resolvedConst.const === discriminatorValue) {
            return { selectedIndex: i, selectedVariant: resolved };
          }
        }
      }
    }
    
    // Fallback: try to match by structure
    for (let i = 0; i < variants.length; i++) {
      const resolved = resolveSchema(variants[i], context);
      // Simple type matching
      if (resolved.type) {
        const types = Array.isArray(resolved.type) ? resolved.type : [resolved.type];
        const valueType = Array.isArray(value) ? 'array' 
          : value === null ? 'null' 
          : typeof value;
        if (types.includes(valueType as never)) {
          return { selectedIndex: i, selectedVariant: resolved };
        }
      }
    }
    
    return { selectedIndex: 0, selectedVariant: variants[0] ? resolveSchema(variants[0], context) : null };
  }, [value, variants, discriminator, context]);

  // Generate options for the selector
  const options = useMemo(() => {
    return variants.map((variant, index) => {
      const resolved = resolveSchema(variant, context);
      
      // For discriminated unions, show the const value
      if (discriminator) {
        const constSchema = resolved.properties?.[discriminator.propertyName];
        if (constSchema) {
          const resolvedConst = resolveSchema(constSchema, context);
          if (resolvedConst.const !== undefined) {
            return {
              value: String(index),
              label: String(resolvedConst.const),
            };
          }
        }
      }
      
      // Fallback to schema label
      return {
        value: String(index),
        label: resolved.title || getSchemaLabel(resolved, context),
      };
    });
  }, [variants, discriminator, context]);

  const handleVariantChange = (newIndex: number) => {
    const newVariant = variants[newIndex];
    if (newVariant) {
      const resolved = resolveSchema(newVariant, context);
      const newValue = generateDefaultForVariant(resolved, context);
      onChange(newValue);
    }
  };

  if (variants.length === 0) {
    return <div className="text-[var(--text-secondary)]">No variants defined</div>;
  }

  return (
    <div className="space-y-2">
      <Select
        value={String(selectedIndex)}
        onChange={(e) => handleVariantChange(parseInt(e.target.value, 10))}
        options={options}
        error={error}
        disabled={disabled}
      />
      
      {selectedVariant && (
        <div className="pl-2 border-l-2 border-[var(--border-color)]">
          {renderNode({
            value,
            onChange,
            schema: selectedVariant,
            path,
            depth: depth + 1,
          })}
        </div>
      )}
    </div>
  );
}
