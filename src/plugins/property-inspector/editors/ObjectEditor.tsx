import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ObjectEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  renderProperty: (key: string, value: unknown) => React.ReactNode;
  allowAddProperty?: boolean;
  onAddProperty?: (key: string) => void;
  onRemoveProperty?: (key: string) => void;
  title?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
}

export function ObjectEditor({
  value,
  onChange,
  renderProperty,
  allowAddProperty = false,
  onAddProperty,
  onRemoveProperty,
  title,
  defaultOpen = true,
  disabled = false,
}: ObjectEditorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [newKey, setNewKey] = useState('');
  const [isAddingProperty, setIsAddingProperty] = useState(false);

  const keys = Object.keys(value);

  const handleAddProperty = () => {
    if (newKey && !value.hasOwnProperty(newKey)) {
      onAddProperty?.(newKey);
      setNewKey('');
      setIsAddingProperty(false);
    }
  };

  return (
    <div className="border border-[var(--border-color)] rounded-md overflow-hidden">
      {title && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full flex items-center gap-2 px-3 py-2
            bg-[var(--bg-tertiary)] text-left
            hover:bg-[var(--bg-secondary)]
            transition-colors duration-150
          "
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </span>
          <span className="text-xs text-[var(--text-tertiary)] ml-auto">
            {keys.length} {keys.length === 1 ? 'property' : 'properties'}
          </span>
        </button>
      )}

      {(isOpen || !title) && (
        <div className="p-2 space-y-2">
          {keys.map((key) => (
            <div key={key} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {renderProperty(key, value[key])}
              </div>
              {onRemoveProperty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveProperty(key)}
                  disabled={disabled}
                  className="text-[var(--error-color)] hover:bg-[var(--error-color)]/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}

          {allowAddProperty && !isAddingProperty && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingProperty(true)}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Property
            </Button>
          )}

          {isAddingProperty && (
            <div className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded-md">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Property name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProperty();
                  if (e.key === 'Escape') setIsAddingProperty(false);
                }}
                className="
                  flex-1 px-2 py-1.5 text-sm rounded-md
                  bg-[var(--bg-primary)] border border-[var(--border-color)]
                  focus:outline-none focus:border-[var(--accent-color)]
                  text-[var(--text-primary)]
                "
              />
              <Button size="sm" onClick={handleAddProperty}>
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingProperty(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {keys.length === 0 && !isAddingProperty && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-2">
              No properties
            </p>
          )}
        </div>
      )}
    </div>
  );
}
