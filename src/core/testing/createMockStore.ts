/**
 * Mock Store Factory for Testing
 * 
 * Creates mock Zustand stores for testing plugins that interact with state.
 */

import type { JSONSchema, ValidationError } from '../../types/schema';

/**
 * Document store state
 */
export interface MockDocumentState {
  data: unknown;
  schema: JSONSchema | null;
  schemaContext: unknown;
  errors: Map<string, { message: string }[]>;
}

/**
 * Selection store state
 */
export interface MockSelectionState {
  selectedPath: string | null;
  editingPath: string | null;
  hoveredPath: string | null;
}

/**
 * UI store state
 */
export interface MockUIState {
  darkMode: boolean;
  expandedPaths: Set<string>;
  viewMode: 'tree' | 'json';
}

/**
 * Combined mock store state
 */
export interface MockStoreState {
  document: MockDocumentState;
  selection: MockSelectionState;
  ui: MockUIState;
}

/**
 * Mock store interface with testing utilities
 */
export interface MockStore {
  /** Get current state */
  getState(): MockStoreState;
  
  /** Set document data */
  setDocumentData(data: unknown): void;
  
  /** Set schema */
  setSchema(schema: JSONSchema | null): void;
  
  /** Set schema context */
  setSchemaContext(context: unknown): void;
  
  /** Set errors */
  setErrors(errors: Map<string, { message: string }[]>): void;
  
  /** Add an error */
  addError(path: string, message: string): void;
  
  /** Clear errors */
  clearErrors(): void;
  
  /** Set selected path */
  setSelectedPath(path: string | null): void;
  
  /** Set editing path */
  setEditingPath(path: string | null): void;
  
  /** Set hovered path */
  setHoveredPath(path: string | null): void;
  
  /** Toggle expanded path */
  toggleExpanded(path: string): void;
  
  /** Set dark mode */
  setDarkMode(darkMode: boolean): void;
  
  /** Set view mode */
  setViewMode(mode: 'tree' | 'json'): void;
  
  /** Subscribe to state changes */
  subscribe(listener: (state: MockStoreState) => void): () => void;
  
  /** Reset to initial state */
  reset(): void;
  
  /** Get change history */
  getChangeHistory(): Array<{ type: string; payload: unknown; timestamp: number }>;
}

/**
 * Options for creating a mock store
 */
export interface MockStoreOptions {
  /** Initial document data */
  documentData?: unknown;
  
  /** Initial schema */
  schema?: JSONSchema | null;
  
  /** Initial schema context */
  schemaContext?: unknown;
  
  /** Initial errors */
  errors?: Map<string, { message: string }[]>;
  
  /** Initial selected path */
  selectedPath?: string | null;
  
  /** Initial editing path */
  editingPath?: string | null;
  
  /** Initial dark mode */
  darkMode?: boolean;
  
  /** Initial expanded paths */
  expandedPaths?: Set<string>;
  
  /** Initial view mode */
  viewMode?: 'tree' | 'json';
}

/**
 * Creates a mock store for testing
 */
export function createMockStore(options: MockStoreOptions = {}): MockStore {
  const initialState: MockStoreState = {
    document: {
      data: options.documentData ?? {},
      schema: options.schema ?? null,
      schemaContext: options.schemaContext ?? null,
      errors: options.errors ?? new Map(),
    },
    selection: {
      selectedPath: options.selectedPath ?? null,
      editingPath: options.editingPath ?? null,
      hoveredPath: null,
    },
    ui: {
      darkMode: options.darkMode ?? false,
      expandedPaths: options.expandedPaths ?? new Set(),
      viewMode: options.viewMode ?? 'tree',
    },
  };
  
  // Current state
  let state = { ...initialState };
  
  // Deep clone initial state for reset
  const cloneInitialState = (): MockStoreState => ({
    document: {
      data: initialState.document.data,
      schema: initialState.document.schema,
      schemaContext: initialState.document.schemaContext,
      errors: new Map(initialState.document.errors),
    },
    selection: { ...initialState.selection },
    ui: {
      ...initialState.ui,
      expandedPaths: new Set(initialState.ui.expandedPaths),
    },
  });
  
  // Subscribers
  const listeners = new Set<(state: MockStoreState) => void>();
  
  // Change history
  const changeHistory: Array<{ type: string; payload: unknown; timestamp: number }> = [];
  
  // Notify subscribers
  const notify = () => {
    listeners.forEach(listener => listener(state));
  };
  
  // Record change
  const recordChange = (type: string, payload: unknown) => {
    changeHistory.push({ type, payload, timestamp: Date.now() });
  };
  
  return {
    getState(): MockStoreState {
      return state;
    },
    
    setDocumentData(data: unknown): void {
      state = {
        ...state,
        document: { ...state.document, data },
      };
      recordChange('setDocumentData', data);
      notify();
    },
    
    setSchema(schema: JSONSchema | null): void {
      state = {
        ...state,
        document: { ...state.document, schema },
      };
      recordChange('setSchema', schema);
      notify();
    },
    
    setSchemaContext(context: unknown): void {
      state = {
        ...state,
        document: { ...state.document, schemaContext: context },
      };
      recordChange('setSchemaContext', context);
      notify();
    },
    
    setErrors(errors: Map<string, { message: string }[]>): void {
      state = {
        ...state,
        document: { ...state.document, errors },
      };
      recordChange('setErrors', errors);
      notify();
    },
    
    addError(path: string, message: string): void {
      const newErrors = new Map(state.document.errors);
      const existing = newErrors.get(path) || [];
      newErrors.set(path, [...existing, { message }]);
      state = {
        ...state,
        document: { ...state.document, errors: newErrors },
      };
      recordChange('addError', { path, message });
      notify();
    },
    
    clearErrors(): void {
      state = {
        ...state,
        document: { ...state.document, errors: new Map() },
      };
      recordChange('clearErrors', null);
      notify();
    },
    
    setSelectedPath(path: string | null): void {
      state = {
        ...state,
        selection: { ...state.selection, selectedPath: path },
      };
      recordChange('setSelectedPath', path);
      notify();
    },
    
    setEditingPath(path: string | null): void {
      state = {
        ...state,
        selection: { ...state.selection, editingPath: path },
      };
      recordChange('setEditingPath', path);
      notify();
    },
    
    setHoveredPath(path: string | null): void {
      state = {
        ...state,
        selection: { ...state.selection, hoveredPath: path },
      };
      recordChange('setHoveredPath', path);
      notify();
    },
    
    toggleExpanded(path: string): void {
      const newExpanded = new Set(state.ui.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      state = {
        ...state,
        ui: { ...state.ui, expandedPaths: newExpanded },
      };
      recordChange('toggleExpanded', path);
      notify();
    },
    
    setDarkMode(darkMode: boolean): void {
      state = {
        ...state,
        ui: { ...state.ui, darkMode },
      };
      recordChange('setDarkMode', darkMode);
      notify();
    },
    
    setViewMode(mode: 'tree' | 'json'): void {
      state = {
        ...state,
        ui: { ...state.ui, viewMode: mode },
      };
      recordChange('setViewMode', mode);
      notify();
    },
    
    subscribe(listener: (state: MockStoreState) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    
    reset(): void {
      state = cloneInitialState();
      changeHistory.length = 0;
      notify();
    },
    
    getChangeHistory(): Array<{ type: string; payload: unknown; timestamp: number }> {
      return [...changeHistory];
    },
  };
}
