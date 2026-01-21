// JSON Schema Draft-07 Types

export interface JSONSchema {
  // Meta
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchema>;
  definitions?: Record<string, JSONSchema>;
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];

  // Type
  type?: JSONSchemaType | JSONSchemaType[];
  enum?: unknown[];
  const?: unknown;

  // String
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Number
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // Array
  items?: JSONSchema | JSONSchema[];
  additionalItems?: boolean | JSONSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  contains?: JSONSchema;

  // Object
  properties?: Record<string, JSONSchema>;
  patternProperties?: Record<string, JSONSchema>;
  additionalProperties?: boolean | JSONSchema;
  required?: string[];
  propertyNames?: JSONSchema;
  minProperties?: number;
  maxProperties?: number;
  dependencies?: Record<string, JSONSchema | string[]>;

  // Composition
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;

  // Conditionals
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;
}

export type JSONSchemaType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

export interface ResolvedSchema extends Omit<JSONSchema, '$ref'> {
  _resolvedRef?: string;
  _isCircular?: boolean;
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

export interface SchemaContext {
  rootSchema: JSONSchema;
  definitions: Record<string, JSONSchema>;
  resolveRef: (ref: string) => JSONSchema | null;
}

// Discriminator info for oneOf/anyOf with const type fields
export interface DiscriminatorInfo {
  propertyName: string;
  mapping: Map<unknown, JSONSchema>;
}
