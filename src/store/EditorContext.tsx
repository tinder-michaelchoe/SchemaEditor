/**
 * EditorContext
 *
 * React Context + useReducer replacement for the Zustand editorStore.
 * Provides EditorProvider, useEditorState(), useEditorActions(), and useEditor().
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { JSONSchema, SchemaContext, ValidationError } from '../types/schema';
import { createSchemaContext } from '../utils/schemaUtils';
import { generateDefaultValue } from '../utils/defaultValue';
import {
  getValueAtPath,
  setValueAtPath,
  deleteValueAtPath,
  pathToString,
} from '../utils/pathUtils';
import { editorStoreRef } from './storeRefs';
import {
  EDITOR_STORAGE_KEY,
  serializeEditorState,
  createRehydratedEditorState,
  validateData,
  safeSetItem,
} from './persistence';
import { slotManager } from '../core/SlotManager';

// ─── History ─────────────────────────────────────────────────────────────────

interface HistoryEntry {
  data: unknown;
  timestamp: number;
  description: string;
}

const MAX_HISTORY_SIZE = 100;

// ─── State type ──────────────────────────────────────────────────────────────

export interface EditorState {
  schema: JSONSchema | null;
  schemaContext: SchemaContext | null;
  data: unknown;
  errors: Map<string, ValidationError[]>;
  isValid: boolean;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  editingPath: string | null;
  isDarkMode: boolean;
  history: HistoryEntry[];
  historyIndex: number;
}

// ─── Actions type ────────────────────────────────────────────────────────────

export interface EditorActions {
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
    targetIndex: number,
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
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (description: string) => void;
  clearHistory: () => void;
}

// ─── Reducer actions ─────────────────────────────────────────────────────────

type EditorAction =
  | { type: 'SET_SCHEMA'; schema: JSONSchema; schemaContext: SchemaContext; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean }
  | { type: 'SET_DATA'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'IMPORT_JSON'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'UPDATE_VALUE'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'ADD_ARRAY_ITEM'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'REMOVE_ARRAY_ITEM'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'MOVE_ARRAY_ITEM'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'MOVE_ITEM_BETWEEN_ARRAYS'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'ADD_OBJECT_PROPERTY'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'REMOVE_OBJECT_PROPERTY'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'TOGGLE_EXPANDED'; expandedPaths: Set<string> }
  | { type: 'EXPAND_PATHS'; expandedPaths: Set<string> }
  | { type: 'EXPAND_ALL'; expandedPaths: Set<string> }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'EXPAND_ERROR_PATHS'; expandedPaths: Set<string> }
  | { type: 'SET_SELECTED_PATH'; selectedPath: string | null }
  | { type: 'SET_EDITING_PATH'; editingPath: string | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'VALIDATE'; errors: Map<string, ValidationError[]>; isValid: boolean }
  | { type: 'RESET_DATA'; data: unknown; errors: Map<string, ValidationError[]>; isValid: boolean; history: HistoryEntry[]; historyIndex: number }
  | { type: 'UNDO'; data: unknown; historyIndex: number; errors: Map<string, ValidationError[]>; isValid: boolean }
  | { type: 'REDO'; data: unknown; historyIndex: number; errors: Map<string, ValidationError[]>; isValid: boolean }
  | { type: 'CLEAR_HISTORY'; history: HistoryEntry[]; historyIndex: number };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_SCHEMA':
      return {
        ...state,
        schema: action.schema,
        schemaContext: action.schemaContext,
        data: action.data,
        errors: action.errors,
        isValid: action.isValid,
        expandedPaths: new Set(['root']),
        history: [{
          data: JSON.parse(JSON.stringify(action.data)),
          timestamp: Date.now(),
          description: 'Initial state',
        }],
        historyIndex: 0,
      };

    case 'SET_DATA':
    case 'IMPORT_JSON':
    case 'UPDATE_VALUE':
    case 'ADD_ARRAY_ITEM':
    case 'REMOVE_ARRAY_ITEM':
    case 'MOVE_ARRAY_ITEM':
    case 'MOVE_ITEM_BETWEEN_ARRAYS':
    case 'ADD_OBJECT_PROPERTY':
    case 'REMOVE_OBJECT_PROPERTY':
    case 'RESET_DATA':
      return {
        ...state,
        data: action.data,
        errors: action.errors,
        isValid: action.isValid,
        history: action.history,
        historyIndex: action.historyIndex,
      };

    case 'TOGGLE_EXPANDED':
    case 'EXPAND_PATHS':
    case 'EXPAND_ALL':
    case 'EXPAND_ERROR_PATHS':
      return { ...state, expandedPaths: action.expandedPaths };

    case 'COLLAPSE_ALL':
      return { ...state, expandedPaths: new Set(['root']) };

    case 'SET_SELECTED_PATH':
      return { ...state, selectedPath: action.selectedPath };

    case 'SET_EDITING_PATH':
      return { ...state, editingPath: action.editingPath };

    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };

    case 'VALIDATE':
      return { ...state, errors: action.errors, isValid: action.isValid };

    case 'UNDO':
    case 'REDO':
      return {
        ...state,
        data: action.data,
        historyIndex: action.historyIndex,
        errors: action.errors,
        isValid: action.isValid,
      };

    case 'CLEAR_HISTORY':
      return { ...state, history: action.history, historyIndex: action.historyIndex };

    default:
      return state;
  }
}

// ─── Default state ───────────────────────────────────────────────────────────

const DEFAULT_EDITOR_STATE: EditorState = {
  schema: null,
  schemaContext: null,
  data: null,
  errors: new Map(),
  isValid: true,
  expandedPaths: new Set(['root']),
  selectedPath: null,
  editingPath: null,
  isDarkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  history: [],
  historyIndex: -1,
};

// ─── Contexts ────────────────────────────────────────────────────────────────

const EditorStateContext = createContext<EditorState | null>(null);
const EditorActionsContext = createContext<EditorActions | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function EditorProvider({ children }: { children: ReactNode }) {
  const initialState = useMemo(() => createRehydratedEditorState(DEFAULT_EDITOR_STATE), []);
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Ref that always points to the current state (for actions that read state)
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Helper: push history + compute new data + validate ──

  const pushHistoryAndValidate = useCallback(
    (
      description: string,
      computeNewData: (currentState: EditorState) => unknown,
    ): {
      data: unknown;
      errors: Map<string, ValidationError[]>;
      isValid: boolean;
      history: HistoryEntry[];
      historyIndex: number;
    } => {
      const s = stateRef.current;

      // Push current data onto history
      const entry: HistoryEntry = {
        data: JSON.parse(JSON.stringify(s.data)),
        timestamp: Date.now(),
        description,
      };
      let newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY_SIZE) newHistory.shift();

      const newData = computeNewData(s);
      const errors = validateData(s.schema, newData);

      return {
        data: newData,
        errors,
        isValid: errors.size === 0,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    },
    [],
  );

  // ── Actions (stable identity via useMemo over dispatch) ──

  const actions: EditorActions = useMemo(() => ({
    setSchema: (schema: JSONSchema) => {
      const schemaContext = createSchemaContext(schema);
      const defaultData = generateDefaultValue(schema, schemaContext);
      const errors = validateData(schema, defaultData);
      dispatch({
        type: 'SET_SCHEMA',
        schema,
        schemaContext,
        data: defaultData,
        errors,
        isValid: errors.size === 0,
      });
    },

    setData: (data: unknown) => {
      const s = stateRef.current;
      const entry: HistoryEntry = {
        data: JSON.parse(JSON.stringify(s.data)),
        timestamp: Date.now(),
        description: 'Set data',
      };
      let newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > MAX_HISTORY_SIZE) newHistory.shift();
      const errors = validateData(s.schema, data);
      dispatch({
        type: 'SET_DATA',
        data,
        errors,
        isValid: errors.size === 0,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    importJSON: (json: unknown) => {
      const result = pushHistoryAndValidate('Import JSON', () => json);
      dispatch({ type: 'IMPORT_JSON', ...result });
    },

    updateValue: (path, value) => {
      const result = pushHistoryAndValidate(`Update ${pathToString(path)}`, (s) =>
        setValueAtPath(s.data, path, value),
      );
      dispatch({ type: 'UPDATE_VALUE', ...result });
    },

    addArrayItem: (path, value) => {
      const s = stateRef.current;
      let currentData = s.data;
      let array = getValueAtPath(currentData, path);

      if (array === undefined || array === null) {
        currentData = setValueAtPath(currentData, path, []);
        array = [];
      }

      if (!Array.isArray(array)) {
        console.warn('Cannot add item: target is not an array', path);
        return;
      }

      let newValue = value;
      if (newValue === undefined && s.schema && s.schemaContext) {
        let currentSchema = s.schema;
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
        if (currentSchema.items && !Array.isArray(currentSchema.items)) {
          newValue = generateDefaultValue(currentSchema.items, s.schemaContext);
        } else {
          newValue = null;
        }
      }

      const result = pushHistoryAndValidate(`Add item to ${pathToString(path)}`, () => {
        const arr = getValueAtPath(currentData, path);
        const newArray = [...(Array.isArray(arr) ? arr : []), newValue];
        return setValueAtPath(currentData, path, newArray);
      });
      dispatch({ type: 'ADD_ARRAY_ITEM', ...result });
    },

    removeArrayItem: (path, index) => {
      const s = stateRef.current;
      const array = getValueAtPath(s.data, path);
      if (!Array.isArray(array)) return;

      const result = pushHistoryAndValidate(`Remove item ${index} from ${pathToString(path)}`, (st) => {
        const arr = getValueAtPath(st.data, path) as unknown[];
        const newArray = arr.filter((_, i) => i !== index);
        return setValueAtPath(st.data, path, newArray);
      });
      dispatch({ type: 'REMOVE_ARRAY_ITEM', ...result });
    },

    moveArrayItem: (path, fromIndex, toIndex) => {
      const s = stateRef.current;
      const array = getValueAtPath(s.data, path);
      if (!Array.isArray(array)) return;
      if (fromIndex < 0 || fromIndex >= array.length || toIndex < 0 || toIndex > array.length) return;
      if (fromIndex === toIndex) return;

      const result = pushHistoryAndValidate(
        `Move item from ${fromIndex} to ${toIndex} in ${pathToString(path)}`,
        (st) => {
          const arr = [...(getValueAtPath(st.data, path) as unknown[])];
          const [item] = arr.splice(fromIndex, 1);
          const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
          arr.splice(adjustedToIndex, 0, item);
          return setValueAtPath(st.data, path, arr);
        },
      );
      dispatch({ type: 'MOVE_ARRAY_ITEM', ...result });
    },

    moveItemBetweenArrays: (sourcePath, sourceIndex, targetPath, targetIndex) => {
      const s = stateRef.current;
      const sourceArray = getValueAtPath(s.data, sourcePath);
      const targetArray = getValueAtPath(s.data, targetPath);
      if (!Array.isArray(sourceArray) || !Array.isArray(targetArray)) return;
      if (sourceIndex < 0 || sourceIndex >= sourceArray.length) return;
      if (targetIndex < 0 || targetIndex > targetArray.length) return;

      const result = pushHistoryAndValidate(
        `Move item from ${pathToString(sourcePath)}[${sourceIndex}] to ${pathToString(targetPath)}[${targetIndex}]`,
        (st) => {
          const srcArr = getValueAtPath(st.data, sourcePath) as unknown[];
          const item = srcArr[sourceIndex];

          // Handle descendant path adjustments
          let adjustedTargetPath = [...targetPath];
          let isTargetDescendantOfSource = true;
          for (let i = 0; i < sourcePath.length; i++) {
            if (targetPath[i] !== sourcePath[i]) {
              isTargetDescendantOfSource = false;
              break;
            }
          }
          if (isTargetDescendantOfSource && sourcePath.length < targetPath.length) {
            const indexPositionInTarget = sourcePath.length;
            const indexInTarget = targetPath[indexPositionInTarget];
            if (typeof indexInTarget === 'number' && indexInTarget > sourceIndex) {
              adjustedTargetPath = [...targetPath];
              adjustedTargetPath[indexPositionInTarget] = indexInTarget - 1;
            }
          }

          // Remove from source
          const newSourceArray = srcArr.filter((_, i) => i !== sourceIndex);
          let newData = setValueAtPath(st.data, sourcePath, newSourceArray);

          // Get updated target array
          const updatedTargetArray = getValueAtPath(newData, adjustedTargetPath);
          if (!Array.isArray(updatedTargetArray)) return st.data;

          const newTargetArray = [...updatedTargetArray];
          newTargetArray.splice(targetIndex, 0, item);
          newData = setValueAtPath(newData, adjustedTargetPath, newTargetArray);
          return newData;
        },
      );
      dispatch({ type: 'MOVE_ITEM_BETWEEN_ARRAYS', ...result });
    },

    addObjectProperty: (path, key, value) => {
      const s = stateRef.current;
      let newValue = value;
      if (newValue === undefined && s.schema && s.schemaContext) {
        let currentSchema = s.schema;
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
        if (typeof currentSchema.additionalProperties === 'object') {
          newValue = generateDefaultValue(currentSchema.additionalProperties, s.schemaContext);
        } else {
          newValue = null;
        }
      }

      const result = pushHistoryAndValidate(`Add property "${key}" to ${pathToString(path)}`, (st) =>
        setValueAtPath(st.data, [...path, key], newValue),
      );
      dispatch({ type: 'ADD_OBJECT_PROPERTY', ...result });
    },

    removeObjectProperty: (path, key) => {
      const result = pushHistoryAndValidate(`Remove property "${key}" from ${pathToString(path)}`, (st) =>
        deleteValueAtPath(st.data, [...path, key]),
      );
      dispatch({ type: 'REMOVE_OBJECT_PROPERTY', ...result });
    },

    toggleExpanded: (path: string) => {
      const s = stateRef.current;
      const newExpanded = new Set(s.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      dispatch({ type: 'TOGGLE_EXPANDED', expandedPaths: newExpanded });
    },

    expandPaths: (paths: string[]) => {
      const s = stateRef.current;
      const newExpanded = new Set(s.expandedPaths);
      for (const path of paths) newExpanded.add(path);
      dispatch({ type: 'EXPAND_PATHS', expandedPaths: newExpanded });
    },

    expandAll: () => {
      const s = stateRef.current;
      const paths = new Set<string>(['root']);
      const collectPaths = (value: unknown, pathSegments: (string | number)[]) => {
        if (Array.isArray(value)) {
          if (pathSegments.length > 0) paths.add(pathToString(pathSegments));
          value.forEach((item, index) => collectPaths(item, [...pathSegments, index]));
        } else if (typeof value === 'object' && value !== null) {
          if (pathSegments.length > 0) paths.add(pathToString(pathSegments));
          for (const key of Object.keys(value)) {
            collectPaths((value as Record<string, unknown>)[key], [...pathSegments, key]);
          }
        }
      };
      collectPaths(s.data, []);
      dispatch({ type: 'EXPAND_ALL', expandedPaths: paths });
    },

    collapseAll: () => {
      dispatch({ type: 'COLLAPSE_ALL' });
    },

    expandErrorPaths: () => {
      const s = stateRef.current;
      const pathsToExpand = new Set<string>(['root']);
      for (const errorPath of s.errors.keys()) {
        if (errorPath === '/' || errorPath === '' || errorPath === 'root') {
          pathsToExpand.add('root');
          continue;
        }
        const segments = errorPath.split('/').filter(Boolean);
        let currentPath = '';
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
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
      dispatch({ type: 'EXPAND_ERROR_PATHS', expandedPaths: pathsToExpand });
    },

    setSelectedPath: (path) => dispatch({ type: 'SET_SELECTED_PATH', selectedPath: path }),
    setEditingPath: (path) => dispatch({ type: 'SET_EDITING_PATH', editingPath: path }),

    toggleDarkMode: () => dispatch({ type: 'TOGGLE_DARK_MODE' }),

    validate: () => {
      const s = stateRef.current;
      const errors = validateData(s.schema, s.data);
      dispatch({ type: 'VALIDATE', errors, isValid: errors.size === 0 });
    },

    resetData: () => {
      const s = stateRef.current;
      if (!s.schema || !s.schemaContext) return;
      const defaultData = generateDefaultValue(s.schema, s.schemaContext);
      const result = pushHistoryAndValidate('Reset data', () => defaultData);
      dispatch({ type: 'RESET_DATA', ...result });
    },

    undo: () => {
      const s = stateRef.current;
      if (s.historyIndex <= 0) return;
      const newIndex = s.historyIndex - 1;
      const entry = s.history[newIndex];
      if (!entry) return;
      const data = JSON.parse(JSON.stringify(entry.data));
      const errors = validateData(s.schema, data);
      dispatch({ type: 'UNDO', data, historyIndex: newIndex, errors, isValid: errors.size === 0 });
    },

    redo: () => {
      const s = stateRef.current;
      if (s.historyIndex >= s.history.length - 1) return;
      const newIndex = s.historyIndex + 1;
      const entry = s.history[newIndex];
      if (!entry) return;
      const data = JSON.parse(JSON.stringify(entry.data));
      const errors = validateData(s.schema, data);
      dispatch({ type: 'REDO', data, historyIndex: newIndex, errors, isValid: errors.size === 0 });
    },

    canUndo: () => stateRef.current.historyIndex > 0,
    canRedo: () => stateRef.current.historyIndex < stateRef.current.history.length - 1,

    pushHistory: (description: string) => {
      // No-op: history is managed internally by mutating actions
      // This exists for API compatibility
    },

    clearHistory: () => {
      const s = stateRef.current;
      dispatch({
        type: 'CLEAR_HISTORY',
        history: [{
          data: JSON.parse(JSON.stringify(s.data)),
          timestamp: Date.now(),
          description: 'Initial state',
        }],
        historyIndex: 0,
      });
    },
  }), [dispatch, pushHistoryAndValidate]);

  // ── Sync storeRef for imperative access ──

  useEffect(() => {
    editorStoreRef.current = { ...state, ...actions };
  });

  // ── Persist to localStorage on relevant state changes ──

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      safeSetItem(
        EDITOR_STORAGE_KEY,
        serializeEditorState({
          schema: state.schema,
          data: state.data,
          expandedPaths: state.expandedPaths,
          selectedPath: state.selectedPath,
          isDarkMode: state.isDarkMode,
        }),
      );
    }, 300);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [state.schema, state.data, state.expandedPaths, state.selectedPath, state.isDarkMode]);

  // ── Update SlotManager context when relevant slices change ──

  const slotRelevantState = useMemo(
    () => ({
      hasDocument: state.schema !== null,
      hasSelection: state.selectedPath !== null,
      isDarkMode: state.isDarkMode,
      selectedPath: state.selectedPath,
      hasErrors: state.errors.size > 0,
    }),
    [state.schema, state.selectedPath, state.isDarkMode, state.errors],
  );

  useEffect(() => {
    slotManager.updateContext(slotRelevantState);
  }, [slotRelevantState]);

  return (
    <EditorStateContext.Provider value={state}>
      <EditorActionsContext.Provider value={actions}>
        {children}
      </EditorActionsContext.Provider>
    </EditorStateContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useEditorState(): EditorState {
  const ctx = useContext(EditorStateContext);
  if (!ctx) throw new Error('useEditorState must be used within an EditorProvider');
  return ctx;
}

export function useEditorActions(): EditorActions {
  const ctx = useContext(EditorActionsContext);
  if (!ctx) throw new Error('useEditorActions must be used within an EditorProvider');
  return ctx;
}

/** Convenience hook returning both state and actions (matches old useEditorStore API) */
export function useEditor(): EditorState & EditorActions {
  const state = useEditorState();
  const actions = useEditorActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
