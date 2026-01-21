import type { JSONSchema, JSONSchemaType, SchemaContext } from '../types/schema';
import { resolveSchema, getSchemaTypes, getDiscriminator } from './schemaUtils';

/**
 * Generate a default value for a schema
 */
export function generateDefaultValue(
  schema: JSONSchema,
  context: SchemaContext,
  depth: number = 0
): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return null;
  }

  const resolved = resolveSchema(schema, context);

  // Use explicit default if provided
  if (resolved.default !== undefined) {
    return structuredClone(resolved.default);
  }

  // Use const if specified
  if (resolved.const !== undefined) {
    return resolved.const;
  }

  // Use first enum value if specified
  if (resolved.enum && resolved.enum.length > 0) {
    return resolved.enum[0];
  }

  // Handle allOf by merging
  if (resolved.allOf) {
    const merged: Record<string, unknown> = {};
    for (const subSchema of resolved.allOf) {
      const resolvedSub = resolveSchema(subSchema, context);
      if (resolvedSub.properties) {
        for (const [key, propSchema] of Object.entries(resolvedSub.properties)) {
          merged[key] = generateDefaultValue(propSchema, context, depth + 1);
        }
      }
    }
    return merged;
  }

  // Handle oneOf/anyOf - use first variant or discriminated default
  if (resolved.oneOf || resolved.anyOf) {
    const variants = resolved.oneOf || resolved.anyOf;
    const discriminator = getDiscriminator(resolved, context);
    
    if (discriminator && variants && variants.length > 0) {
      // Use the first discriminated variant
      const firstVariant = resolveSchema(variants[0], context);
      return generateDefaultValue(firstVariant, context, depth + 1);
    }
    
    if (variants && variants.length > 0) {
      return generateDefaultValue(variants[0], context, depth + 1);
    }
  }

  // Generate based on type
  const types = getSchemaTypes(resolved);
  const type = types[0] || 'null';

  return generateDefaultForType(type, resolved, context, depth);
}

/**
 * Generate a default value for a specific type
 */
function generateDefaultForType(
  type: JSONSchemaType,
  schema: JSONSchema,
  context: SchemaContext,
  depth: number
): unknown {
  switch (type) {
    case 'null':
      return null;

    case 'boolean':
      return false;

    case 'integer':
    case 'number':
      if (schema.minimum !== undefined) {
        return schema.minimum;
      }
      if (schema.exclusiveMinimum !== undefined) {
        return schema.exclusiveMinimum + (type === 'integer' ? 1 : 0.1);
      }
      return 0;

    case 'string':
      return '';

    case 'array':
      // Generate minimum required items
      const minItems = schema.minItems || 0;
      const items: unknown[] = [];
      
      if (minItems > 0 && schema.items) {
        const itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
        for (let i = 0; i < minItems; i++) {
          items.push(generateDefaultValue(itemSchema, context, depth + 1));
        }
      }
      
      return items;

    case 'object':
      const obj: Record<string, unknown> = {};
      
      // Add required properties
      if (schema.required && schema.properties) {
        for (const propName of schema.required) {
          const propSchema = schema.properties[propName];
          if (propSchema) {
            obj[propName] = generateDefaultValue(propSchema, context, depth + 1);
          }
        }
      }
      
      return obj;

    default:
      return null;
  }
}

/**
 * Generate a default value for a specific oneOf/anyOf variant
 */
export function generateDefaultForVariant(
  variant: JSONSchema,
  context: SchemaContext
): unknown {
  return generateDefaultValue(variant, context, 0);
}

/**
 * Check if a value matches a schema type
 */
export function valueMatchesType(value: unknown, type: JSONSchemaType): boolean {
  switch (type) {
    case 'null':
      return value === null;
    case 'boolean':
      return typeof value === 'boolean';
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'number':
      return typeof value === 'number';
    case 'string':
      return typeof value === 'string';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}
