/**
 * SettingsModal Component
 * Modal container for application settings
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SystemPromptEditor } from './SystemPromptEditor';

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
      <div className="flex h-[600px]">
        {/* Tabs Sidebar */}
        <div className="w-48 border-r border-gray-200 pr-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {tab.label}
                {tab.disabled && (
                  <span className="ml-1 text-xs">(Soon)</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 pl-4 overflow-auto">
          {activeTab === 'prompt' && <SystemPromptEditor />}
          {activeTab === 'api' && (
            <div className="text-gray-500 text-center py-8">
              API Settings coming soon
            </div>
          )}
          {activeTab === 'preferences' && (
            <div className="text-gray-500 text-center py-8">
              Preferences coming soon
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
