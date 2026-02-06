import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';
import { CanvasView } from './CanvasView';
import { SplitView } from './SplitView';
import { SchemaEditor } from '@/components/SchemaEditor';
import { useUI } from '@/store/UIContext';
import { InspectorPanel } from '@/plugins/property-inspector/components/InspectorPanel';
import { useEditorState } from '@/store/EditorContext';

type ViewMode = 'tree' | 'canvas' | 'split';

interface EditorPanelProps {
  defaultViewMode?: ViewMode;
}

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const TabBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background-color: ${p => p.theme.colors.bgSecondary};
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  border: none;
  cursor: pointer;
  border-radius: ${p => p.theme.radii.md};
  transition: color 150ms, background-color 150ms;

  ${p =>
    p.$active
      ? css`
          background-color: ${p.theme.colors.bgPrimary};
          color: ${p.theme.colors.textPrimary};
          box-shadow: ${p.theme.shadows.sm};
        `
      : css`
          background-color: transparent;
          color: ${p.theme.colors.textSecondary};

          &:hover {
            color: ${p.theme.colors.textPrimary};
            background-color: ${p.theme.colors.bgTertiary};
          }
        `}
`;

const ViewContent = styled.div`
  flex: 1;
  min-height: 0;
`;

/**
 * Combined editor panel with Tree, Canvas, and Split view modes
 * This component manages the view mode state and renders the appropriate view
 */
export function EditorPanel({ defaultViewMode = 'tree' }: EditorPanelProps) {
  const { rightPanelTab, setRightPanelTab } = useUI();
  const { selectedPath } = useEditorState();

  // Create inspector panel when a component is selected
  const inspectorPanel = selectedPath ? <InspectorPanel /> : null;

  // Map stored tab to view mode
  const viewMode = (rightPanelTab as ViewMode) || defaultViewMode;

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setRightPanelTab(mode);
  }, [setRightPanelTab]);

  return (
    <PanelContainer>
      {/* View Mode Tabs */}
      <TabBar>
        {(['tree', 'canvas', 'split'] as const).map((mode) => (
          <TabButton
            key={mode}
            $active={viewMode === mode}
            onClick={() => handleViewModeChange(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </TabButton>
        ))}
      </TabBar>

      {/* View Content */}
      <ViewContent>
        {viewMode === 'tree' && <SchemaEditor />}

        {viewMode === 'canvas' && <CanvasView inspectorPanel={inspectorPanel} />}

        {viewMode === 'split' && (
          <SplitView
            leftPanel={<SchemaEditor />}
            rightPanel={<CanvasView inspectorPanel={inspectorPanel} />}
            initialSplit={50}
          />
        )}
      </ViewContent>
    </PanelContainer>
  );
}
