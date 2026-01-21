import { useEffect, useCallback } from 'react';

type Tool = 'select' | 'hand';

interface UseKeyboardShortcutsOptions {
  // Tool switching
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  
  // Selection
  selectedPath: string | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onSelectAll: () => void;
  onEscape: () => void;
  
  // Grouping
  onGroup: () => void;
  onUngroup: () => void;
  
  // Z-order
  onBringForward: () => void;
  onSendBackward: () => void;
  
  // Undo/Redo
  onUndo: () => void;
  onRedo: () => void;
  
  // Zoom
  onZoom100: () => void;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
  
  // Enabled state
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    currentTool,
    onToolChange,
    selectedPath,
    onDelete,
    onDuplicate,
    onCopy,
    onPaste,
    onCut,
    onSelectAll,
    onEscape,
    onGroup,
    onUngroup,
    onBringForward,
    onSendBackward,
    onUndo,
    onRedo,
    onZoom100,
    onZoomToFit,
    onZoomToSelection,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't handle shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMeta = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    // Tool shortcuts (single keys)
    if (!isMeta && !isShift) {
      switch (e.key.toLowerCase()) {
        case 'v':
          onToolChange('select');
          e.preventDefault();
          return;
        case 'h':
          onToolChange('hand');
          e.preventDefault();
          return;
        case 'escape':
          onEscape();
          e.preventDefault();
          return;
        case 'delete':
        case 'backspace':
          if (selectedPath) {
            onDelete();
            e.preventDefault();
          }
          return;
      }
    }

    // Meta/Ctrl shortcuts
    if (isMeta) {
      switch (e.key.toLowerCase()) {
        case 'c':
          if (selectedPath) {
            onCopy();
            e.preventDefault();
          }
          return;
        case 'v':
          onPaste();
          e.preventDefault();
          return;
        case 'x':
          if (selectedPath) {
            onCut();
            e.preventDefault();
          }
          return;
        case 'd':
          if (selectedPath) {
            onDuplicate();
            e.preventDefault();
          }
          return;
        case 'a':
          onSelectAll();
          e.preventDefault();
          return;
        case 'g':
          if (isShift) {
            onUngroup();
          } else {
            onGroup();
          }
          e.preventDefault();
          return;
        case ']':
          if (selectedPath) {
            onBringForward();
            e.preventDefault();
          }
          return;
        case '[':
          if (selectedPath) {
            onSendBackward();
            e.preventDefault();
          }
          return;
        case 'z':
          if (isShift) {
            onRedo();
          } else {
            onUndo();
          }
          e.preventDefault();
          return;
        case '0':
          onZoom100();
          e.preventDefault();
          return;
        case '1':
          onZoomToFit();
          e.preventDefault();
          return;
        case '2':
          onZoomToSelection();
          e.preventDefault();
          return;
      }
    }
  }, [
    enabled,
    currentTool,
    selectedPath,
    onToolChange,
    onDelete,
    onDuplicate,
    onCopy,
    onPaste,
    onCut,
    onSelectAll,
    onEscape,
    onGroup,
    onUngroup,
    onBringForward,
    onSendBackward,
    onUndo,
    onRedo,
    onZoom100,
    onZoomToFit,
    onZoomToSelection,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    currentTool,
  };
}
