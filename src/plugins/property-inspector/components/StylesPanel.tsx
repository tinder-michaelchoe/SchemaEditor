import React, { useState, useMemo, useCallback } from 'react';
import styled, { css } from 'styled-components';
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

/* ------------------------------------------------------------------ */
/*  Styled Components                                                  */
/* ------------------------------------------------------------------ */

const PanelWrapper = styled.div`
  border-top: 1px solid ${p => p.theme.colors.border};
`;

const HeaderButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  transition: background-color 0.15s;

  &:hover {
    background-color: ${p => p.theme.colors.bgTertiary};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${p => p.theme.colors.textSecondary};
`;

const ChevronIcon = styled(ChevronRight)<{ $isExpanded: boolean }>`
  color: ${p => p.theme.colors.textSecondary};
  transition: transform 0.15s;
  ${p => p.$isExpanded && css`transform: rotate(90deg);`}
`;

const HeaderTitle = styled.span`
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const HeaderCount = styled.span`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
`;

const ContentArea = styled.div`
  padding: 0 12px 12px;
`;

const StylesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

const SectionLabel = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
  margin-bottom: 8px;
`;

const StyleRow = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: ${p => p.theme.radii.md};
  cursor: pointer;
  transition: background-color 0.15s;

  ${p => p.$isActive
    ? css`
        background-color: ${p.theme.colors.accent}1a;
        border: 1px solid ${p.theme.colors.accent}4d;
      `
    : css`
        border: 1px solid transparent;
        &:hover {
          background-color: ${p.theme.colors.bgTertiary};
        }
      `
  }
`;

const EditButton = styled.button<{ $isEditing: boolean }>`
  padding: 6px;
  border-radius: ${p => p.theme.radii.sm};
  transition: color 0.15s, background-color 0.15s;

  ${p => p.$isEditing
    ? css`
        color: ${p.theme.colors.accent};
        background-color: ${p.theme.colors.accent}1a;
      `
    : css`
        color: ${p.theme.colors.textTertiary};
        &:hover {
          color: ${p.theme.colors.accent};
          background-color: ${p.theme.colors.bgPrimary};
        }
      `
  }
`;

const StyleInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyleName = styled.div`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textPrimary};
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyleSummary = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CheckIcon = styled(Check)`
  color: ${p => p.theme.colors.accent};
`;

const DeleteButton = styled.button`
  padding: 4px;
  color: ${p => p.theme.colors.textTertiary};
  transition: color 0.15s;

  &:hover {
    color: #ef4444;
  }
`;

const DeleteConfirmation = styled.div`
  padding: 12px;
  background-color: ${p => p.theme.colors.error}1a;
  border: 1px solid ${p => p.theme.colors.error};
  border-radius: ${p => p.theme.radii.md};
  margin: 4px 0;
`;

const DeleteConfirmText = styled.div`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textPrimary};
  margin-bottom: 12px;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
`;

const CancelBtn = styled.button`
  flex: 1;
  padding: 4px 12px;
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textSecondary};
  background-color: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.md};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${p => p.theme.colors.bgSecondary};
  }
`;

const ConfirmDeleteBtn = styled.button`
  flex: 1;
  padding: 4px 12px;
  font-size: ${p => p.theme.fontSizes.sm};
  color: #ffffff;
  background-color: #dc2626;
  border-radius: ${p => p.theme.radii.md};
  transition: background-color 0.15s;

  &:hover {
    background-color: #b91c1c;
  }
`;

const EditForm = styled.div`
  padding: 12px;
  background-color: ${p => p.theme.colors.bgTertiary};
  border-radius: ${p => p.theme.radii.md};
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 4px 0;
`;

const EditFormTitle = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const FormFieldLabel = styled.label`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
`;

const PreviewBox = styled.div`
  margin-top: 4px;
  padding: 12px;
  background-color: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewSample = styled.div`
  padding: 4px 12px;
  border-radius: ${p => p.theme.radii.sm};
  display: inline-block;
`;

const FormInput = styled.input`
  width: 100%;
  margin-top: 4px;
  padding: 4px 8px;
  font-size: ${p => p.theme.fontSizes.sm};
  background-color: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.md};
  color: ${p => p.theme.colors.textPrimary};

  &::placeholder {
    color: ${p => p.theme.colors.textTertiary};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  margin-top: 4px;
  padding: 4px 8px;
  font-size: ${p => p.theme.fontSizes.sm};
  background-color: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.md};
  color: ${p => p.theme.colors.textPrimary};
`;

const AlignmentButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 4px 8px;
  font-size: ${p => p.theme.fontSizes.xs};
  border-radius: ${p => p.theme.radii.md};
  transition: background-color 0.15s, color 0.15s;

  ${p => p.$active
    ? css`
        background-color: ${p.theme.colors.accent};
        color: #ffffff;
      `
    : css`
        background-color: ${p.theme.colors.bgPrimary};
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background-color: ${p.theme.colors.bgSecondary};
        }
      `
  }
`;

const AlignmentRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const ColorRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const ColorSwatch = styled.input`
  width: 32px;
  height: 32px;
  border-radius: ${p => p.theme.radii.sm};
  border: 1px solid ${p => p.theme.colors.border};
  cursor: pointer;
`;

const ColorTextInput = styled(FormInput)`
  flex: 1;
  width: auto;
`;

const FormActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 8px;
`;

const NewStyleForm = styled.div`
  padding: 12px;
  background-color: ${p => p.theme.colors.bgTertiary};
  border-radius: ${p => p.theme.radii.md};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CreateStyleButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.accent};
  border: 1px dashed ${p => p.theme.colors.accent}80;
  border-radius: ${p => p.theme.radii.md};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${p => p.theme.colors.accent}0d;
  }
`;

const AccentButton = styled.button`
  flex: 1;
  padding: 4px 12px;
  font-size: ${p => p.theme.fontSizes.sm};
  color: #ffffff;
  background-color: ${p => p.theme.colors.accent};
  border-radius: ${p => p.theme.radii.md};
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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
    <PanelWrapper>
      {/* Header */}
      <HeaderButton onClick={() => setIsExpanded(!isExpanded)}>
        <HeaderLeft>
          <ChevronIcon $isExpanded={isExpanded} size={16} />
          <Palette size={16} />
          <HeaderTitle>Styles</HeaderTitle>
        </HeaderLeft>
        <HeaderCount>
          {Object.keys(styles).length} defined
        </HeaderCount>
      </HeaderButton>

      {isExpanded && (
        <ContentArea>
          {/* Existing Styles List */}
          {Object.keys(styles).length > 0 && (
            <StylesList>
              <SectionLabel>Available Styles</SectionLabel>
              {Object.entries(styles).map(([styleId, style]) => (
                <React.Fragment key={styleId}>
                  <StyleRow
                    $isActive={currentStyleId === styleId}
                    onClick={() => handleApplyStyle(styleId)}
                  >
                    <EditButton
                      $isEditing={editingStyleId === styleId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(styleId, style);
                      }}
                      title={editingStyleId === styleId ? "Close editor" : "Edit style"}
                    >
                      <Pencil size={14} />
                    </EditButton>
                    <StyleInfo>
                      <StyleName>{styleId}</StyleName>
                      <StyleSummary>{renderStyleSummary(style)}</StyleSummary>
                    </StyleInfo>
                    {currentStyleId === styleId && (
                      <CheckIcon size={16} />
                    )}
                    <DeleteButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingStyleId(styleId);
                      }}
                      title="Delete style"
                    >
                      <X size={12} />
                    </DeleteButton>
                  </StyleRow>

                  {/* Delete Confirmation - appears right below the row */}
                  {deletingStyleId === styleId && (
                    <DeleteConfirmation>
                      <DeleteConfirmText>
                        Delete style &quot;{styleId}&quot;? This cannot be undone.
                      </DeleteConfirmText>
                      <ConfirmActions>
                        <CancelBtn onClick={() => setDeletingStyleId(null)}>
                          Cancel
                        </CancelBtn>
                        <ConfirmDeleteBtn onClick={handleConfirmDelete}>
                          Delete
                        </ConfirmDeleteBtn>
                      </ConfirmActions>
                    </DeleteConfirmation>
                  )}

                  {/* Edit Style Form - appears right below the edited row */}
                  {editingStyleId === styleId && (
                    <EditForm>
                      <div>
                        <EditFormTitle>Edit Style: {editingStyleId}</EditFormTitle>
                      </div>

                      {/* Preview Section */}
                      <div>
                        <FormFieldLabel>Preview</FormFieldLabel>
                        <PreviewBox>
                          <PreviewSample
                            style={{
                              fontSize: editingStyle.fontSize ? `${editingStyle.fontSize}px` : '14px',
                              fontWeight: editingStyle.fontWeight || 'normal',
                              color: editingStyle.textColor || undefined,
                              backgroundColor: editingStyle.backgroundColor || 'transparent',
                              borderRadius: editingStyle.cornerRadius ? `${editingStyle.cornerRadius}px` : undefined,
                            }}
                          >
                            {editingStyleId}
                          </PreviewSample>
                        </PreviewBox>
                      </div>

                      {/* Font Size */}
                      <div>
                        <FormFieldLabel>Font Size</FormFieldLabel>
                        <FormInput
                          type="number"
                          value={editingStyle.fontSize || ''}
                          onChange={(e) => setEditingStyle({ ...editingStyle, fontSize: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="16"
                        />
                      </div>

                      {/* Font Weight */}
                      <div>
                        <FormFieldLabel>Font Weight</FormFieldLabel>
                        <FormSelect
                          value={editingStyle.fontWeight || ''}
                          onChange={(e) => setEditingStyle({ ...editingStyle, fontWeight: e.target.value || undefined })}
                        >
                          <option value="">Select weight...</option>
                          {FONT_WEIGHTS.map((weight) => (
                            <option key={weight} value={weight}>{weight}</option>
                          ))}
                        </FormSelect>
                      </div>

                      {/* Text Alignment */}
                      <div>
                        <FormFieldLabel>Text Alignment</FormFieldLabel>
                        <AlignmentRow>
                          {TEXT_ALIGNMENTS.map((alignment) => (
                            <AlignmentButton
                              key={alignment}
                              $active={editingStyle.textAlignment === alignment}
                              onClick={() => setEditingStyle({ ...editingStyle, textAlignment: alignment })}
                            >
                              {alignment}
                            </AlignmentButton>
                          ))}
                        </AlignmentRow>
                      </div>

                      {/* Text Color */}
                      <div>
                        <FormFieldLabel>Text Color</FormFieldLabel>
                        <ColorRow>
                          <ColorSwatch
                            type="color"
                            value={editingStyle.textColor || '#000000'}
                            onChange={(e) => setEditingStyle({ ...editingStyle, textColor: e.target.value })}
                          />
                          <ColorTextInput
                            type="text"
                            value={editingStyle.textColor || ''}
                            onChange={(e) => setEditingStyle({ ...editingStyle, textColor: e.target.value || undefined })}
                            placeholder="#000000"
                          />
                        </ColorRow>
                      </div>

                      {/* Background Color */}
                      <div>
                        <FormFieldLabel>Background Color</FormFieldLabel>
                        <ColorRow>
                          <ColorSwatch
                            type="color"
                            value={editingStyle.backgroundColor || '#ffffff'}
                            onChange={(e) => setEditingStyle({ ...editingStyle, backgroundColor: e.target.value })}
                          />
                          <ColorTextInput
                            type="text"
                            value={editingStyle.backgroundColor || ''}
                            onChange={(e) => setEditingStyle({ ...editingStyle, backgroundColor: e.target.value || undefined })}
                            placeholder="#FFFFFF"
                          />
                        </ColorRow>
                      </div>

                      {/* Corner Radius */}
                      <div>
                        <FormFieldLabel>Corner Radius</FormFieldLabel>
                        <FormInput
                          type="number"
                          value={editingStyle.cornerRadius || ''}
                          onChange={(e) => setEditingStyle({ ...editingStyle, cornerRadius: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="0"
                        />
                      </div>

                      {/* Actions */}
                      <FormActions>
                        <CancelBtn
                          onClick={() => {
                            setEditingStyleId(null);
                            setEditingStyle({});
                          }}
                        >
                          Cancel
                        </CancelBtn>
                        <AccentButton onClick={handleSaveEdit}>
                          Save Changes
                        </AccentButton>
                      </FormActions>
                    </EditForm>
                  )}
                </React.Fragment>
              ))}
            </StylesList>
          )}

          {/* Create New Style */}
          {isCreatingNew ? (
            <NewStyleForm>
              <EditFormTitle>New Style</EditFormTitle>

              {/* Style Name */}
              <div>
                <FormFieldLabel>Name</FormFieldLabel>
                <FormInput
                  type="text"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  placeholder="e.g., heading, caption"
                />
              </div>

              {/* Font Size */}
              <div>
                <FormFieldLabel>Font Size</FormFieldLabel>
                <FormInput
                  type="number"
                  value={newStyle.fontSize || ''}
                  onChange={(e) => setNewStyle({ ...newStyle, fontSize: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="16"
                />
              </div>

              {/* Font Weight */}
              <div>
                <FormFieldLabel>Font Weight</FormFieldLabel>
                <FormSelect
                  value={newStyle.fontWeight || ''}
                  onChange={(e) => setNewStyle({ ...newStyle, fontWeight: e.target.value || undefined })}
                >
                  <option value="">Select weight...</option>
                  {FONT_WEIGHTS.map((weight) => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </FormSelect>
              </div>

              {/* Text Alignment */}
              <div>
                <FormFieldLabel>Text Alignment</FormFieldLabel>
                <AlignmentRow>
                  {TEXT_ALIGNMENTS.map((alignment) => (
                    <AlignmentButton
                      key={alignment}
                      $active={newStyle.textAlignment === alignment}
                      onClick={() => setNewStyle({ ...newStyle, textAlignment: alignment })}
                    >
                      {alignment}
                    </AlignmentButton>
                  ))}
                </AlignmentRow>
              </div>

              {/* Text Color */}
              <div>
                <FormFieldLabel>Text Color</FormFieldLabel>
                <ColorRow>
                  <ColorSwatch
                    type="color"
                    value={newStyle.textColor || '#000000'}
                    onChange={(e) => setNewStyle({ ...newStyle, textColor: e.target.value })}
                  />
                  <ColorTextInput
                    type="text"
                    value={newStyle.textColor || ''}
                    onChange={(e) => setNewStyle({ ...newStyle, textColor: e.target.value || undefined })}
                    placeholder="#000000"
                  />
                </ColorRow>
              </div>

              {/* Background Color */}
              <div>
                <FormFieldLabel>Background Color</FormFieldLabel>
                <ColorRow>
                  <ColorSwatch
                    type="color"
                    value={newStyle.backgroundColor || '#ffffff'}
                    onChange={(e) => setNewStyle({ ...newStyle, backgroundColor: e.target.value })}
                  />
                  <ColorTextInput
                    type="text"
                    value={newStyle.backgroundColor || ''}
                    onChange={(e) => setNewStyle({ ...newStyle, backgroundColor: e.target.value || undefined })}
                    placeholder="#FFFFFF"
                  />
                </ColorRow>
              </div>

              {/* Corner Radius */}
              <div>
                <FormFieldLabel>Corner Radius</FormFieldLabel>
                <FormInput
                  type="number"
                  value={newStyle.cornerRadius || ''}
                  onChange={(e) => setNewStyle({ ...newStyle, cornerRadius: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                />
              </div>

              {/* Actions */}
              <FormActions>
                <CancelBtn
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewStyleName('');
                    setNewStyle({});
                  }}
                >
                  Cancel
                </CancelBtn>
                <AccentButton
                  onClick={handleCreateStyle}
                  disabled={!newStyleName.trim()}
                >
                  Create Style
                </AccentButton>
              </FormActions>
            </NewStyleForm>
          ) : (
            <CreateStyleButton onClick={() => setIsCreatingNew(true)}>
              <Plus size={16} />
              Create New Style
            </CreateStyleButton>
          )}
        </ContentArea>
      )}
    </PanelWrapper>
  );
}
