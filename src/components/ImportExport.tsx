import { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Upload, Download, FileJson, FolderOpen, Clock, Trash2, Settings, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { TextArea } from './ui/Input';
import { SettingsModal } from './Settings/SettingsModal';
import { GenerateFromImageModal } from './GenerateFromImage/GenerateFromImageModal';

interface RecentItem {
  id: string;
  name: string;
  source: string; // filename or "Pasted"
  timestamp: number;
  data: unknown;
}

const RECENT_SCHEMAS_KEY = 'schemaEditor_recentSchemas';
const RECENT_JSON_KEY = 'schemaEditor_recentJSON';
const MAX_RECENTS = 5;

function loadRecents(key: string): RecentItem[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and migrate old format
      return parsed
        .filter((item: unknown) => {
          if (!item || typeof item !== 'object') return false;
          const r = item as Record<string, unknown>;
          return r.id && r.data;
        })
        .map((item: Record<string, unknown>) => ({
          ...item,
          source: item.source || 'Unknown',
          name: item.name || 'Untitled',
        }));
    }
  } catch (e) {
    console.error('Failed to load recents:', e);
    // Clear corrupted data
    localStorage.removeItem(key);
  }
  return [];
}

function saveRecent(key: string, item: RecentItem): RecentItem[] {
  const recents = loadRecents(key);

  // Remove existing item with same id
  const filtered = recents.filter(r => r.id !== item.id);

  // Add new item at the beginning
  const updated = [item, ...filtered].slice(0, MAX_RECENTS);

  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recents:', e);
  }

  return updated;
}

function removeRecent(key: string, id: string): RecentItem[] {
  const recents = loadRecents(key);
  const updated = recents.filter(r => r.id !== id);

  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove recent:', e);
  }

  return updated;
}

function generateId(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getSchemaName(schema: unknown): string {
  if (schema && typeof schema === 'object') {
    const s = schema as Record<string, unknown>;
    if (typeof s.title === 'string') return s.title;
    if (typeof s.$id === 'string') {
      const parts = s.$id.split('/');
      return parts[parts.length - 1].replace('.json', '');
    }
  }
  return 'Untitled Schema';
}

function getJSONName(data: unknown): string {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.id === 'string') return d.id;
    if (typeof d.name === 'string') return d.name;
    if (typeof d.title === 'string') return d.title;
  }
  return 'Untitled Document';
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

  return date.toLocaleDateString();
}

/* ── styled-components ── */

const HiddenInput = styled.input`
  display: none;
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Stack = styled.div<{ $gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${p => p.$gap || '0.5rem'};
`;

const RecentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
`;

const RemoveButton = styled.button`
  padding: 0.25rem;
  border-radius: ${p => p.theme.radii.sm};
  border: none;
  background: transparent;
  color: ${p => p.theme.colors.textTertiary};
  opacity: 0;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.error};
  }
`;

const RecentCard = styled.div<{ $compact?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: ${p => (p.$compact ? '0.5rem' : '0.75rem')};
  background: ${p => p.theme.colors.bgSecondary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.lg};
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }

  &:hover ${RemoveButton} {
    opacity: 1;
  }
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardName = styled.div`
  font-weight: 500;
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardMeta = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardTimestamp = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
  margin-top: 0.125rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: ${p => p.theme.colors.textTertiary};
`;

const EmptyIcon = styled(FileJson)`
  display: block;
  margin: 0 auto 0.5rem;
  opacity: 0.5;
`;

const EmptyTitle = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
  margin: 0;
`;

const EmptySubtitle = styled.p`
  font-size: ${p => p.theme.fontSizes.xs};
  margin: 0.25rem 0 0;
`;

const ScrollableList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 150px;
  overflow-y: auto;
`;

const Divider = styled.div`
  border-top: 1px solid ${p => p.theme.colors.border};
  padding-top: 0.75rem;
`;

const HintText = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 0.5rem;
`;

const PasteDescription = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textSecondary};
  margin: 0;
`;

const MonoTextArea = styled(TextArea)`
  font-family: ${p => p.theme.fonts.mono};
  font-size: ${p => p.theme.fontSizes.sm};
`;

const ErrorText = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.error};
  margin: 0;
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

const Spacer = styled.div`
  flex: 1;
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;

/* ── component ── */

interface ImportExportProps {
  onImportSchema: (schema: unknown) => void;
  onImportJSON: (data: unknown) => void;
  onExportJSON: () => string;
  hasSchema: boolean;
}

export function ImportExport({
  onImportSchema,
  onImportJSON,
  onExportJSON,
  hasSchema,
}: ImportExportProps) {
  const schemaInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Schema modal state
  const [isLoadSchemaModalOpen, setIsLoadSchemaModalOpen] = useState(false);
  const [recentSchemas, setRecentSchemas] = useState<RecentItem[]>([]);

  // JSON modal state
  const [isLoadJSONModalOpen, setIsLoadJSONModalOpen] = useState(false);
  const [recentJSON, setRecentJSON] = useState<RecentItem[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Generate from Image modal state
  const [isGenerateFromImageModalOpen, setIsGenerateFromImageModalOpen] = useState(false);

  // Load recents on mount
  useEffect(() => {
    setRecentSchemas(loadRecents(RECENT_SCHEMAS_KEY));
    setRecentJSON(loadRecents(RECENT_JSON_KEY));
  }, []);

  const handleSchemaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;

        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        const schema = JSON.parse(text);
        loadSchema(schema, file.name);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Invalid JSON Schema file: ${errorMessage}`);
        console.error('Schema parse error:', err);
      }
    };
    reader.onerror = () => {
      alert(`Failed to read file: ${reader.error?.message || 'Unknown error'}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadSchema = (schema: unknown, filename?: string) => {
    if (!schema) {
      console.error('No schema data to load');
      return;
    }

    // Save to recents
    const recentItem: RecentItem = {
      id: generateId(schema),
      name: getSchemaName(schema),
      source: filename || 'Pasted',
      timestamp: Date.now(),
      data: schema,
    };
    const updated = saveRecent(RECENT_SCHEMAS_KEY, recentItem);
    setRecentSchemas(updated);

    // Import and close modal
    onImportSchema(schema);
    setIsLoadSchemaModalOpen(false);
  };

  const handleJSONFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;

        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        const data = JSON.parse(text);
        loadJSON(data, file.name);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Invalid JSON file: ${errorMessage}`);
        console.error('JSON parse error:', err);
      }
    };
    reader.onerror = () => {
      alert(`Failed to read file: ${reader.error?.message || 'Unknown error'}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadJSON = (data: unknown, filename?: string) => {
    if (!data) {
      console.error('No JSON data to load');
      return;
    }

    // Save to recents
    const recentItem: RecentItem = {
      id: generateId(data),
      name: getJSONName(data),
      source: filename || 'Pasted',
      timestamp: Date.now(),
      data: data,
    };
    const updated = saveRecent(RECENT_JSON_KEY, recentItem);
    setRecentJSON(updated);

    // Import and close modal
    onImportJSON(data);
    setIsLoadJSONModalOpen(false);
    setJsonText('');
    setJsonError(null);
  };

  const handleExport = () => {
    const jsonString = onExportJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadJSONFromText = () => {
    if (!jsonText.trim()) {
      setJsonError('Please enter some JSON');
      return;
    }

    try {
      const data = JSON.parse(jsonText);
      loadJSON(data);
    } catch (err) {
      setJsonError('Invalid JSON: ' + (err as Error).message);
    }
  };

  const openLoadSchemaModal = () => {
    setRecentSchemas(loadRecents(RECENT_SCHEMAS_KEY));
    setIsLoadSchemaModalOpen(true);
  };

  const openLoadJSONModal = () => {
    setRecentJSON(loadRecents(RECENT_JSON_KEY));
    setJsonText('');
    setJsonError(null);
    setIsLoadJSONModalOpen(true);
  };

  const handleRemoveRecentSchema = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecent(RECENT_SCHEMAS_KEY, id);
    setRecentSchemas(updated);
  };

  const handleRemoveRecentJSON = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecent(RECENT_JSON_KEY, id);
    setRecentJSON(updated);
  };

  return (
    <>
      {/* Hidden file inputs */}
      <HiddenInput
        ref={schemaInputRef}
        type="file"
        accept=".json"
        onChange={handleSchemaFileChange}
      />
      <HiddenInput
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={handleJSONFileChange}
      />

      <ToolbarRow>
        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSettingsModalOpen(true)}
          title="Settings"
        >
          <Settings size={16} />
        </Button>

        {/* Load Schema Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={openLoadSchemaModal}
        >
          <FileJson size={16} />
          Load Schema
        </Button>

        {/* Load JSON Button */}
        {hasSchema && (
          <Button
            variant="secondary"
            size="sm"
            onClick={openLoadJSONModal}
          >
            <Upload size={16} />
            Load JSON
          </Button>
        )}

        {/* Generate from Image Button */}
        {hasSchema && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGenerateFromImageModalOpen(true)}
          >
            <Sparkles size={16} />
            Generate from Image
          </Button>
        )}

        {/* Export JSON Button */}
        {hasSchema && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
          >
            <Download size={16} />
            Export JSON
          </Button>
        )}
      </ToolbarRow>

      {/* Load Schema Modal */}
      <Modal
        isOpen={isLoadSchemaModalOpen}
        onClose={() => setIsLoadSchemaModalOpen(false)}
        title="Load Schema"
        footer={
          <FullWidthButton
            variant="secondary"
            size="sm"
            onClick={() => schemaInputRef.current?.click()}
          >
            <FolderOpen size={16} />
            Load from file...
          </FullWidthButton>
        }
      >
        <Stack $gap="0.75rem">
          {recentSchemas.length > 0 ? (
            <>
              <RecentHeader>
                <Clock size={12} />
                Recent Schemas
              </RecentHeader>
              <Stack $gap="0.25rem">
                {recentSchemas.map((item) => (
                  <RecentCard
                    key={item.id}
                    onClick={() => loadSchema(item.data, item.source)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadSchema(item.data, item.source);
                      }
                    }}
                  >
                    <CardContent>
                      <CardName>{item.name}</CardName>
                      <CardMeta>{item.source}</CardMeta>
                      <CardTimestamp>{formatTimestamp(item.timestamp)}</CardTimestamp>
                    </CardContent>
                    <RemoveButton
                      onClick={(e) => handleRemoveRecentSchema(item.id, e)}
                      title="Remove from recents"
                    >
                      <Trash2 size={12} />
                    </RemoveButton>
                  </RecentCard>
                ))}
              </Stack>
            </>
          ) : (
            <EmptyState>
              <EmptyIcon size={32} />
              <EmptyTitle>No recent schemas</EmptyTitle>
              <EmptySubtitle>Load a schema file to get started</EmptySubtitle>
            </EmptyState>
          )}
        </Stack>
      </Modal>

      {/* Load JSON Modal */}
      <Modal
        isOpen={isLoadJSONModalOpen}
        onClose={() => setIsLoadJSONModalOpen(false)}
        title="Load JSON"
        footer={
          <FooterRow>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => jsonInputRef.current?.click()}
            >
              <FolderOpen size={16} />
              Load from file...
            </Button>
            <Spacer />
            <Button
              variant="primary"
              size="sm"
              onClick={handleLoadJSONFromText}
            >
              Load JSON
            </Button>
          </FooterRow>
        }
      >
        <Stack $gap="1rem">
          {/* Recent JSON */}
          {recentJSON.length > 0 && (
            <Stack $gap="0.5rem">
              <RecentHeader>
                <Clock size={12} />
                Recent Documents
              </RecentHeader>
              <ScrollableList>
                {recentJSON.map((item) => (
                  <RecentCard
                    key={item.id}
                    $compact
                    onClick={() => loadJSON(item.data, item.source)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadJSON(item.data, item.source);
                      }
                    }}
                  >
                    <CardContent>
                      <CardName>{item.name}</CardName>
                      <CardMeta>{item.source}</CardMeta>
                      <CardTimestamp>{formatTimestamp(item.timestamp)}</CardTimestamp>
                    </CardContent>
                    <RemoveButton
                      onClick={(e) => handleRemoveRecentJSON(item.id, e)}
                      title="Remove from recents"
                    >
                      <Trash2 size={12} />
                    </RemoveButton>
                  </RecentCard>
                ))}
              </ScrollableList>
              <Divider>
                <HintText>Or paste JSON below:</HintText>
              </Divider>
            </Stack>
          )}

          {/* Paste JSON */}
          {recentJSON.length === 0 && (
            <PasteDescription>
              Paste your JSON below, or load from a file.
            </PasteDescription>
          )}

          <MonoTextArea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            placeholder='{"id": "example", "root": { "children": [] }}'
            rows={recentJSON.length > 0 ? 6 : 10}
            error={!!jsonError}
          />

          {jsonError && (
            <ErrorText>{jsonError}</ErrorText>
          )}
        </Stack>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Generate from Image Modal */}
      <GenerateFromImageModal
        isOpen={isGenerateFromImageModalOpen}
        onClose={() => setIsGenerateFromImageModalOpen(false)}
        onLoadJSON={loadJSON}
      />
    </>
  );
}
