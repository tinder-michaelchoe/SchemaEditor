import { ReactNode, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import styled, { css } from 'styled-components';
import { truncateText } from '@/styles/mixins';

interface CollapsibleProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  nodeId?: string;
  title: ReactNode;
  subtitle?: string;
  badge?: ReactNode;
  error?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}

const Wrapper = styled.div<{ $isSelected?: boolean }>`
  border: 1px solid ${p => (p.$isSelected ? p.theme.colors.accent : p.theme.colors.border)};
  border-radius: ${p => p.theme.radii.lg};
  overflow: hidden;
  transition: all 0.15s;
  ${p =>
    p.$isSelected &&
    css`
      box-shadow: 0 0 0 2px ${p.theme.colors.accent}30;
    `}
`;

const HeaderRow = styled.div<{ $isSelected?: boolean; $hasError?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.15s;

  ${p =>
    p.$isSelected
      ? css`background: ${p.theme.colors.accent}1a;`
      : css`
          background: ${p.theme.colors.bgSecondary};
          &:hover { background: ${p.theme.colors.bgTertiary}; }
        `}

  ${p =>
    p.$hasError &&
    css`
      border-left: 2px solid ${p.theme.colors.error};
    `}
`;

const ClickArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  cursor: pointer;
`;

const ChevronIcon = styled(ChevronRight)<{ $isOpen?: boolean }>`
  color: ${p => p.theme.colors.textSecondary};
  transition: transform 0.15s;
  flex-shrink: 0;
  transform: rotate(${p => (p.$isOpen ? '90deg' : '0deg')});
`;

const TitleArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TitleText = styled.span`
  font-weight: 500;
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textPrimary};
  ${truncateText}
`;

const Subtitle = styled.span`
  display: block;
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textSecondary};
  ${truncateText}
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const ChildrenWrapper = styled.div`
  border-top: 1px solid ${p => p.theme.colors.border};
`;

export function Collapsible({
  isOpen,
  onToggle,
  onSelect,
  isSelected,
  nodeId,
  title,
  subtitle,
  badge,
  error,
  children,
  actions,
}: CollapsibleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const handleClick = () => {
    onSelect?.();
    onToggle();
  };

  return (
    <Wrapper ref={ref} id={nodeId} $isSelected={isSelected}>
      <HeaderRow $isSelected={isSelected} $hasError={error}>
        <ClickArea
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <ChevronIcon size={16} $isOpen={isOpen} />
          <TitleArea>
            <TitleRow>
              <TitleText>{title}</TitleText>
              {badge}
            </TitleRow>
            {subtitle && <Subtitle>{subtitle}</Subtitle>}
          </TitleArea>
        </ClickArea>
        {actions && <Actions>{actions}</Actions>}
      </HeaderRow>
      {isOpen && <ChildrenWrapper>{children}</ChildrenWrapper>}
    </Wrapper>
  );
}
