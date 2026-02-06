import React, { useCallback, ReactNode } from 'react';
import styled from 'styled-components';
import { TabbedPanel } from './TabbedPanel';
import type { TabDefinition } from './TabbedPanel';
import { ResizableDivider } from './ResizableDivider';
import { Toolbar } from './Toolbar';
import { usePersistence } from '../hooks/usePersistence';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_PANEL_WIDTH = 250;
const MAX_PANEL_WIDTH = 800;

interface AppShellProps {
  leftTabs: TabDefinition[];
  rightTabs: TabDefinition[];
  errorConsole?: ReactNode;
  hasSchema: boolean;
  isValid: boolean;
  errorCount: number;
  onShowErrors: () => void;
  importExportSlot?: ReactNode;
}

const ShellWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.colors.bgPrimary};
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const PanelRow = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;

const CollapsedBar = styled.div`
  flex-shrink: 0;
  width: 3rem;
  background: ${p => p.theme.colors.bgSecondary};
  border-right: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.5rem;
`;

const CollapseToggleButton = styled.button`
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.md};
  background: none;
  border: none;
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.textPrimary};
  }
`;

const LeftPanelExpanded = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.colors.bgSecondary};
  position: relative;
`;

const CollapseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  padding: 0.25rem;
  border-radius: ${p => p.theme.radii.md};
  background: none;
  border: none;
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.textPrimary};
  }
`;

const CenterPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const Placeholder = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.theme.colors.textTertiary};
  text-align: center;
`;

const PlaceholderTitle = styled.p`
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
`;

const PlaceholderSubtitle = styled.p`
  font-size: 0.875rem;
`;

export function AppShell({
  leftTabs,
  rightTabs,
  errorConsole,
  hasSchema,
  isValid,
  errorCount,
  onShowErrors,
  importExportSlot,
}: AppShellProps) {
  const {
    leftPanelWidth,
    leftPanelTab,
    rightPanelTab,
    isDarkMode,
    isLeftPanelCollapsed,
    setLeftPanelWidth,
    setLeftPanelTab,
    setRightPanelTab,
    setDarkMode,
    setIsLeftPanelCollapsed,
  } = usePersistence();

  const handleLeftPanelResize = useCallback(
    (delta: number) => {
      setLeftPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, leftPanelWidth + delta)));
    },
    [leftPanelWidth, setLeftPanelWidth],
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  return (
    <ShellWrapper>
      <Toolbar
        hasSchema={hasSchema}
        isValid={isValid}
        errorCount={errorCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onShowErrors={onShowErrors}
        importExportSlot={importExportSlot}
      />

      <Main>
        <PanelRow>
          {hasSchema && leftTabs.length > 0 && (
            <>
              {isLeftPanelCollapsed ? (
                <CollapsedBar>
                  <CollapseToggleButton
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    title="Expand Output Panel"
                  >
                    <ChevronRight size={20} />
                  </CollapseToggleButton>
                </CollapsedBar>
              ) : (
                <>
                  <LeftPanelExpanded style={{ width: leftPanelWidth }}>
                    <CollapseButton
                      onClick={() => setIsLeftPanelCollapsed(true)}
                      title="Collapse Output Panel"
                    >
                      <ChevronLeft size={16} />
                    </CollapseButton>
                    <TabbedPanel tabs={leftTabs} activeTab={leftPanelTab} onTabChange={setLeftPanelTab} />
                  </LeftPanelExpanded>
                  <ResizableDivider direction="horizontal" onResize={handleLeftPanelResize} />
                </>
              )}
            </>
          )}

          <CenterPanel>
            {hasSchema && rightTabs.length > 0 ? (
              <TabbedPanel tabs={rightTabs} activeTab={rightPanelTab} onTabChange={setRightPanelTab} />
            ) : (
              <Placeholder>
                <div>
                  <PlaceholderTitle>No schema loaded</PlaceholderTitle>
                  <PlaceholderSubtitle>Load a JSON Schema to start editing</PlaceholderSubtitle>
                </div>
              </Placeholder>
            )}
          </CenterPanel>
        </PanelRow>

        {hasSchema && errorConsole}
      </Main>
    </ShellWrapper>
  );
}
