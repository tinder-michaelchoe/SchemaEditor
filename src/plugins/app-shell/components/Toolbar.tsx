import React, { ReactNode } from 'react';
import { Moon, Sun, AlertCircle, CheckCircle } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '@/components/ui/Button';

interface ToolbarProps {
  hasSchema: boolean;
  isValid: boolean;
  errorCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onShowErrors: () => void;
  importExportSlot?: ReactNode;
  children?: ReactNode;
}

const Header = styled.header`
  flex-shrink: 0;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textPrimary};
  margin: 0;
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ValidStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${p => p.theme.colors.success};
  font-size: 0.875rem;
`;

const ErrorStatus = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${p => p.theme.colors.error};
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Separator = styled.div`
  width: 1px;
  height: 1.5rem;
  background: ${p => p.theme.colors.border};
`;

export function Toolbar({
  hasSchema,
  isValid,
  errorCount,
  isDarkMode,
  onToggleDarkMode,
  onShowErrors,
  importExportSlot,
  children,
}: ToolbarProps) {
  return (
    <Header>
      <TopRow>
        <LeftGroup>
          <Title>Schema Editor</Title>

          {hasSchema && (
            <StatusGroup>
              {isValid ? (
                <ValidStatus>
                  <CheckCircle size={16} />
                  <span>Valid</span>
                </ValidStatus>
              ) : (
                <ErrorStatus onClick={onShowErrors} title="Click to show errors">
                  <AlertCircle size={16} />
                  <span>
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                </ErrorStatus>
              )}
            </StatusGroup>
          )}
        </LeftGroup>

        <RightGroup>
          {importExportSlot}
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          {children}
        </RightGroup>
      </TopRow>
    </Header>
  );
}
