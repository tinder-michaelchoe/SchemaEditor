/**
 * Document Store
 *
 * Core store for document state (schema, data, errors).
 * Uses EditorContext refs for imperative access and EditorContext hooks for React access.
 */

import type { JSONSchema, SchemaContext, ValidationError } from '../../types/schema';
import type { DocumentStore } from '../ActionAPI';
import { useEditorState } from '../../store/EditorContext';
import { editorStoreRef } from '../../store/storeRefs';
import { getValueAtPath } from '../../utils/pathUtils';

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
 * Creates a DocumentStore adapter using store refs
 */
export function createDocumentStoreAdapter(): DocumentStore {
  return {
    getSchema: () => editorStoreRef.current!.schema,
    getData: () => editorStoreRef.current!.data,
    getValueAtPath: (path) => {
      const data = editorStoreRef.current!.data;
      return getValueAtPath(data, path);
    },
    setValueAtPath: (path, value) => {
      editorStoreRef.current!.updateValue(path, value);
    },
    addArrayItem: (path, value) => {
      editorStoreRef.current!.addArrayItem(path, value);
    },
    removeArrayItem: (path, index) => {
      editorStoreRef.current!.removeArrayItem(path, index);
    },
    addObjectProperty: (path, key, value) => {
      editorStoreRef.current!.addObjectProperty(path, key, value);
    },
    removeObjectProperty: (path, key) => {
      editorStoreRef.current!.removeObjectProperty(path, key);
    },
    setData: (data) => {
      editorStoreRef.current!.setData(data);
    },
    resetData: () => {
      editorStoreRef.current!.resetData();
    },
    validate: () => {
      editorStoreRef.current!.validate();
      return {
        isValid: editorStoreRef.current!.isValid,
        errors: editorStoreRef.current!.errors,
      };
    },
  };
}

/**
 * Hook to access document state
 */
export function useDocumentState(): DocumentState {
  const { schema, schemaContext, data, errors, isValid } = useEditorState();

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
  const { schema } = useEditorState();
  return schema !== null;
}

/**
 * Hook to get validation errors
 */
export function useValidationErrors(): Map<string, ValidationError[]> {
  const { errors } = useEditorState();
  return errors;
}

/**
 * Hook to check validation status
 */
export function useIsValid(): boolean {
  const { isValid } = useEditorState();
  return isValid;
}
