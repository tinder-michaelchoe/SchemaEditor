import React, { useState, useMemo, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getValueAtPath, stringToPath } from '@/utils/pathUtils';
import { ChevronRight, Plus, Check, Palette, X, Pencil } from 'lucide-react';

interface StyleDefinition {
  inherits?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  textAlignment?: string;
  backgroundColor?: string;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  tintColor?: string;
  width?: number;
  height?: number;
  padding?: {
    top?: number;
    bottom?: number;
    leading?: number;
    trailing?: number;
    horizontal?: number;
    vertical?: number;
  };
}

const FONT_WEIGHTS = ['ultraLight', 'thin', 'light', 'regular', 'medium', 'semibold', 'bold', 'heavy', 'black'];
const TEXT_ALIGNMENTS = ['leading', 'center', 'trailing'];

export function StylesPanel() {
  const { data, selectedPath, updateValue } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyle, setNewStyle] = useState<StyleDefinition>({});
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [editingStyle, setEditingStyle] = useState<StyleDefinition>({});
  const [deletingStyleId, setDeletingStyleId] = useState<string | null>(null);

  // Get styles from document
  const styles = useMemo(() => {
    if (!data || typeof data !== 'object') return {};
    return (data as Record<string, unknown>).styles as Record<string, StyleDefinition> || {};
  }, [data]);

  // Get current component's styleId
  const currentStyleId = useMemo(() => {
    if (!selectedPath || !data) return null;
    const pathSegments = stringToPath(selectedPath);
    const value = getValueAtPath(data, pathSegments);
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>).styleId as string | undefined;
    }
    return null;
  }, [data, selectedPath]);

  // Apply style to selected component
  const handleApplyStyle = useCallback((styleId: string) => {
    if (!selectedPath) return;
    const pathSegments = stringToPath(selectedPath);
    updateValue([...pathSegments, 'styleId'], styleId);
  }, [selectedPath, updateValue]);

  // Remove style from selected component
  const handleRemoveStyle = useCallback(() => {
    if (!selectedPath) return;
    const pathSegments = stringToPath(selectedPath);
    updateValue([...pathSegments, 'styleId'], undefined);
  }, [selectedPath, updateValue]);

  // Create new style
  const handleCreateStyle = useCallback(() => {
    if (!newStyleName.trim()) return;
    
    const styleId = newStyleName.trim().replace(/\s+/g, '-').toLowerCase();
    
    // Add the new style to document styles
    const currentStyles = (data as Record<string, unknown>)?.styles || {};
    updateValue(['styles'], {
      ...currentStyles as object,
      [styleId]: newStyle,
    });

    // Reset form
    setNewStyleName('');
    setNewStyle({});
    setIsCreatingNew(false);
  }, [data, newStyleName, newStyle, updateValue]);

  // Confirm and delete a style
  const handleConfirmDelete = useCallback(() => {
    if (!deletingStyleId) return;

    const currentStyles = { ...(data as Record<string, unknown>)?.styles as object } || {};
    delete (currentStyles as Record<string, unknown>)[deletingStyleId];
    updateValue(['styles'], currentStyles);
    setDeletingStyleId(null);
  }, [data, updateValue, deletingStyleId]);

  // Start editing a style (or close if already editing)
  const handleStartEdit = useCallback((styleId: string, style: StyleDefinition) => {
    if (editingStyleId === styleId) {
      // If clicking the same style that's being edited, close the panel
      setEditingStyleId(null);
      setEditingStyle({});
    } else {
      // Otherwise, open the edit panel for this style
      setEditingStyleId(styleId);
      setEditingStyle({ ...style });
      setIsCreatingNew(false);
    }
  }, [editingStyleId]);

  // Save edited style
  const handleSaveEdit = useCallback(() => {
    if (!editingStyleId) return;

    const currentStyles = (data as Record<string, unknown>)?.styles || {};
    updateValue(['styles'], {
      ...currentStyles as object,
      [editingStyleId]: editingStyle,
    });

    // Reset editing state
    setEditingStyleId(null);
    setEditingStyle({});
  }, [data, editingStyleId, editingStyle, updateValue]);

  // Render style properties summary
  const renderStyleSummary = (style: StyleDefinition) => {
    const parts: string[] = [];
    if (style.fontSize) parts.push(`${style.fontSize}pt`);
    if (style.fontWeight) parts.push(style.fontWeight);
    if (style.textAlignment) parts.push(style.textAlignment);
    if (style.textColor) parts.push(style.textColor);
    return parts.join(' · ') || 'No properties';
  };

  return (
    <div className="border-t border-[var(--border-color)]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight 
            className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          <Palette className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Styles</span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {Object.keys(styles).length} defined
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Existing Styles List */}
          {Object.keys(styles).length > 0 && (
            <div className="space-y-1 mb-3">
              <div className="text-xs text-[var(--text-tertiary)] mb-2">Available Styles</div>
              {Object.entries(styles).map(([styleId, style]) => (
                <React.Fragment key={styleId}>
                  <div
                    className={`
                      flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
                      ${currentStyleId === styleId
                        ? 'bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30'
                        : 'hover:bg-[var(--bg-tertiary)]'
                      }
                    `}
                    onClick={() => handleApplyStyle(styleId)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(styleId, style);
                      }}
                      className={`
                        p-1.5 rounded transition-colors
                        ${editingStyleId === styleId
                          ? 'text-[var(--accent-color)] bg-[var(--accent-color)]/10'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--accent-color)] hover:bg-[var(--bg-primary)]'
                        }
                      `}
                      title={editingStyleId === styleId ? "Close editor" : "Edit style"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-primary)] font-medium truncate">
                        {styleId}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] truncate">
                        {renderStyleSummary(style)}
                      </div>
                    </div>
                    {currentStyleId === styleId && (
                      <Check className="w-4 h-4 text-[var(--accent-color)]" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingStyleId(styleId);
                      }}
                      className="p-1 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                      title="Delete style"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete Confirmation - appears right below the row */}
                  {deletingStyleId === styleId && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-1 mt-1">
                      <div className="text-sm text-red-900 dark:text-red-100 mb-3">
                        Delete style "{styleId}"? This cannot be undone.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeletingStyleId(null)}
                          className="flex-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmDelete}
                          className="flex-1 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Edit Style Form - appears right below the edited row */}
                  {editingStyleId === styleId && (
                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-md space-y-3 mb-1 mt-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-[var(--text-primary)]">Edit Style: {editingStyleId}</div>
                      </div>

                      {/* Preview Section */}
                      <div>
                        <label className="text-xs text-[var(--text-tertiary)]">Preview</label>
                        <div className="mt-1 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md flex items-center justify-center">
                          <div
                            className="px-3 py-2 rounded inline-block"
                            style={{
                              fontSize: editingStyle.fontSize ? `${editingStyle.fontSize}px` : '14px',
                              fontWeight: editingStyle.fontWeight || 'normal',
                              color: editingStyle.textColor || 'var(--text-primary)',
                              backgroundColor: editingStyle.backgroundColor || 'transparent',
                              borderRadius: editingStyle.cornerRadius ? `${editingStyle.cornerRadius}px` : undefined,
                            }}
                          >
                            {editingStyleId}
                          </div>
                        </div>
                      </div>

              {/* Font Size */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Font Size</label>
                <input
                  type="number"
                  value={editingStyle.fontSize || ''}
                  onChange={(e) => setEditingStyle({ ...editingStyle, fontSize: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="16"
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                />
              </div>

              {/* Font Weight */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Font Weight</label>
                <select
                  value={editingStyle.fontWeight || ''}
                  onChange={(e) => setEditingStyle({ ...editingStyle, fontWeight: e.target.value || undefined })}
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                >
                  <option value="">Select weight...</option>
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Text Alignment</label>
                <div className="flex gap-1 mt-1">
                  {TEXT_ALIGNMENTS.map((alignment) => (
                    <button
                      key={alignment}
                      onClick={() => setEditingStyle({ ...editingStyle, textAlignment: alignment })}
                      className={`
                        flex-1 px-2 py-1.5 text-xs rounded-md transition-colors
                        ${editingStyle.textAlignment === alignment
                          ? 'bg-[var(--accent-color)] text-white'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }
                      `}
                    >
                      {alignment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Text Color</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={editingStyle.textColor || '#000000'}
                    onChange={(e) => setEditingStyle({ ...editingStyle, textColor: e.target.value })}
                    className="w-8 h-8 rounded border border-[var(--border-color)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingStyle.textColor || ''}
                    onChange={(e) => setEditingStyle({ ...editingStyle, textColor: e.target.value || undefined })}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Background Color</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={editingStyle.backgroundColor || '#ffffff'}
                    onChange={(e) => setEditingStyle({ ...editingStyle, backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded border border-[var(--border-color)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingStyle.backgroundColor || ''}
                    onChange={(e) => setEditingStyle({ ...editingStyle, backgroundColor: e.target.value || undefined })}
                    placeholder="#FFFFFF"
                    className="flex-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Corner Radius */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Corner Radius</label>
                <input
                  type="number"
                  value={editingStyle.cornerRadius || ''}
                  onChange={(e) => setEditingStyle({ ...editingStyle, cornerRadius: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                />
              </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingStyleId(null);
                            setEditingStyle({});
                          }}
                          className="flex-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-1.5 text-sm text-white bg-[var(--accent-color)] rounded-md hover:opacity-90 transition-opacity"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Create New Style */}
          {isCreatingNew ? (
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-md space-y-3">
              <div className="text-xs font-medium text-[var(--text-primary)] mb-2">New Style</div>
              
              {/* Style Name */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Name</label>
                <input
                  type="text"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  placeholder="e.g., heading, caption"
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Font Size</label>
                <input
                  type="number"
                  value={newStyle.fontSize || ''}
                  onChange={(e) => setNewStyle({ ...newStyle, fontSize: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="16"
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                />
              </div>

              {/* Font Weight */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Font Weight</label>
                <select
                  value={newStyle.fontWeight || ''}
                  onChange={(e) => setNewStyle({ ...newStyle, fontWeight: e.target.value || undefined })}
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                >
                  <option value="">Select weight...</option>
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Text Alignment</label>
                <div className="flex gap-1 mt-1">
                  {TEXT_ALIGNMENTS.map((alignment) => (
                    <button
                      key={alignment}
                      onClick={() => setNewStyle({ ...newStyle, textAlignment: alignment })}
                      className={`
                        flex-1 px-2 py-1.5 text-xs rounded-md transition-colors
                        ${newStyle.textAlignment === alignment
                          ? 'bg-[var(--accent-color)] text-white'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }
                      `}
                    >
                      {alignment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Text Color</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={newStyle.textColor || '#000000'}
                    onChange={(e) => setNewStyle({ ...newStyle, textColor: e.target.value })}
                    className="w-8 h-8 rounded border border-[var(--border-color)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newStyle.textColor || ''}
                    onChange={(e) => setNewStyle({ ...newStyle, textColor: e.target.value || undefined })}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Background Color</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={newStyle.backgroundColor || '#ffffff'}
                    onChange={(e) => setNewStyle({ ...newStyle, backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded border border-[var(--border-color)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newStyle.backgroundColor || ''}
                    onChange={(e) => setNewStyle({ ...newStyle, backgroundColor: e.target.value || undefined })}
                    placeholder="#FFFFFF"
                    className="flex-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Corner Radius */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)]">Corner Radius</label>
                <input
                  type="number"
                  value={newStyle.cornerRadius || ''}
                  onChange={(e) => setNewStyle({ ...newStyle, cornerRadius: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className="w-full mt-1 px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewStyleName('');
                    setNewStyle({});
                  }}
                  className="flex-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStyle}
                  disabled={!newStyleName.trim()}
                  className="flex-1 px-3 py-1.5 text-sm text-white bg-[var(--accent-color)] rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Style
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[var(--accent-color)] border border-dashed border-[var(--accent-color)]/50 rounded-md hover:bg-[var(--accent-color)]/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Style
            </button>
          )}
        </div>
      )}
    </div>
  );
}
