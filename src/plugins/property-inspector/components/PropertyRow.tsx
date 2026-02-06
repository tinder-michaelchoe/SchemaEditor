import React from 'react';
import styled from 'styled-components';
import { truncateText } from '@/styles/mixins';

const VerticalRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textSecondary};
`;

const RequiredMark = styled.span`
  color: ${p => p.theme.colors.error};
`;

const Description = styled.p`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
`;

const HorizontalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LabelColumn = styled.div`
  width: 33.333333%;
  flex-shrink: 0;
`;

const LabelTruncated = styled.label`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textSecondary};
  ${truncateText}
`;

const DescriptionTruncated = styled.p`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  ${truncateText}
`;

const ValueColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

interface PropertyRowProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  layout?: 'vertical' | 'horizontal';
}

export function PropertyRow({
  label,
  description,
  required,
  children,
  layout = 'horizontal',
}: PropertyRowProps) {
  if (layout === 'vertical') {
    return (
      <VerticalRow>
        <LabelRow>
          <Label>{label}</Label>
          {required && <RequiredMark>*</RequiredMark>}
        </LabelRow>
        {description && (
          <Description>{description}</Description>
        )}
        {children}
      </VerticalRow>
    );
  }

  return (
    <HorizontalRow>
      <LabelColumn>
        <LabelRow>
          <LabelTruncated>{label}</LabelTruncated>
          {required && <RequiredMark>*</RequiredMark>}
        </LabelRow>
        {description && (
          <DescriptionTruncated title={description}>
            {description}
          </DescriptionTruncated>
        )}
      </LabelColumn>
      <ValueColumn>{children}</ValueColumn>
    </HorizontalRow>
  );
}
