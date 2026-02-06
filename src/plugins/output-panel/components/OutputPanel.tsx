import React, { useCallback, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Monitor, Code, ChevronDown, ChevronRight, RotateCcw, WrapText } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { DevicePreview } from '@/components/Preview/DevicePreview';
import { RawJSONPreview } from '@/components/Preview/RawJSONPreview';
import { Button } from '@/components/ui/Button';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.colors.bgSecondary};
`;

const TabHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const TabGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: ${p => p.theme.colors.bgSecondary};
  border-radius: ${p => p.theme.radii.lg};
  padding: 0.25rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  border-radius: ${p => p.theme.radii.md};
  border: none;
  cursor: pointer;
  transition: all 200ms;

  ${p => p.$active
    ? css`
        background: ${p.theme.colors.bgPrimary};
        color: ${p.theme.colors.textPrimary};
        box-shadow: ${p.theme.shadows.sm};
      `
    : css`
        background: transparent;
        color: ${p.theme.colors.textSecondary};
        &:hover {
          color: ${p.theme.colors.textPrimary};
          background: ${p.theme.colors.bgTertiary};
        }
      `
  }
`;

const RightButtons = styled.div`
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ContentArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const BottomToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.75rem;
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WrapToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border-radius: ${p => p.theme.radii.sm};
  font-size: ${p => p.theme.fontSizes.xs};
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 150ms;

  ${p => p.$active
    ? css`
        background: color-mix(in srgb, ${p.theme.colors.accent} 20%, transparent);
        color: ${p.theme.colors.accent};
      `
    : css`
        background: transparent;
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background: ${p.theme.colors.bgSecondary};
        }
      `
  }
`;

type TabId = 'preview' | 'json';

// Strip editor-only properties from data for display
function stripEditorProperties(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripEditorProperties);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Skip editor-only properties (prefixed with underscore)
    // Examples: _aspectRatioLocked, _pinnedEdges, _bounds
    if (key.startsWith('_')) {
      continue;
    }
    result[key] = stripEditorProperties(value);
  }
  return result;
}

export function OutputPanel() {
  const { leftPanelTab, setLeftPanelTab, isJsonWrapEnabled, setIsJsonWrapEnabled } = usePersistentUIStore();

  // Use persisted tab, default to 'json' if invalid
  const activeTab: TabId = (leftPanelTab === 'preview' || leftPanelTab === 'json')
    ? leftPanelTab
    : 'json';
  
  const {
    data,
    selectedPath,
    editingPath,
    setSelectedPath,
    expandPaths,
    expandAll,
    collapseAll,
    resetData,
  } = useEditorStore();

  // Strip editor-only properties for display in JSON output
  const displayData = useMemo(() => stripEditorProperties(data), [data]);

  const handleTabChange = useCallback((tab: TabId) => {
    setLeftPanelTab(tab);
  }, [setLeftPanelTab]);

  // Handle selection from JSON preview
  const handleSelectFromPreview = useCallback((path: string) => {
    const pathsToExpand: string[] = ['root'];
    
    if (path !== 'root') {
      const regex = /([^.\[\]]+)|\[(\d+)\]/g;
      let match;
      let currentPath = '';
      
      while ((match = regex.exec(path)) !== null) {
        if (match[1] !== undefined) {
          currentPath = currentPath ? `${currentPath}.${match[1]}` : match[1];
        } else if (match[2] !== undefined) {
          currentPath += `[${match[2]}]`;
        }
        pathsToExpand.push(currentPath);
      }
    }
    
    expandPaths(pathsToExpand);
    setSelectedPath(path);
  }, [expandPaths, setSelectedPath]);

  const tabs = [
    { id: 'preview' as const, label: 'Preview', icon: Monitor },
    { id: 'json' as const, label: 'JSON', icon: Code },
  ];

  return (
    <PanelContainer>
      {/* Tab Header - Centered with improved styling */}
      <TabHeader>
        {/* Centered Tab Buttons */}
        <TabGroup>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabButton
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </TabButton>
            );
          })}
        </TabGroup>

        {/* Right-side buttons - positioned on the right */}
        {activeTab === 'json' && (
          <RightButtons>
            {/* Expand/Collapse/Reset buttons - only visible for JSON tab */}
            <Button variant="ghost" size="sm" onClick={expandAll} title="Expand All">
              <ChevronDown size={12} />
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll} title="Collapse All">
              <ChevronRight size={12} />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetData} title="Reset">
              <RotateCcw size={12} />
            </Button>
          </RightButtons>
        )}
      </TabHeader>

      {/* Tab Content */}
      <ContentArea>
        {activeTab === 'preview' ? (
          <DevicePreview data={data} />
        ) : (
          <RawJSONPreview
            data={displayData}
            selectedPath={selectedPath}
            editingPath={editingPath}
            onSelectPath={handleSelectFromPreview}
            wrapText={isJsonWrapEnabled}
          />
        )}
      </ContentArea>

      {/* Bottom Toolbar - only visible for JSON tab */}
      {activeTab === 'json' && (
        <BottomToolbar>
          <ToolbarGroup>
            <WrapToggle
              $active={isJsonWrapEnabled}
              onClick={() => setIsJsonWrapEnabled(!isJsonWrapEnabled)}
              title={isJsonWrapEnabled ? 'Disable text wrapping' : 'Enable text wrapping'}
            >
              <WrapText size={14} />
              <span>Wrap</span>
            </WrapToggle>
          </ToolbarGroup>
        </BottomToolbar>
      )}
    </PanelContainer>
  );
}
