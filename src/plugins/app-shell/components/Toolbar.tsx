import React, { ReactNode } from 'react';
import { Moon, Sun, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ToolbarProps {
  // Schema state
  hasSchema: boolean;
  isValid: boolean;
  errorCount: number;
  
  // Theme
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  
  // Error handling
  onShowErrors: () => void;
  
  // Import/Export slot
  importExportSlot?: ReactNode;
  
  // Additional toolbar items
  children?: ReactNode;
}

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
    <header className="flex-shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
      {/* Top Row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Schema Editor
          </h1>
          
          {hasSchema && (
            <div className="flex items-center gap-2">
              {isValid ? (
                <div className="flex items-center gap-1 text-[var(--success-color)]">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Valid</span>
                </div>
              ) : (
                <button
                  onClick={onShowErrors}
                  className="flex items-center gap-1 text-[var(--error-color)] hover:underline cursor-pointer"
                  title="Click to show errors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Import/Export slot */}
          {importExportSlot}
          
          <div className="w-px h-6 bg-[var(--border-color)]" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          
          {/* Additional toolbar items */}
          {children}
        </div>
      </div>
    </header>
  );
}
