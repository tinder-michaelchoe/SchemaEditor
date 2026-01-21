import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import betterAjvErrors from 'better-ajv-errors';
import type { JSONSchema, SchemaContext, ValidationError } from '../types/schema';
import { createSchemaContext } from '../utils/schemaUtils';
import { generateDefaultValue } from '../utils/defaultValue';
import {
  getValueAtPath,
  setValueAtPath,
  deleteValueAtPath,
  pathToString,
} from '../utils/pathUtils';

// Initialize AJV
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
});
addFormats(ajv);

// Max history entries to persist (limit for localStorage)
// Set to 0 to disable history persistence (avoids quota issues)
const MAX_PERSISTED_HISTORY = 0;

// Custom storage that handles quota exceeded errors gracefully
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      console.warn('[EditorStore] Failed to read from localStorage:', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      // QuotaExceededError - try to clear and retry, or just skip
      console.warn('[EditorStore] Failed to write to localStorage (quota exceeded?):', e);
      try {
        // Try to clear old data and retry with minimal data
        localStorage.removeItem(name);
        // Don't retry - just skip persistence for this update
      } catch (clearError) {
        console.warn('[EditorStore] Failed to clear localStorage:', clearError);
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn('[EditorStore] Failed to remove from localStorage:', e);
    }
  },
};

// History entry for undo/redo
interface HistoryEntry {
  data: unknown;
  timestamp: number;
  description: string;
}

const MAX_HISTORY_SIZE = 100;

interface EditorState {
  // Schema
  schema: JSONSchema | null;
  schemaContext: SchemaContext | null;
  
  // Data
  data: unknown;
  
  // Validation
  errors: Map<string, ValidationError[]>;
  isValid: boolean;
  
  // UI State
  expandedPaths: Set<string>;
  selectedPath: string | null;
  editingPath: string | null;
  
  // Theme
  isDarkMode: boolean;
  
  // Undo/Redo History
  history: HistoryEntry[];
  historyIndex: number;
  
  // Actions
  setSchema: (schema: JSONSchema) => void;
  setData: (data: unknown) => void;
  importJSON: (json: unknown) => void;
  updateValue: (path: (string | number)[], value: unknown) => void;
  addArrayItem: (path: (string | number)[], value?: unknown) => void;
  removeArrayItem: (path: (string | number)[], index: number) => void;
  moveArrayItem: (path: (string | number)[], fromIndex: number, toIndex: number) => void;
  moveItemBetweenArrays: (
    sourcePath: (string | number)[],
    sourceIndex: number,
    targetPath: (string | number)[],
    targetIndex: number
  ) => void;
  addObjectProperty: (path: (string | number)[], key: string, value?: unknown) => void;
  removeObjectProperty: (path: (string | number)[], key: string) => void;
  toggleExpanded: (path: string) => void;
  expandPaths: (paths: string[]) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandErrorPaths: () => void;
  setSelectedPath: (path: string | null) => void;
  setEditingPath: (path: string | null) => void;
  toggleDarkMode: () => void;
  validate: () => void;
  resetData: () => void;
  
  // Undo/Redo Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (description: string) => void;
  clearHistory: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
  // Initial state
  schema: null,
  schemaContext: null,
  data: null,
  errors: new Map(),
  isValid: true,
  expandedPaths: new Set(['root']),
  selectedPath: null,
  editingPath: null,
  isDarkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  
  // Undo/Redo initial state
  history: [],
  historyIndex: -1,

  setSchema: (schema) => {
    const schemaContext = createSchemaContext(schema);
    const defaultData = generateDefaultValue(schema, schemaContext);
    
    set({
      schema,
      schemaContext,
      data: defaultData,
      errors: new Map(),
      isValid: true,
      expandedPaths: new Set(['root']),
      // Reset history when loading new schema
      history: [{
        data: JSON.parse(JSON.stringify(defaultData)),
        timestamp: Date.now(),
        description: 'Initial state',
      }],
      historyIndex: 0,
    });
    
    // Validate initial data
    get().validate();
  },

  setData: (data) => {
    get().pushHistory('Set data');
    set({ data });
    get().validate();
  },

  importJSON: (json) => {
    get().pushHistory('Import JSON');
    set({ data: json });
    get().validate();
  },

  updateValue: (path, value) => {
    const { data } = get();
    get().pushHistory(`Update ${pathToString(path)}`);
    const newData = setValueAtPath(data, path, value);
    set({ data: newData });
    get().validate();
  },

  addArrayItem: (path, value) => {
    let { data } = get();
    const { schema, schemaContext } = get();
    let array = getValueAtPath(data, path);
    
    // If the array doesn't exist, try to initialize it
    if (array === undefined || array === null) {
      // Create the array at the path
      data = setValueAtPath(data, path, []);
      array = [];
    }
    
    if (!Array.isArray(array)) {
      console.warn('Cannot add item: target is not an array', path);
      return;
    }

    // Generate default value for new item if not provided
    let newValue = value;
    if (newValue === undefined && schema && schemaContext) {
      // Get the schema for this array's items
      let currentSchema = schema;
      for (const segment of path) {
        if (typeof segment === 'number') {
          // Array index - get items schema
          if (currentSchema.items && !Array.isArray(currentSchema.items)) {
            currentSchema = currentSchema.items;
          }
        } else {
          // Object property
          if (currentSchema.properties?.[segment]) {
            currentSchema = currentSchema.properties[segment];
          }
        }
      }
      
      if (currentSchema.items && !Array.isArray(currentSchema.items)) {
        newValue = generateDefaultValue(currentSchema.items, schemaContext);
      } else {
        newValue = null;
      }
    }

    get().pushHistory(`Add item to ${pathToString(path)}`);
    const newArray = [...array, newValue];
    const newData = setValueAtPath(data, path, newArray);
    set({ data: newData });
    get().validate();
  },

  removeArrayItem: (path, index) => {
    const { data } = get();
    const array = getValueAtPath(data, path);
    
    if (!Array.isArray(array)) {
      return;
    }

    get().pushHistory(`Remove item ${index} from ${pathToString(path)}`);
    const newArray = array.filter((_, i) => i !== index);
    const newData = setValueAtPath(data, path, newArray);
    set({ data: newData });
    get().validate();
  },

  moveArrayItem: (path, fromIndex, toIndex) => {
    const { data } = get();
    const array = getValueAtPath(data, path);
    
    if (!Array.isArray(array)) {
      console.warn('Cannot move item: target is not an array', path);
      return;
    }
    
    if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex > array.length) {
      console.warn('Invalid indices for move', { fromIndex, toIndex, length: array.length });
      return;
    }
    
    if (fromIndex === toIndex) {
      return; // No change needed
    }

    get().pushHistory(`Move item from ${fromIndex} to ${toIndex} in ${pathToString(path)}`);
    
    const newArray = [...array];
    const [item] = newArray.splice(fromIndex, 1);
    // Adjust toIndex if we removed an item before it
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    newArray.splice(adjustedToIndex, 0, item);
    
    const newData = setValueAtPath(data, path, newArray);
    set({ data: newData });
    get().validate();
  },

  moveItemBetweenArrays: (sourcePath, sourceIndex, targetPath, targetIndex) => {
    const { data } = get();
    const sourceArray = getValueAtPath(data, sourcePath);
    const targetArray = getValueAtPath(data, targetPath);
    
    if (!Array.isArray(sourceArray)) {
      console.warn('Cannot move item: source is not an array', sourcePath);
      return;
    }
    
    if (!Array.isArray(targetArray)) {
      console.warn('Cannot move item: target is not an array', targetPath);
      return;
    }
    
    if (sourceIndex < 0 || sourceIndex >= sourceArray.length) {
      console.warn('Invalid source index', { sourceIndex, length: sourceArray.length });
      return;
    }
    
    if (targetIndex < 0 || targetIndex > targetArray.length) {
      console.warn('Invalid target index', { targetIndex, length: targetArray.length });
      return;
    }

    get().pushHistory(`Move item from ${pathToString(sourcePath)}[${sourceIndex}] to ${pathToString(targetPath)}[${targetIndex}]`);
    
    // Get the item to move
    const item = sourceArray[sourceIndex];
    
    // Remove from source
    const newSourceArray = sourceArray.filter((_, i) => i !== sourceIndex);
    let newData = setValueAtPath(data, sourcePath, newSourceArray);
    
    // Get updated target array (in case source and target overlap in the data structure)
    const updatedTargetArray = getValueAtPath(newData, targetPath);
    if (!Array.isArray(updatedTargetArray)) {
      console.warn('Target array no longer exists after removing from source');
      return;
    }
    
    // Insert into target
    const newTargetArray = [...updatedTargetArray];
    newTargetArray.splice(targetIndex, 0, item);
    newData = setValueAtPath(newData, targetPath, newTargetArray);
    
    set({ data: newData });
    get().validate();
  },

  addObjectProperty: (path, key, value) => {
    const { data, schema, schemaContext } = get();
    
    // Generate default value if not provided
    let newValue = value;
    if (newValue === undefined && schema && schemaContext) {
      // Try to find the schema for this property
      let currentSchema = schema;
      for (const segment of path) {
        if (typeof segment === 'number') {
          if (currentSchema.items && !Array.isArray(currentSchema.items)) {
            currentSchema = currentSchema.items;
          }
        } else {
          if (currentSchema.properties?.[segment]) {
            currentSchema = currentSchema.properties[segment];
          }
        }
      }
      
      // Check if additionalProperties has a schema
      if (typeof currentSchema.additionalProperties === 'object') {
        newValue = generateDefaultValue(currentSchema.additionalProperties, schemaContext);
      } else {
        newValue = null;
      }
    }

    get().pushHistory(`Add property "${key}" to ${pathToString(path)}`);
    const newData = setValueAtPath(data, [...path, key], newValue);
    set({ data: newData });
    get().validate();
  },

  removeObjectProperty: (path, key) => {
    const { data } = get();
    get().pushHistory(`Remove property "${key}" from ${pathToString(path)}`);
    const newData = deleteValueAtPath(data, [...path, key]);
    set({ data: newData });
    get().validate();
  },

  toggleExpanded: (path) => {
    const { expandedPaths } = get();
    const newExpanded = new Set(expandedPaths);
    
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    
    set({ expandedPaths: newExpanded });
  },

  expandPaths: (paths: string[]) => {
    const { expandedPaths } = get();
    const newExpanded = new Set(expandedPaths);
    
    for (const path of paths) {
      newExpanded.add(path);
    }
    
    set({ expandedPaths: newExpanded });
  },

  expandAll: () => {
    // Collect all paths that can be expanded
    // Path format: 'root' for root, 'propName' for first level, 'propName.nested' for nested
    // Array indices: 'children[0]', 'children[0].nested'
    const { data } = get();
    const paths = new Set<string>(['root']);
    
    const collectPaths = (value: unknown, pathSegments: (string | number)[]) => {
      if (Array.isArray(value)) {
        if (pathSegments.length > 0) {
          paths.add(pathToString(pathSegments));
        }
        value.forEach((item, index) => {
          collectPaths(item, [...pathSegments, index]);
        });
      } else if (typeof value === 'object' && value !== null) {
        if (pathSegments.length > 0) {
          paths.add(pathToString(pathSegments));
        }
        for (const key of Object.keys(value)) {
          collectPaths((value as Record<string, unknown>)[key], [...pathSegments, key]);
        }
      }
    };
    
    collectPaths(data, []);
    set({ expandedPaths: paths });
  },

  collapseAll: () => {
    set({ expandedPaths: new Set(['root']) });
  },

  expandErrorPaths: () => {
    const { errors } = get();
    const pathsToExpand = new Set<string>(['root']);
    
    // Convert error paths to UI paths and include all parent paths
    // UI path format: 'root' for root, 'children' for first level, 'children[0].type' for nested
    for (const errorPath of errors.keys()) {
      // errorPath is like "/children/0/type" or "/id" or "/"
      
      if (errorPath === '/' || errorPath === '' || errorPath === 'root') {
        pathsToExpand.add('root');
        continue;
      }
      
      // Parse the error path - segments don't include 'root'
      const segments = errorPath.split('/').filter(Boolean);
      let currentPath = '';
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        // Check if segment is a number (array index)
        if (/^\d+$/.test(segment)) {
          currentPath = `${currentPath}[${segment}]`;
        } else if (i === 0) {
          currentPath = segment;
        } else {
          currentPath = `${currentPath}.${segment}`;
        }
        pathsToExpand.add(currentPath);
      }
    }
    
    set({ expandedPaths: pathsToExpand });
  },

  setSelectedPath: (path) => {
    set({ selectedPath: path });
  },

  setEditingPath: (path) => {
    set({ editingPath: path });
  },

  toggleDarkMode: () => {
    const { isDarkMode } = get();
    set({ isDarkMode: !isDarkMode });
  },

  validate: () => {
    const { schema, data } = get();

    if (!schema) {
      set({ errors: new Map(), isValid: true });
      return;
    }

    console.log('[EditorStore] Validating data:', JSON.stringify(data, null, 2).substring(0, 500));
    const validate = ajv.compile(schema);
    const valid = validate(data);
    console.log('[EditorStore] Validation result:', valid);
    console.log('[EditorStore] AJV errors:', validate.errors);

    // Use better-ajv-errors for enhanced error reporting
    if (!valid && validate.errors) {
      const betterErrors = betterAjvErrors(schema, data, validate.errors, {
        format: 'js',
        indent: 2,
      });
      console.log('[EditorStore] Better AJV Errors:');
      console.log(betterErrors);
    }

    const errors = new Map<string, ValidationError[]>();

    if (!valid && validate.errors) {
      // Filter out cascade errors from oneOf/anyOf schema branching
      // Only show actual validation failures, not "didn't match this branch" errors
      const seenErrors = new Set<string>();

      for (const error of validate.errors) {
        // Skip cascade errors from schema branching - these are noise
        // Only show the actual validation failures (additionalProperties, enum, type, etc.)
        if (error.keyword === 'oneOf' || error.keyword === 'anyOf' || error.keyword === 'not' || error.keyword === 'const') {
          continue; // Skip these - they're just saying "didn't match this branch"
        }

        const path = error.instancePath || 'root';
        const message = error.message || 'Validation error';
        const errorKey = `${path}:${message}`;

        // Skip if we've already seen this exact error
        if (seenErrors.has(errorKey)) {
          continue;
        }

        seenErrors.add(errorKey);

        const existing = errors.get(path) || [];
        existing.push({
          path,
          message,
          keyword: error.keyword,
        });
        errors.set(path, existing);
      }
    }
    
    set({ errors, isValid: valid ?? true });
  },

  resetData: () => {
    const { schema, schemaContext } = get();
    
    if (schema && schemaContext) {
      get().pushHistory('Reset data');
      const defaultData = generateDefaultValue(schema, schemaContext);
      set({ data: defaultData });
      get().validate();
    }
  },

  // Undo/Redo Implementation
  pushHistory: (description) => {
    const { data, history, historyIndex } = get();
    
    // Create a deep copy of the current data
    const entry: HistoryEntry = {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      description,
    };
    
    // If we're not at the end of history (user did some undos), 
    // truncate the future history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex <= 0) {
      return; // Nothing to undo
    }
    
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    
    if (entry) {
      set({
        data: JSON.parse(JSON.stringify(entry.data)),
        historyIndex: newIndex,
      });
      get().validate();
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex >= history.length - 1) {
      return; // Nothing to redo
    }
    
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    
    if (entry) {
      set({
        data: JSON.parse(JSON.stringify(entry.data)),
        historyIndex: newIndex,
      });
      get().validate();
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  clearHistory: () => {
    const { data } = get();
    set({
      history: [{
        data: JSON.parse(JSON.stringify(data)),
        timestamp: Date.now(),
        description: 'Initial state',
      }],
      historyIndex: 0,
    });
  },
    }),
    {
      name: 'schema-editor-session',
      version: 2, // Bump version to force migration
      storage: {
        getItem: safeStorage.getItem,
        setItem: safeStorage.setItem,
        removeItem: safeStorage.removeItem,
      },
      partialize: (state) => ({
        // Persist schema and data
        schema: state.schema,
        data: state.data,
        // Persist UI state
        expandedPaths: Array.from(state.expandedPaths), // Convert Set to Array
        selectedPath: state.selectedPath,
        isDarkMode: state.isDarkMode,
        // Don't persist history - it's too large and causes quota issues
        // Users can undo/redo within a session but not across sessions
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert expandedPaths array back to Set
          if (Array.isArray(state.expandedPaths)) {
            state.expandedPaths = new Set(state.expandedPaths);
          }
          // Rebuild schemaContext from schema
          if (state.schema) {
            state.schemaContext = createSchemaContext(state.schema);
          }
          // Initialize empty history on rehydrate
          state.history = state.data ? [{
            data: JSON.parse(JSON.stringify(state.data)),
            timestamp: Date.now(),
            description: 'Session restored',
          }] : [];
          state.historyIndex = state.history.length > 0 ? 0 : -1;
          // Revalidate to rebuild errors Map
          setTimeout(() => {
            state.validate();
          }, 0);
        }
      },
    }
  )
);
