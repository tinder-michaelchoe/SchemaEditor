import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ComponentCard } from './ComponentCard';
import type { ComponentDefinition } from '../data/componentDefinitions';

const SectionWrapper = styled.div`
  border-bottom: 1px solid ${p => p.theme.colors.border};

  &:last-child {
    border-bottom: 0;
  }
`;

const ToggleButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
  transition: background-color 150ms;
  color: inherit;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }
`;

const ToggleIconWrapper = styled.span`
  display: flex;
  color: ${p => p.theme.colors.textSecondary};
`;

const CategoryName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const ComponentCount = styled.span`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  margin-left: auto;
`;

const ComponentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.5rem 0.5rem;
`;

interface CategorySectionProps {
  name: string;
  description?: string;
  components: ComponentDefinition[];
  defaultOpen?: boolean;
  onComponentClick?: (component: ComponentDefinition) => void;
}

export function CategorySection({
  name,
  description,
  components,
  defaultOpen = true,
  onComponentClick,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <SectionWrapper>
      <ToggleButton onClick={() => setIsOpen(!isOpen)}>
        <ToggleIconWrapper>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </ToggleIconWrapper>
        <CategoryName>{name}</CategoryName>
        <ComponentCount>{components.length}</ComponentCount>
      </ToggleButton>

      {isOpen && (
        <ComponentList>
          {components.map((component) => (
            <ComponentCard
              key={component.type}
              component={component}
              onClick={() => onComponentClick?.(component)}
            />
          ))}
        </ComponentList>
      )}
    </SectionWrapper>
  );
}
