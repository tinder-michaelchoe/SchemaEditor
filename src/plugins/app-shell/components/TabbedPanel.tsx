import React, { useState, useCallback, ReactNode } from 'react';

export interface TabDefinition {
  id: string;
  label: string;
  icon?: ReactNode;
  component: React.ComponentType;
  priority?: number;
}

interface TabbedPanelProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function TabbedPanel({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: TabbedPanelProps) {
  // Sort tabs by priority
  const sortedTabs = [...tabs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  
  const activeTabDef = sortedTabs.find(t => t.id === activeTab) ?? sortedTabs[0];
  const ActiveComponent = activeTabDef?.component;

  // Hide header if there's only one tab with no label or icon
  const shouldShowHeader = sortedTabs.length > 1 || sortedTabs.some(t => t.label || t.icon);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Header - hidden when single tab with no label */}
      {shouldShowHeader && (
        <div className={`flex items-center gap-1 px-2 py-1 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] ${headerClassName}`}>
          {sortedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md
                transition-colors duration-150
                ${activeTab === tab.id
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${contentClassName}`}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
