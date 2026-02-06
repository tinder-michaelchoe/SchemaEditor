/**
 * Main App component using the plugin architecture
 * Integrates all visual editing plugins into a cohesive application
 */
import React, { useCallback, useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
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
import { initSchemaParser } from './services/schemaParser';
import { initDragDropRegistry } from './plugins/drag-drop-service';
import { initContextMenuRegistry } from './plugins/context-menu/ContextMenuRegistry';

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

  // Initialize schema parser and drag-drop registry when schema is loaded
  useEffect(() => {
    if (schema) {
      try {
        const parser = initSchemaParser(schema);
        initDragDropRegistry(parser);
        initContextMenuRegistry(parser);
        console.log('[App] Initialized SchemaParser, DragDropRegistry, and ContextMenuRegistry');
      } catch (error) {
        console.error('[App] Failed to initialize schema parser:', error);
      }
    }
  }, [schema]);

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

  // Define tabs for left panel (Output) - no label since OutputPanel has its own Preview/JSON tabs
  const leftTabs: TabDefinition[] = [
    {
      id: 'output',
      label: '', // Empty label - OutputPanel has its own Preview/JSON tabs
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
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppShell
        leftTabs={leftTabs}
        rightTabs={rightTabs}
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
    </ThemeProvider>
  );
}

export default App;
