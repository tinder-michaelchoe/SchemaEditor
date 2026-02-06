import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ComponentCard } from './ComponentCard';
import { CategorySection } from './CategorySection';
import {
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  COMPONENT_DEFINITIONS,
} from '../data/componentDefinitions';
import type { ComponentDefinition } from '../data/componentDefinitions';

const Wrapper = styled.div`
  position: relative;
`;

const PopoverPanel = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  z-index: 50;
  width: 18rem;
  max-height: 70vh;
  overflow: hidden;
  background: ${p => p.theme.colors.bgSecondary};
  border-radius: ${p => p.theme.radii.lg};
  box-shadow: ${p => p.theme.shadows.xl};
  border: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const HeaderTitle = styled.h3`
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const CloseButton = styled.button`
  padding: 0.25rem;
  border-radius: ${p => p.theme.radii.sm};
  color: ${p => p.theme.colors.textSecondary};

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SearchIconWrapper = styled.span`
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  color: ${p => p.theme.colors.textTertiary};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.375rem 0.75rem 0.375rem 2rem;
  font-size: 0.875rem;
  background: ${p => p.theme.colors.bgPrimary};
  border-radius: ${p => p.theme.radii.md};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};

  &::placeholder {
    color: ${p => p.theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.accent};
  }
`;

const ComponentListArea = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
`;

const SearchResultItem = styled.div`
  padding: 0 0.25rem;
`;

const EmptyMessage = styled.p`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textTertiary};
  text-align: center;
  padding: 1rem 0;
`;

const Footer = styled.div`
  padding: 0.5rem 0.75rem;
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const FooterText = styled.p`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
`;

interface PalettePopoverProps {
  onComponentSelect?: (component: ComponentDefinition) => void;
}

export function PalettePopover({ onComponentSelect }: PalettePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const componentsByCategory = getComponentsByCategory();

  // Filter components by search query
  const filteredComponents = searchQuery
    ? COMPONENT_DEFINITIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const handleComponentClick = (component: ComponentDefinition) => {
    console.log('PalettePopover: Component clicked:', component.type);
    console.log('PalettePopover: onComponentSelect exists:', !!onComponentSelect);
    onComponentSelect?.(component);
    // Don't close - user might want to drag multiple
  };

  return (
    <Wrapper>
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus size={16} />
        Add
      </Button>

      {/* Popover - positioned to the right to stay within viewport */}
      {isOpen && (
        <PopoverPanel ref={popoverRef}>
          {/* Header with Search */}
          <Header>
            <HeaderRow>
              <HeaderTitle>Components</HeaderTitle>
              <CloseButton onClick={() => setIsOpen(false)}>
                <X size={16} />
              </CloseButton>
            </HeaderRow>
            <SearchWrapper>
              <SearchIconWrapper><Search size={16} /></SearchIconWrapper>
              <SearchInput
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchWrapper>
          </Header>

          {/* Component List */}
          <ComponentListArea>
            {filteredComponents ? (
              // Search results
              <SearchResults>
                {filteredComponents.length === 0 ? (
                  <EmptyMessage>No components found</EmptyMessage>
                ) : (
                  filteredComponents.map((component) => (
                    <SearchResultItem key={component.type}>
                      <ComponentCard
                        component={component}
                        onClick={() => handleComponentClick(component)}
                      />
                    </SearchResultItem>
                  ))
                )}
              </SearchResults>
            ) : (
              // Category view
              COMPONENT_CATEGORIES.map((category) => (
                <CategorySection
                  key={category.id}
                  name={category.name}
                  description={category.description}
                  components={componentsByCategory.get(category.id) || []}
                  defaultOpen={category.id === 'layout'}
                  onComponentClick={handleComponentClick}
                />
              ))
            )}
          </ComponentListArea>

          {/* Footer hint */}
          <Footer>
            <FooterText>
              Drag components to the tree to add them
            </FooterText>
          </Footer>
        </PopoverPanel>
      )}
    </Wrapper>
  );
}
