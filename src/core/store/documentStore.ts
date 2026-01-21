/**
 * Document Store
 * 
 * Core store for document state (schema, data, errors).
 * This is a thin wrapper that integrates with the existing editorStore.
 */

import { create } from 'zustand';
import type { JSONSchema, SchemaContext, ValidationError } from '../../types/schema';
import type { DocumentStore } from '../ActionAPI';
import { useEditorStore } from '../../store/editorStore';
import {
  getValueAtPath,
  setValueAtPath,
  pathToString,
} from '../../utils/pathUtils';

// ============================================================================
// Types
// ============================================================================

interface DocumentState {
  schema: JSONSchema | null;
  schemaContext: SchemaContext | null;
  data: unknown;
  errors: Map<string, ValidationError[]>;
  isValid: boolean;
}

// ============================================================================
// Document Store Adapter
// ============================================================================

/**
 * Creates a DocumentStore adapter from the editor store
 * This allows the ActionAPI to work with the existing store
 */
export function createDocumentStoreAdapter(): DocumentStore {
  return {
    getSchema: () => useEditorStore.getState().schema,
    getData: () => useEditorStore.getState().data,
    getValueAtPath: (path) => {
      const data = useEditorStore.getState().data;
      return getValueAtPath(data, path);
    },
    setValueAtPath: (path, value) => {
      useEditorStore.getState().updateValue(path, value);
    },
    addArrayItem: (path, value) => {
      useEditorStore.getState().addArrayItem(path, value);
    },
    removeArrayItem: (path, index) => {
      useEditorStore.getState().removeArrayItem(path, index);
    },
    addObjectProperty: (path, key, value) => {
      useEditorStore.getState().addObjectProperty(path, key, value);
    },
    removeObjectProperty: (path, key) => {
      useEditorStore.getState().removeObjectProperty(path, key);
    },
    setData: (data) => {
      useEditorStore.getState().setData(data);
    },
    resetData: () => {
      useEditorStore.getState().resetData();
    },
    validate: () => {
      const state = useEditorStore.getState();
      state.validate();
      return {
        isValid: state.isValid,
        errors: state.errors,
      };
    },
  };
}

/**
 * Hook to access document state
 */
export function useDocumentState(): DocumentState {
  const { schema, schemaContext, data, errors, isValid } = useEditorStore();
  
  return {
    schema,
    schemaContext,
    data,
    errors,
    isValid,
  };
}

/**
 * Hook to check if a document is loaded
 */
export function useHasDocument(): boolean {
  const schema = useEditorStore((state) => state.schema);
  return schema !== null;
}

/**
 * Hook to get validation errors
 */
export function useValidationErrors(): Map<string, ValidationError[]> {
  return useEditorStore((state) => state.errors);
}

/**
 * Hook to check validation status
 */
export function useIsValid(): boolean {
  return useEditorStore((state) => state.isValid);
}
