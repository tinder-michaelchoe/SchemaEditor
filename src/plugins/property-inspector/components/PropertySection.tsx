import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SectionWrapper = styled.div`
  border-bottom: 1px solid ${p => p.theme.colors.border};

  &:last-child {
    border-bottom: 0;
  }
`;

const SectionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: ${p => p.theme.colors.textSecondary};
  transition: background-color 150ms;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }
`;

const SectionTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const SectionContent = styled.div`
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

interface PropertySectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function PropertySection({
  title,
  defaultOpen = true,
  children,
}: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <SectionWrapper>
      <SectionButton onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <ChevronDown size={16} color="currentColor" />
        ) : (
          <ChevronRight size={16} color="currentColor" />
        )}
        <SectionTitle>{title}</SectionTitle>
      </SectionButton>

      {isOpen && <SectionContent>{children}</SectionContent>}
    </SectionWrapper>
  );
}
