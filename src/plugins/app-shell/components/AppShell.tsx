import React, { useCallback, ReactNode } from 'react';
import { TabbedPanel } from './TabbedPanel';
import type { TabDefinition } from './TabbedPanel';
import { ResizableDivider } from './ResizableDivider';
import { Toolbar } from './Toolbar';
import { usePersistence } from '../hooks/usePersistence';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_PANEL_WIDTH = 250;
const MAX_PANEL_WIDTH = 800;

interface AppShellProps {
  // Left panel tabs (Preview, JSON Output)
  leftTabs: TabDefinition[];

  // Right panel tabs (Tree, Canvas, Split)
  rightTabs: TabDefinition[];

  // Error Console (collapsible bottom panel)
  errorConsole?: ReactNode;

  // Schema state for toolbar
  hasSchema: boolean;
  isValid: boolean;
  errorCount: number;

  // Toolbar actions
  onShowErrors: () => void;

  // Import/Export component
  importExportSlot?: ReactNode;
}

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

  // Handle left panel resize
  const handleLeftPanelResize = useCallback((delta: number) => {
    setLeftPanelWidth(
      Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, leftPanelWidth + delta))
    );
  }, [leftPanelWidth, setLeftPanelWidth]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Toolbar */}
      <Toolbar
        hasSchema={hasSchema}
        isValid={isValid}
        errorCount={errorCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onShowErrors={onShowErrors}
        importExportSlot={importExportSlot}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Preview/JSON Output */}
          {hasSchema && leftTabs.length > 0 && (
            <>
              {isLeftPanelCollapsed ? (
                /* Collapsed state - thin bar with expand button */
                <div className="flex-shrink-0 w-12 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col items-center py-2">
                  <button
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    className="p-2 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Expand Output Panel"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                /* Expanded state */
                <>
                  <div
                    className="flex-shrink-0 flex flex-col bg-[var(--bg-secondary)] relative"
                    style={{ width: leftPanelWidth }}
                  >
                    {/* Collapse button */}
                    <button
                      onClick={() => setIsLeftPanelCollapsed(true)}
                      className="absolute top-2 right-2 z-10 p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      title="Collapse Output Panel"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <TabbedPanel
                      tabs={leftTabs}
                      activeTab={leftPanelTab}
                      onTabChange={setLeftPanelTab}
                      className="h-full"
                    />
                  </div>

                  <ResizableDivider
                    direction="horizontal"
                    onResize={handleLeftPanelResize}
                  />
                </>
              )}
            </>
          )}

          {/* Center Panel - Tree/Canvas Editor */}
          <div className="flex-1 min-w-0 flex flex-col">
            {hasSchema && rightTabs.length > 0 ? (
              <TabbedPanel
                tabs={rightTabs}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
                className="h-full"
              />
            ) : (
              // Show placeholder when no schema loaded
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
                <div className="text-center">
                  <p className="text-lg mb-2">No schema loaded</p>
                  <p className="text-sm">Load a JSON Schema to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Console (Bottom) */}
        {hasSchema && errorConsole}
      </main>
    </div>
  );
}
