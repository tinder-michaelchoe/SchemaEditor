/**
 * SettingsModal Component
 * Modal container for application settings
 */

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { Modal } from '@/components/ui/Modal';
import { SystemPromptEditor } from './SystemPromptEditor';

/* ── Styled Components ── */

const ModalBody = styled.div`
  display: flex;
  height: 600px;
`;

const TabSidebar = styled.div`
  width: 12rem;
  border-right: 1px solid ${p => p.theme.colors.border};
  padding-right: 1rem;
`;

const TabNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TabButton = styled.button<{
  $active: boolean;
  $disabled?: boolean;
}>`
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-radius: ${p => p.theme.radii.lg};
  font-size: ${p => p.theme.fontSizes.sm};
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;

  ${p =>
    p.$active &&
    css`
      background: ${p.theme.colors.accent}1a;
      color: ${p.theme.colors.accent};
      font-weight: 500;
    `}

  ${p =>
    !p.$active &&
    !p.$disabled &&
    css`
      color: ${p.theme.colors.textPrimary};
      &:hover {
        background: ${p.theme.colors.bgTertiary};
      }
    `}

  ${p =>
    p.$disabled &&
    css`
      color: ${p.theme.colors.textTertiary};
      cursor: not-allowed;
    `}
`;

const SoonLabel = styled.span`
  margin-left: 0.25rem;
  font-size: ${p => p.theme.fontSizes.xs};
`;

const TabContent = styled.div`
  flex: 1;
  padding-left: 1rem;
  overflow: auto;
`;

const PlaceholderText = styled.div`
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  padding: 2rem 0;
`;

/* ── Component ── */

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'prompt' | 'api' | 'preferences';
}

export function SettingsModal({
  isOpen,
  onClose,
  initialTab = 'prompt',
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'api' | 'preferences'>(initialTab);

  const tabs = [
    { id: 'prompt' as const, label: 'System Prompt' },
    { id: 'api' as const, label: 'API Settings', disabled: true },
    { id: 'preferences' as const, label: 'Preferences', disabled: true },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="large"
    >
      <ModalBody>
        {/* Tabs Sidebar */}
        <TabSidebar>
          <TabNav>
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                $active={activeTab === tab.id}
                $disabled={tab.disabled}
              >
                {tab.label}
                {tab.disabled && (
                  <SoonLabel>(Soon)</SoonLabel>
                )}
              </TabButton>
            ))}
          </TabNav>
        </TabSidebar>

        {/* Tab Content */}
        <TabContent>
          {activeTab === 'prompt' && <SystemPromptEditor />}
          {activeTab === 'api' && (
            <PlaceholderText>
              API Settings coming soon
            </PlaceholderText>
          )}
          {activeTab === 'preferences' && (
            <PlaceholderText>
              Preferences coming soon
            </PlaceholderText>
          )}
        </TabContent>
      </ModalBody>
    </Modal>
  );
}
