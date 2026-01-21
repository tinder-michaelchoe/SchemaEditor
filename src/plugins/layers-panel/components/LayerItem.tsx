import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Image,
  Layers,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Layers2,
  MousePointer,
  TextCursorInput,
  ToggleLeft,
  SlidersHorizontal,
  Minus,
  Space,
  Repeat,
  GripVertical,
  Square,
} from 'lucide-react';

interface LayerItemProps {
  node: Record<string, unknown>;
  path: string;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onToggleVisibility: (path: string, visible: boolean) => void;
  onToggleLock: (path: string, locked: boolean) => void;
  onRename: (path: string, name: string) => void;
  onDragStart?: (e: React.DragEvent, path: string) => void;
  onDragOver?: (e: React.DragEvent, path: string) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent, path: string) => void;
}

// Map component types to icons
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vstack: AlignVerticalJustifyCenter,
  hstack: AlignHorizontalJustifyCenter,
  zstack: Layers2,
  sectionLayout: Layers,
  label: Type,
  image: Image,
  button: MousePointer,
  textfield: TextCursorInput,
  toggle: ToggleLeft,
  slider: SlidersHorizontal,
  divider: Minus,
  spacer: Space,
  forEach: Repeat,
  gradient: Square,
};

// Container types that can have children
const CONTAINER_TYPES = ['vstack', 'hstack', 'zstack', 'sectionLayout', 'forEach'];

export function LayerItem({
  node,
  path,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: LayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nodeType = (node.type as string) || 'unknown';
  const nodeName = (node._name as string) || nodeType;
  const isVisible = node._visible !== false; // Default to true
  const isLocked = node._locked === true; // Default to false
  const isContainer = CONTAINER_TYPES.includes(nodeType);

  const Icon = TYPE_ICONS[nodeType] || Square;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      onSelect(path);
    }
  }, [path, isLocked, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      setEditName(nodeName);
      setIsEditing(true);
    }
  }, [nodeName, isLocked]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(path);
  }, [path, onToggleExpand]);

  const handleVisibilityClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(path, !isVisible);
  }, [path, isVisible, onToggleVisibility]);

  const handleLockClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(path, !isLocked);
  }, [path, isLocked, onToggleLock]);

  const handleNameSubmit = useCallback(() => {
    if (editName.trim() && editName !== nodeName) {
      onRename(path, editName.trim());
    }
    setIsEditing(false);
  }, [editName, nodeName, path, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [handleNameSubmit]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    onDragStart?.(e, path);
  }, [path, isLocked, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver?.(e, path);
  }, [path, onDragOver]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragOver(false);
    onDragEnd?.();
  }, [onDragEnd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop?.(e, path);
  }, [path, onDrop]);

  return (
    <div
      className={`
        flex items-center gap-1 px-1 py-0.5 rounded text-sm cursor-pointer
        transition-colors duration-100
        ${isSelected 
          ? 'bg-[var(--accent-color)] text-white' 
          : 'hover:bg-[var(--bg-tertiary)]'
        }
        ${isDragOver ? 'ring-2 ring-[var(--accent-color)]' : ''}
        ${!isVisible ? 'opacity-50' : ''}
        ${isLocked ? 'cursor-not-allowed' : ''}
      `}
      style={{ paddingLeft: `${depth * 16 + 4}px` }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable={!isLocked}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      {/* Drag handle */}
      <GripVertical 
        className={`w-3 h-3 flex-shrink-0 ${
          isSelected ? 'text-white/60' : 'text-[var(--text-tertiary)]'
        } ${isLocked ? 'invisible' : ''}`}
      />

      {/* Expand/collapse chevron for containers */}
      {hasChildren ? (
        <button
          onClick={handleExpandClick}
          className={`p-0.5 rounded hover:bg-black/10 ${
            isSelected ? 'text-white' : 'text-[var(--text-secondary)]'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      ) : (
        <div className="w-4" /> // Spacer for alignment
      )}

      {/* Type icon */}
      <Icon 
        className={`w-4 h-4 flex-shrink-0 ${
          isSelected ? 'text-white' : 'text-[var(--text-secondary)]'
        }`} 
      />

      {/* Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 px-1 py-0 text-sm bg-white dark:bg-gray-800 
                     text-[var(--text-primary)] rounded border border-[var(--accent-color)]
                     focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span 
          className={`flex-1 min-w-0 truncate ${
            isSelected ? 'text-white' : 'text-[var(--text-primary)]'
          }`}
        >
          {nodeName}
        </span>
      )}

      {/* Visibility toggle */}
      <button
        onClick={handleVisibilityClick}
        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10
          ${isSelected ? 'opacity-100' : ''} 
          ${!isVisible ? 'opacity-100' : ''}
          transition-opacity`}
        title={isVisible ? 'Hide layer' : 'Show layer'}
      >
        {isVisible ? (
          <Eye className={`w-3.5 h-3.5 ${
            isSelected ? 'text-white/70' : 'text-[var(--text-tertiary)]'
          }`} />
        ) : (
          <EyeOff className={`w-3.5 h-3.5 ${
            isSelected ? 'text-white' : 'text-[var(--text-secondary)]'
          }`} />
        )}
      </button>

      {/* Lock toggle */}
      <button
        onClick={handleLockClick}
        className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10
          ${isSelected ? 'opacity-100' : ''} 
          ${isLocked ? 'opacity-100' : ''}
          transition-opacity`}
        title={isLocked ? 'Unlock layer' : 'Lock layer'}
      >
        {isLocked ? (
          <Lock className={`w-3.5 h-3.5 ${
            isSelected ? 'text-white' : 'text-orange-500'
          }`} />
        ) : (
          <Unlock className={`w-3.5 h-3.5 ${
            isSelected ? 'text-white/70' : 'text-[var(--text-tertiary)]'
          }`} />
        )}
      </button>
    </div>
  );
}
