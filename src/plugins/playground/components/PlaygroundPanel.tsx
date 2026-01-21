/**
 * Playground Panel Component
 * 
 * Interactive panel for debugging and testing plugins.
 * Features:
 * - Event log with filtering
 * - State inspector
 * - Plugin status overview
 */

import React, { useState, useEffect, useMemo } from 'react';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { useSelectionStore } from '../../../core/store/selectionStore';
import { useUIStore } from '../../../core/store/uiStore';
import { getEventLog, clearEventLog } from '../index';
import { X, Trash2, Search, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

type Tab = 'events' | 'state' | 'plugins';

export function PlaygroundPanel() {
  const ctx = usePluginContext();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [filter, setFilter] = useState('');
  const [events, setEvents] = useState(getEventLog());
  const [copied, setCopied] = useState(false);
  
  // Refresh events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(getEventLog());
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  const filteredEvents = useMemo(() => {
    if (!filter) return events;
    const lowerFilter = filter.toLowerCase();
    return events.filter(e => 
      e.type.toLowerCase().includes(lowerFilter) ||
      JSON.stringify(e.data).toLowerCase().includes(lowerFilter)
    );
  }, [events, filter]);
  
  const handleClear = () => {
    clearEventLog();
    setEvents([]);
  };
  
  const handleCopy = async () => {
    const text = JSON.stringify(filteredEvents, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="h-64 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Plugin Playground
          </span>
          
          {/* Tabs */}
          <div className="flex gap-1">
            {(['events', 'state', 'plugins'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors
                  ${activeTab === tab
                    ? 'bg-[var(--primary-color)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'events' && (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter events..."
                  className="w-40 pl-7 pr-2 py-1 text-xs rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
              </div>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
                title="Copy events"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-[var(--success-color)]" />
                ) : (
                  <Copy className="w-3 h-3 text-[var(--text-secondary)]" />
                )}
              </button>
              <button
                onClick={handleClear}
                className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
                title="Clear events"
              >
                <Trash2 className="w-3 h-3 text-[var(--text-secondary)]" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
          >
            <X className="w-3 h-3 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'events' && (
          <EventLog events={filteredEvents} />
        )}
        {activeTab === 'state' && (
          <StateInspector />
        )}
        {activeTab === 'plugins' && (
          <PluginStatus />
        )}
      </div>
    </div>
  );
}

// Event Log Component
function EventLog({ events }: { events: Array<{ timestamp: number; type: string; data?: unknown }> }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  if (events.length === 0) {
    return (
      <div className="text-center text-[var(--text-tertiary)] text-sm py-8">
        No events logged yet. Interact with the app to see events.
      </div>
    );
  }
  
  return (
    <div className="space-y-1 font-mono text-xs">
      {events.map((event, index) => (
        <div
          key={`${event.timestamp}-${index}`}
          className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
        >
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            {event.data !== undefined ? (
              expandedIndex === index ? (
                <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)]" />
              )
            ) : (
              <span className="w-3" />
            )}
            <span className="text-[var(--text-tertiary)]">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-[var(--primary-color)] font-medium">
              {event.type}
            </span>
          </div>
          
          {expandedIndex === index && event.data !== undefined && (
            <pre className="mt-2 p-2 text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded overflow-auto max-h-32">
              {JSON.stringify(event.data, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

// State Inspector Component
function StateInspector() {
  const { data, schema, errors } = useDocumentStore();
  const { selectedPath, editingPath } = useSelectionStore();
  const { darkMode, viewMode, expandedPaths } = useUIStore();
  
  const sections = [
    {
      title: 'Document',
      data: {
        dataPreview: JSON.stringify(data).slice(0, 100) + '...',
        hasSchema: !!schema,
        errorCount: errors.size,
      },
    },
    {
      title: 'Selection',
      data: {
        selectedPath,
        editingPath,
      },
    },
    {
      title: 'UI',
      data: {
        darkMode,
        viewMode,
        expandedCount: expandedPaths.size,
      },
    },
  ];
  
  return (
    <div className="space-y-3">
      {sections.map(section => (
        <div key={section.title} className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <h4 className="text-xs font-medium text-[var(--text-primary)] mb-2">
            {section.title}
          </h4>
          <div className="space-y-1">
            {Object.entries(section.data).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">{key}:</span>
                <span className="text-[var(--text-secondary)] font-mono">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Plugin Status Component
function PluginStatus() {
  // In a real implementation, this would get data from PluginRegistry
  const plugins = [
    { id: 'tree-view', name: 'Tree View', status: 'active' },
    { id: 'preview', name: 'Device Preview', status: 'active' },
    { id: 'error-console', name: 'Error Console', status: 'active' },
    { id: 'plugin-playground', name: 'Plugin Playground', status: 'active' },
  ];
  
  return (
    <div className="space-y-1">
      {plugins.map(plugin => (
        <div
          key={plugin.id}
          className="flex items-center justify-between p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              plugin.status === 'active' 
                ? 'bg-[var(--success-color)]' 
                : 'bg-[var(--text-tertiary)]'
            }`} />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {plugin.name}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              ({plugin.id})
            </span>
          </div>
          <span className={`text-xs ${
            plugin.status === 'active'
              ? 'text-[var(--success-color)]'
              : 'text-[var(--text-tertiary)]'
          }`}>
            {plugin.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default PlaygroundPanel;
