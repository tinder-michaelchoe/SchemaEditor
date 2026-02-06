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
import styled, { css } from 'styled-components';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { useSelectionStore } from '../../../core/store/selectionStore';
import { useUIStore } from '../../../core/store/uiStore';
import { getEventLog, clearEventLog } from '../index';
import { X, Trash2, Search, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

type Tab = 'events' | 'state' | 'plugins';

/* ── Styled Components ── */

const PanelWrapper = styled.div`
  height: 16rem;
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
  display: flex;
  flex-direction: column;
`;

const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;

  ${p =>
    p.$active
      ? css`
          background: ${p.theme.colors.accent};
          color: #fff;
        `
      : css`
          background: transparent;
          color: ${p.theme.colors.textSecondary};
          &:hover {
            color: ${p.theme.colors.textPrimary};
            background: ${p.theme.colors.bgPrimary};
          }
        `}
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${p => p.theme.colors.textTertiary};
`;

const FilterInput = styled.input`
  width: 10rem;
  padding: 0.25rem 0.5rem 0.25rem 1.75rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};

  &::placeholder {
    color: ${p => p.theme.colors.textTertiary};
  }
`;

const IconButton = styled.button`
  padding: 0.25rem;
  border-radius: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0.5rem;
`;

/* ── Event Log styled ── */

const EmptyState = styled.div`
  text-align: center;
  color: ${p => p.theme.colors.textTertiary};
  font-size: 0.875rem;
  padding: 2rem 0;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: monospace;
  font-size: 0.75rem;
`;

const EventCard = styled.div`
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
`;

const EventHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const Timestamp = styled.span`
  color: ${p => p.theme.colors.textTertiary};
`;

const EventType = styled.span`
  color: ${p => p.theme.colors.accent};
  font-weight: 500;
`;

const Spacer = styled.span`
  width: 0.75rem;
`;

const EventDataPre = styled.pre`
  margin-top: 0.5rem;
  padding: 0.5rem;
  color: ${p => p.theme.colors.textSecondary};
  background: ${p => p.theme.colors.bgTertiary};
  border-radius: 0.25rem;
  overflow: auto;
  max-height: 8rem;
`;

/* ── State Inspector styled ── */

const SectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionCard = styled.div`
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
`;

const SectionTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
  margin-bottom: 0.5rem;
`;

const KeyValueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const KeyValueRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const KeyLabel = styled.span`
  color: ${p => p.theme.colors.textTertiary};
`;

const ValueLabel = styled.span`
  color: ${p => p.theme.colors.textSecondary};
  font-family: monospace;
`;

/* ── Plugin Status styled ── */

const PluginList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PluginRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
`;

const PluginInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusDot = styled.div<{ $active: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: ${p => (p.$active ? p.theme.colors.success : p.theme.colors.textTertiary)};
`;

const PluginName = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const PluginId = styled.span`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
`;

const StatusLabel = styled.span<{ $active: boolean }>`
  font-size: 0.75rem;
  color: ${p => (p.$active ? p.theme.colors.success : p.theme.colors.textTertiary)};
`;

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
    <PanelWrapper>
      {/* Header */}
      <HeaderBar>
        <HeaderLeft>
          <HeaderTitle>Plugin Playground</HeaderTitle>

          {/* Tabs */}
          <TabGroup>
            {(['events', 'state', 'plugins'] as Tab[]).map(tab => (
              <TabButton
                key={tab}
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabButton>
            ))}
          </TabGroup>
        </HeaderLeft>

        <HeaderRight>
          {activeTab === 'events' && (
            <>
              <SearchWrapper>
                <SearchIcon size={12} />
                <FilterInput
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter events..."
                />
              </SearchWrapper>
              <IconButton onClick={handleCopy} title="Copy events">
                {copied ? (
                  <Check size={12} color="var(--success-color)" />
                ) : (
                  <Copy size={12} color="var(--text-secondary)" />
                )}
              </IconButton>
              <IconButton onClick={handleClear} title="Clear events">
                <Trash2 size={12} color="var(--text-secondary)" />
              </IconButton>
            </>
          )}
          <IconButton onClick={() => setIsOpen(false)}>
            <X size={12} color="var(--text-secondary)" />
          </IconButton>
        </HeaderRight>
      </HeaderBar>

      {/* Content */}
      <ContentArea>
        {activeTab === 'events' && (
          <EventLog events={filteredEvents} />
        )}
        {activeTab === 'state' && (
          <StateInspector />
        )}
        {activeTab === 'plugins' && (
          <PluginStatus />
        )}
      </ContentArea>
    </PanelWrapper>
  );
}

// Event Log Component
function EventLog({ events }: { events: Array<{ timestamp: number; type: string; data?: unknown }> }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  if (events.length === 0) {
    return (
      <EmptyState>
        No events logged yet. Interact with the app to see events.
      </EmptyState>
    );
  }

  return (
    <EventList>
      {events.map((event, index) => (
        <EventCard key={`${event.timestamp}-${index}`}>
          <EventHeader
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            {event.data !== undefined ? (
              expandedIndex === index ? (
                <ChevronDown size={12} color="var(--text-tertiary)" />
              ) : (
                <ChevronRight size={12} color="var(--text-tertiary)" />
              )
            ) : (
              <Spacer />
            )}
            <Timestamp>
              {new Date(event.timestamp).toLocaleTimeString()}
            </Timestamp>
            <EventType>
              {event.type}
            </EventType>
          </EventHeader>

          {expandedIndex === index && event.data !== undefined && (
            <EventDataPre>
              {JSON.stringify(event.data, null, 2)}
            </EventDataPre>
          )}
        </EventCard>
      ))}
    </EventList>
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
    <SectionList>
      {sections.map(section => (
        <SectionCard key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <KeyValueList>
            {Object.entries(section.data).map(([key, value]) => (
              <KeyValueRow key={key}>
                <KeyLabel>{key}:</KeyLabel>
                <ValueLabel>{String(value)}</ValueLabel>
              </KeyValueRow>
            ))}
          </KeyValueList>
        </SectionCard>
      ))}
    </SectionList>
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
    <PluginList>
      {plugins.map(plugin => (
        <PluginRow key={plugin.id}>
          <PluginInfo>
            <StatusDot $active={plugin.status === 'active'} />
            <PluginName>{plugin.name}</PluginName>
            <PluginId>({plugin.id})</PluginId>
          </PluginInfo>
          <StatusLabel $active={plugin.status === 'active'}>
            {plugin.status}
          </StatusLabel>
        </PluginRow>
      ))}
    </PluginList>
  );
}

export default PlaygroundPanel;
