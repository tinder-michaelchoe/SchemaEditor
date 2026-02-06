/**
 * Persistence helpers for Context-based stores
 *
 * Handles serialization/deserialization of state to/from localStorage,
 * including version checks, quota handling, and Set/Map conversions.
 */

import type { JSONSchema, SchemaContext, ValidationError } from '../types/schema';
import { createSchemaContext } from '../utils/schemaUtils';
import { generateDefaultValue } from '../utils/defaultValue';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// ─── AJV instance (shared for validation) ────────────────────────────────────

const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
addFormats(ajv);

// ─── Constants ───────────────────────────────────────────────────────────────

export const EDITOR_STORAGE_KEY = 'schema-editor-session';
export const EDITOR_STORAGE_VERSION = 3;

export const UI_STORAGE_KEY = 'schema-editor-ui-state';
export const UI_STORAGE_VERSION = 2;

// ─── Safe localStorage wrappers ──────────────────────────────────────────────

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('[Store] Failed to read from localStorage:', e);
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('[Store] Failed to write to localStorage (quota exceeded?):', e);
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('[Store] Failed to remove from localStorage:', e);
  }
}

// ─── Editor State Serialization ──────────────────────────────────────────────

interface PersistedEditorState {
  _version: number;
  schema: JSONSchema | null;
  data: unknown;
  expandedPaths: string[];
  selectedPath: string | null;
  isDarkMode: boolean;
}

export function serializeEditorState(state: {
  schema: JSONSchema | null;
  data: unknown;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  isDarkMode: boolean;
}): string {
  const payload: PersistedEditorState = {
    _version: EDITOR_STORAGE_VERSION,
    schema: state.schema,
    data: state.data,
    expandedPaths: Array.from(state.expandedPaths),
    selectedPath: state.selectedPath,
    isDarkMode: state.isDarkMode,
  };
  return JSON.stringify(payload);
}

export function deserializeEditorState(): Partial<{
  schema: JSONSchema | null;
  data: unknown;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  isDarkMode: boolean;
}> | null {
  try {
    const raw = safeGetItem(EDITOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedEditorState;

    if (parsed._version !== EDITOR_STORAGE_VERSION) {
      safeRemoveItem(EDITOR_STORAGE_KEY);
      return null;
    }

    return {
      schema: parsed.schema ?? null,
      data: parsed.data ?? null,
      expandedPaths: new Set(Array.isArray(parsed.expandedPaths) ? parsed.expandedPaths : ['root']),
      selectedPath: parsed.selectedPath ?? null,
      isDarkMode: parsed.isDarkMode ?? false,
    };
  } catch (e) {
    console.warn('[EditorStore] Failed to deserialize from localStorage:', e);
    safeRemoveItem(EDITOR_STORAGE_KEY);
    return null;
  }
}

// ─── UI State Serialization ──────────────────────────────────────────────────

export interface PersistedUIState {
  _version: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  inspectorWidth: number;
  layersPanelWidth: number;
  isInspectorOpen: boolean;
  isErrorConsoleOpen: boolean;
  isLayersPanelOpen: boolean;
  isLayersPanelCollapsed: boolean;
  isLeftPanelCollapsed: boolean;
  isMinimapExpanded: boolean;
  leftPanelTab: string;
  rightPanelTab: string;
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  canvasDevice: string;
  expandedPaths: string[];
  layersExpandedPaths: string[];
  isJsonWrapEnabled: boolean;
  isDarkMode: boolean;
}

export function serializeUIState(state: PersistedUIState): string {
  return JSON.stringify({ ...state, _version: UI_STORAGE_VERSION });
}

export function deserializeUIState(): PersistedUIState | null {
  try {
    const raw = safeGetItem(UI_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (parsed._version !== UI_STORAGE_VERSION) {
      safeRemoveItem(UI_STORAGE_KEY);
      return null;
    }

    return parsed as PersistedUIState;
  } catch (e) {
    console.warn('[UIStore] Failed to deserialize from localStorage:', e);
    safeRemoveItem(UI_STORAGE_KEY);
    return null;
  }
}

// ─── Validation helper ───────────────────────────────────────────────────────

export function validateData(
  schema: JSONSchema | null,
  data: unknown
): Map<string, ValidationError[]> {
  const errors = new Map<string, ValidationError[]>();
  if (!schema) return errors;

  // Check if schema is already compiled (by $id) to avoid "already exists" error
  let validate = schema.$id ? ajv.getSchema(schema.$id) : null;
  if (!validate) {
    // If schema has $id and already exists, remove it first
    if (schema.$id) {
      try {
        ajv.removeSchema(schema.$id);
      } catch (e) {
        // Ignore - schema might not exist yet
      }
    }
    validate = ajv.compile(schema);
  }

  const valid = validate(data);

  if (!valid && validate.errors) {
    const seenErrors = new Set<string>();

    for (const error of validate.errors) {
      if (
        error.keyword === 'oneOf' ||
        error.keyword === 'anyOf' ||
        error.keyword === 'not' ||
        error.keyword === 'const'
      ) {
        continue;
      }

      const path = error.instancePath || 'root';
      const message = error.message || 'Validation error';
      const errorKey = `${path}:${message}`;

      if (seenErrors.has(errorKey)) continue;
      seenErrors.add(errorKey);

      const existing = errors.get(path) || [];
      existing.push({ path, message, keyword: error.keyword });
      errors.set(path, existing);
    }
  }

  return errors;
}

// ─── Rehydration helper ──────────────────────────────────────────────────────

export interface RehydratedEditorState {
  schema: JSONSchema | null;
  schemaContext: SchemaContext | null;
  data: unknown;
  errors: Map<string, ValidationError[]>;
  isValid: boolean;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  editingPath: string | null;
  isDarkMode: boolean;
  history: { data: unknown; timestamp: number; description: string }[];
  historyIndex: number;
}

export function createRehydratedEditorState(
  defaults: RehydratedEditorState
): RehydratedEditorState {
  const persisted = deserializeEditorState();
  if (!persisted || !persisted.schema) {
    return defaults;
  }

  let schemaContext: SchemaContext | null = null;
  try {
    schemaContext = createSchemaContext(persisted.schema);
  } catch (e) {
    console.warn('[EditorStore] Failed to rebuild schemaContext:', e);
    return defaults;
  }

  const data = persisted.data ?? generateDefaultValue(persisted.schema, schemaContext);
  const errors = validateData(persisted.schema, data);

  return {
    schema: persisted.schema,
    schemaContext,
    data,
    errors,
    isValid: errors.size === 0,
    expandedPaths: persisted.expandedPaths ?? new Set(['root']),
    selectedPath: persisted.selectedPath ?? null,
    editingPath: null,
    isDarkMode: persisted.isDarkMode ?? false,
    history: [
      {
        data: JSON.parse(JSON.stringify(data)),
        timestamp: Date.now(),
        description: 'Session restored',
      },
    ],
    historyIndex: 0,
  };
}
