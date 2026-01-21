import type { JSONSchema, JSONSchemaType, DiscriminatorInfo, SchemaContext } from '../types/schema';

/**
 * Create a schema context for resolving references
 */
export function createSchemaContext(schema: JSONSchema): SchemaContext {
  const definitions: Record<string, JSONSchema> = {
    ...schema.definitions,
    ...schema.$defs,
  };

  const resolveRef = (ref: string): JSONSchema | null => {
    if (!ref.startsWith('#/')) {
      console.warn('External $ref not supported:', ref);
      return null;
    }

    const path = ref.slice(2).split('/');
    let current: unknown = schema;

    for (const segment of path) {
      if (current === null || typeof current !== 'object') {
        return null;
      }
      const decodedSegment = segment.replace(/~1/g, '/').replace(/~0/g, '~');
      current = (current as Record<string, unknown>)[decodedSegment];
    }

    return current as JSONSchema | null;
  };

  return {
    rootSchema: schema,
    definitions,
    resolveRef,
  };
}

/**
 * Resolve a schema, following $ref if present
 */
export function resolveSchema(
  schema: JSONSchema,
  context: SchemaContext,
  visited: Set<string> = new Set()
): JSONSchema {
  if (!schema.$ref) {
    return schema;
  }

  // Detect circular references
  if (visited.has(schema.$ref)) {
    return { ...schema, _isCircular: true } as JSONSchema;
  }

  const resolved = context.resolveRef(schema.$ref);
  if (!resolved) {
    console.warn('Failed to resolve $ref:', schema.$ref);
    return schema;
  }

  const newVisited = new Set(visited);
  newVisited.add(schema.$ref);

  // Merge the resolved schema with any additional properties
  const { $ref, ...rest } = schema;
  const resolvedSchema = resolveSchema(resolved, context, newVisited);
  
  return {
    ...resolvedSchema,
    ...rest,
    _resolvedRef: $ref,
  } as JSONSchema;
}

/**
 * Get the effective type(s) of a schema
 */
export function getSchemaTypes(schema: JSONSchema): JSONSchemaType[] {
  if (schema.type) {
    return Array.isArray(schema.type) ? schema.type : [schema.type];
  }

  // Infer type from other keywords
  if (schema.properties || schema.additionalProperties || schema.patternProperties) {
    return ['object'];
  }
  if (schema.items !== undefined) {
    return ['array'];
  }
  if (schema.enum !== undefined) {
    // Try to infer from enum values
    const types = new Set<JSONSchemaType>();
    for (const value of schema.enum) {
      const type = getValueType(value);
      if (type) types.add(type);
    }
    return types.size > 0 ? Array.from(types) : ['string'];
  }
  if (schema.const !== undefined) {
    const type = getValueType(schema.const);
    return type ? [type] : ['string'];
  }

  return [];
}

/**
 * Get the JSON Schema type of a JavaScript value
 */
export function getValueType(value: unknown): JSONSchemaType | null {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return null;
}

/**
 * Check if a schema has oneOf/anyOf that can be discriminated
 */
export function getDiscriminator(schema: JSONSchema, context: SchemaContext): DiscriminatorInfo | null {
  const variants = schema.oneOf || schema.anyOf;
  if (!variants || variants.length < 2) {
    return null;
  }

  // Find a common property with const values in all variants
  const propertyConstCounts = new Map<string, Map<unknown, JSONSchema>>();

  for (const variant of variants) {
    const resolved = resolveSchema(variant, context);
    
    if (!resolved.properties) continue;

    for (const [propName, propSchema] of Object.entries(resolved.properties)) {
      const resolvedProp = resolveSchema(propSchema, context);
      
      if (resolvedProp.const !== undefined) {
        if (!propertyConstCounts.has(propName)) {
          propertyConstCounts.set(propName, new Map());
        }
        propertyConstCounts.get(propName)!.set(resolvedProp.const, resolved);
      }
    }
  }

  // Find a property that has const values in all variants
  for (const [propName, constMap] of propertyConstCounts) {
    if (constMap.size === variants.length) {
      return {
        propertyName: propName,
        mapping: constMap,
      };
    }
  }

  return null;
}

/**
 * Get human-readable label for a schema
 */
export function getSchemaLabel(schema: JSONSchema, context: SchemaContext): string {
  if (schema.title) {
    return schema.title;
  }

  const resolved = resolveSchema(schema, context);
  
  if (resolved.const !== undefined) {
    return String(resolved.const);
  }

  if (resolved.enum && resolved.enum.length > 0) {
    return `enum (${resolved.enum.slice(0, 3).join(', ')}${resolved.enum.length > 3 ? '...' : ''})`;
  }

  const types = getSchemaTypes(resolved);
  if (types.length > 0) {
    return types.join(' | ');
  }

  return 'any';
}

/**
 * Get all defined property names for an object schema
 */
export function getObjectProperties(schema: JSONSchema, context: SchemaContext): string[] {
  const resolved = resolveSchema(schema, context);
  return Object.keys(resolved.properties || {});
}

/**
 * Check if a property is required
 */
export function isPropertyRequired(schema: JSONSchema, propertyName: string, context: SchemaContext): boolean {
  const resolved = resolveSchema(schema, context);
  return resolved.required?.includes(propertyName) ?? false;
}

/**
 * Get the schema for an array's items
 */
export function getArrayItemSchema(schema: JSONSchema, context: SchemaContext, index?: number): JSONSchema | null {
  const resolved = resolveSchema(schema, context);
  
  if (!resolved.items) {
    return null;
  }

  if (Array.isArray(resolved.items)) {
    // Tuple validation
    if (index !== undefined && index < resolved.items.length) {
      return resolved.items[index];
    }
    // Additional items
    if (resolved.additionalItems && typeof resolved.additionalItems === 'object') {
      return resolved.additionalItems;
    }
    return null;
  }

  return resolved.items;
}

/**
 * Get the schema for an object's additional properties
 */
export function getAdditionalPropertiesSchema(schema: JSONSchema, context: SchemaContext): JSONSchema | null {
  const resolved = resolveSchema(schema, context);
  
  if (resolved.additionalProperties === false) {
    return null;
  }
  
  if (typeof resolved.additionalProperties === 'object') {
    return resolved.additionalProperties;
  }
  
  // additionalProperties: true or undefined - allow any
  return {};
}

/**
 * Check if an object schema allows additional properties
 */
export function allowsAdditionalProperties(schema: JSONSchema, context: SchemaContext): boolean {
  const resolved = resolveSchema(schema, context);
  return resolved.additionalProperties !== false;
}

/**
 * Merge allOf schemas
 */
export function mergeAllOf(schemas: JSONSchema[], context: SchemaContext): JSONSchema {
  const merged: JSONSchema = {};
  
  for (const schema of schemas) {
    const resolved = resolveSchema(schema, context);
    
    // Merge properties
    if (resolved.properties) {
      merged.properties = { ...merged.properties, ...resolved.properties };
    }
    
    // Merge required
    if (resolved.required) {
      merged.required = [...new Set([...(merged.required || []), ...resolved.required])];
    }
    
    // Take first type
    if (!merged.type && resolved.type) {
      merged.type = resolved.type;
    }
    
    // Merge other fields
    if (resolved.additionalProperties !== undefined && merged.additionalProperties === undefined) {
      merged.additionalProperties = resolved.additionalProperties;
    }
  }
  
  return merged;
}

/**
 * Evaluate conditional schema (if/then/else)
 */
export function evaluateConditional(
  schema: JSONSchema,
  data: unknown,
  context: SchemaContext
): JSONSchema | null {
  if (!schema.if) {
    return null;
  }

  // Simple check - in a real implementation, you'd use AJV for full validation
  // For now, we'll just return the schema without conditional evaluation
  // The validation layer will handle the actual conditional logic
  
  return null;
}
