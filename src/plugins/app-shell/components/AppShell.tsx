import React, { useCallback, ReactNode } from 'react';
import { TabbedPanel } from './TabbedPanel';
import type { TabDefinition } from './TabbedPanel';
import { ResizableDivider } from './ResizableDivider';
import { Toolbar } from './Toolbar';
import { usePersistence } from '../hooks/usePersistence';

const MIN_PANEL_WIDTH = 250;
const MAX_PANEL_WIDTH = 800;
const MIN_INSPECTOR_WIDTH = 240;
const MAX_INSPECTOR_WIDTH = 400;

interface AppShellProps {
  // Left panel tabs (Preview, JSON Output)
  leftTabs: TabDefinition[];

  // Right panel tabs (Tree, Canvas, Split)
  rightTabs: TabDefinition[];

  // Property Inspector (shown on the right side when component selected)
  propertyInspector?: ReactNode;

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
  propertyInspector,
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
    inspectorWidth,
    isInspectorOpen,
    setLeftPanelWidth,
    setLeftPanelTab,
    setRightPanelTab,
    setDarkMode,
    setInspectorWidth,
    setIsInspectorOpen,
  } = usePersistence();

  // Handle inspector resize (negative delta = growing from left)
  const handleInspectorResize = useCallback((delta: number) => {
    setInspectorWidth(
      Math.min(MAX_INSPECTOR_WIDTH, Math.max(MIN_INSPECTOR_WIDTH, inspectorWidth - delta))
    );
  }, [inspectorWidth, setInspectorWidth]);

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
              <div
                className="flex-shrink-0 flex flex-col bg-[var(--bg-secondary)]"
                style={{ width: leftPanelWidth }}
              >
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

          {/* Right Panel - Property Inspector (slides in when component selected) */}
          {propertyInspector && (
            <>
              <ResizableDivider
                direction="horizontal"
                onResize={handleInspectorResize}
              />
              <div 
                className="flex-shrink-0 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col overflow-hidden"
                style={{ width: inspectorWidth }}
              >
                {/* Inspector Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-[var(--text-secondary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="text-sm font-medium text-[var(--text-primary)]">Properties</span>
                  </div>
                </div>
                
                {/* Inspector Content */}
                <div className="flex-1 overflow-y-auto">
                  {propertyInspector}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error Console (Bottom) */}
        {hasSchema && errorConsole}
      </main>
    </div>
  );
}
