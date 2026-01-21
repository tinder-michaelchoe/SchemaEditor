import { useRef, useState, useEffect } from 'react';
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
      <input
        ref={schemaInputRef}
        type="file"
        accept=".json"
        onChange={handleSchemaFileChange}
        className="hidden"
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        onChange={handleJSONFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSettingsModalOpen(true)}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* Load Schema Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={openLoadSchemaModal}
        >
          <FileJson className="w-4 h-4" />
          Load Schema
        </Button>

        {/* Load JSON Button */}
        {hasSchema && (
          <Button
            variant="secondary"
            size="sm"
            onClick={openLoadJSONModal}
          >
            <Upload className="w-4 h-4" />
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
            <Sparkles className="w-4 h-4" />
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
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        )}
      </div>

      {/* Load Schema Modal */}
      <Modal
        isOpen={isLoadSchemaModalOpen}
        onClose={() => setIsLoadSchemaModalOpen(false)}
        title="Load Schema"
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => schemaInputRef.current?.click()}
            className="w-full"
          >
            <FolderOpen className="w-4 h-4" />
            Load from file...
          </Button>
        }
      >
        <div className="space-y-3">
          {recentSchemas.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Clock className="w-3 h-3" />
                Recent Schemas
              </div>
              <div className="space-y-1">
                {recentSchemas.map((item) => (
                  <div
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
                    className="
                      w-full flex items-center justify-between gap-3 p-3
                      bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]
                      border border-[var(--border-color)] rounded-lg
                      text-left transition-colors group cursor-pointer
                    "
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] truncate">
                        {item.source}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {formatTimestamp(item.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveRecentSchema(item.id, e)}
                      className="
                        p-1 rounded opacity-0 group-hover:opacity-100
                        hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)]
                        hover:text-[var(--error-color)] transition-all
                      "
                      title="Remove from recents"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              <FileJson className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent schemas</p>
              <p className="text-xs mt-1">Load a schema file to get started</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Load JSON Modal */}
      <Modal
        isOpen={isLoadJSONModalOpen}
        onClose={() => setIsLoadJSONModalOpen(false)}
        title="Load JSON"
        footer={
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => jsonInputRef.current?.click()}
            >
              <FolderOpen className="w-4 h-4" />
              Load from file...
            </Button>
            <div className="flex-1" />
            <Button
              variant="primary"
              size="sm"
              onClick={handleLoadJSONFromText}
            >
              Load JSON
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Recent JSON */}
          {recentJSON.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Clock className="w-3 h-3" />
                Recent Documents
              </div>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {recentJSON.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadJSON(item.data, item.source)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadJSON(item.data, item.source);
                      }
                    }}
                    className="
                      w-full flex items-center justify-between gap-3 p-2
                      bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]
                      border border-[var(--border-color)] rounded-lg
                      text-left transition-colors group cursor-pointer
                    "
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[var(--text-primary)] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] truncate">
                        {item.source}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {formatTimestamp(item.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveRecentJSON(item.id, e)}
                      className="
                        p-1 rounded opacity-0 group-hover:opacity-100
                        hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)]
                        hover:text-[var(--error-color)] transition-all
                      "
                      title="Remove from recents"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border-color)] pt-3">
                <div className="text-xs text-[var(--text-secondary)] mb-2">
                  Or paste JSON below:
                </div>
              </div>
            </div>
          )}
          
          {/* Paste JSON */}
          {recentJSON.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">
              Paste your JSON below, or load from a file.
            </p>
          )}
          
          <TextArea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            placeholder='{"id": "example", "root": { "children": [] }}'
            rows={recentJSON.length > 0 ? 6 : 10}
            className="font-mono text-sm"
            error={!!jsonError}
          />
          
          {jsonError && (
            <p className="text-sm text-[var(--error-color)]">
              {jsonError}
            </p>
          )}
        </div>
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
