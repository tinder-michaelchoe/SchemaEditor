/**
 * Main App component using the plugin architecture
 * Integrates all visual editing plugins into a cohesive application
 */
import React, { useCallback, useState } from 'react';
import { useEditorStore } from './store/editorStore';
import { usePersistence } from './plugins/app-shell/hooks/usePersistence';
import { AppShell } from './plugins/app-shell/components/AppShell';
import { OutputPanel } from './plugins/output-panel/components/OutputPanel';
import { EditorPanel } from './plugins/canvas-view/components/EditorPanel';
import { InspectorPanel } from './plugins/property-inspector/components/InspectorPanel';
import { DragPreview } from './plugins/drag-drop-service/DragPreview';
import { ErrorConsole } from './components/ErrorConsole';
import { ImportExport } from './components/ImportExport';
import type { TabDefinition } from './plugins/app-shell/components/TabbedPanel';

// Wrapper components for tab definitions
function OutputPanelWrapper() {
  return <OutputPanel />;
}

function EditorPanelWrapper() {
  return <EditorPanel />;
}

function App() {
  const {
    schema,
    data,
    isValid,
    errors,
    setSchema,
    importJSON,
    expandErrorPaths,
    selectedPath,
  } = useEditorStore();

  const { isDarkMode } = usePersistence();

  const [isErrorConsoleOpen, setIsErrorConsoleOpen] = useState(false);
  const [highlightedErrorLine, setHighlightedErrorLine] = useState<number | null>(null);

  // Handle errors click
  const handleErrorsClick = useCallback(() => {
    expandErrorPaths();
    setIsErrorConsoleOpen(true);
  }, [expandErrorPaths]);

  // Handle error line click
  const handleErrorLineClick = useCallback((line: number) => {
    setHighlightedErrorLine(line);
    setTimeout(() => setHighlightedErrorLine(null), 3000);
  }, []);

  // Strip editor-only properties (prefixed with _) for export
  const stripEditorProperties = useCallback((obj: unknown): unknown => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(stripEditorProperties);
    }
    
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Skip properties starting with underscore (editor-only)
      if (key.startsWith('_')) {
        continue;
      }
      result[key] = stripEditorProperties(value);
    }
    return result;
  }, []);

  // Export JSON handler
  const handleExportJSON = useCallback(() => {
    const cleanedData = stripEditorProperties(data);
    return JSON.stringify(cleanedData, null, 2);
  }, [data, stripEditorProperties]);

  // Define tabs for left panel (Output)
  const leftTabs: TabDefinition[] = [
    {
      id: 'output',
      label: 'Output',
      component: OutputPanelWrapper,
      priority: 100,
    },
  ];

  // Define tabs for right panel (Editor) - no label since EditorPanel has its own view mode tabs
  const rightTabs: TabDefinition[] = [
    {
      id: 'editor',
      label: '', // Empty label - EditorPanel has its own Tree/Canvas/Split tabs
      component: EditorPanelWrapper,
      priority: 100,
    },
  ];

  const errorCount = errors.size;

  return (
    <>
      <AppShell
        leftTabs={leftTabs}
        rightTabs={rightTabs}
        propertyInspector={selectedPath ? <InspectorPanel /> : null}
        errorConsole={
          schema && (
            <ErrorConsole
              errors={errors}
              data={data}
              isOpen={isErrorConsoleOpen}
              onClose={() => setIsErrorConsoleOpen(false)}
              onErrorClick={handleErrorLineClick}
            />
          )
        }
        hasSchema={!!schema}
        isValid={isValid}
        errorCount={errorCount}
        onShowErrors={handleErrorsClick}
        importExportSlot={
          <ImportExport
            onImportSchema={setSchema}
            onImportJSON={importJSON}
            onExportJSON={handleExportJSON}
            hasSchema={!!schema}
          />
        }
      />

      {/* Global drag preview */}
      <DragPreview />
    </>
  );
}

export default App;
