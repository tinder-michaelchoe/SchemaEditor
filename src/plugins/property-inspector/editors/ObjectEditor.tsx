import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const ObjectWrapper = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 0.375rem;
  overflow: hidden;
`;

const ObjectHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${p => p.theme.colors.bgTertiary};
  text-align: left;
  border: none;
  cursor: pointer;
  transition: background-color 150ms;

  &:hover {
    background: ${p => p.theme.colors.bgSecondary};
  }
`;

const ObjectTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const PropertyCount = styled.span`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  margin-left: auto;
`;

const ObjectContent = styled.div`
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const PropertyContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const AddPropertyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: ${p => p.theme.colors.bgTertiary};
  border-radius: 0.375rem;
`;

const PropertyInput = styled.input`
  flex: 1;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.accent};
  }
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textTertiary};
  text-align: center;
  padding: 0.5rem 0;
`;

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
    <ObjectWrapper>
      {title && (
        <ObjectHeader
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown size={16} color="currentColor" />
          ) : (
            <ChevronRight size={16} color="currentColor" />
          )}
          <ObjectTitle>
            {title}
          </ObjectTitle>
          <PropertyCount>
            {keys.length} {keys.length === 1 ? 'property' : 'properties'}
          </PropertyCount>
        </ObjectHeader>
      )}

      {(isOpen || !title) && (
        <ObjectContent>
          {keys.map((key) => (
            <PropertyRow key={key}>
              <PropertyContent>
                {renderProperty(key, value[key])}
              </PropertyContent>
              {onRemoveProperty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveProperty(key)}
                  disabled={disabled}
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </PropertyRow>
          ))}

          {allowAddProperty && !isAddingProperty && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingProperty(true)}
              disabled={disabled}
            >
              <Plus size={16} />
              Add Property
            </Button>
          )}

          {isAddingProperty && (
            <AddPropertyRow>
              <PropertyInput
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Property name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProperty();
                  if (e.key === 'Escape') setIsAddingProperty(false);
                }}
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
            </AddPropertyRow>
          )}

          {keys.length === 0 && !isAddingProperty && (
            <EmptyText>
              No properties
            </EmptyText>
          )}
        </ObjectContent>
      )}
    </ObjectWrapper>
  );
}
