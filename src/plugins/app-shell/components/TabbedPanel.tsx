import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';

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
}

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TabHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  ${p =>
    p.$active
      ? css`
          background: ${p.theme.colors.bgPrimary};
          color: ${p.theme.colors.textPrimary};
          box-shadow: ${p.theme.shadows.sm};
        `
      : css`
          background: transparent;
          color: ${p.theme.colors.textSecondary};
          &:hover {
            color: ${p.theme.colors.textPrimary};
            background: ${p.theme.colors.bgTertiary};
          }
        `}
`;

const IconWrapper = styled.span`
  width: 1rem;
  height: 1rem;
`;

const TabContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export function TabbedPanel({ tabs, activeTab, onTabChange }: TabbedPanelProps) {
  const sortedTabs = [...tabs].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const activeTabDef = sortedTabs.find(t => t.id === activeTab) ?? sortedTabs[0];
  const ActiveComponent = activeTabDef?.component;

  const shouldShowHeader = sortedTabs.length > 1 || sortedTabs.some(t => t.label || t.icon);

  return (
    <PanelWrapper>
      {shouldShowHeader && (
        <TabHeader>
          {sortedTabs.map(tab => (
            <TabButton key={tab.id} $active={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>
              {tab.icon && <IconWrapper>{tab.icon}</IconWrapper>}
              {tab.label}
            </TabButton>
          ))}
        </TabHeader>
      )}
      <TabContent>{ActiveComponent && <ActiveComponent />}</TabContent>
    </PanelWrapper>
  );
}
