import styled from 'styled-components';
import { Badge } from '../ui/Badge';

interface ConstNodeProps {
  value: unknown;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
`;

const CodeValue = styled.code`
  font-size: ${p => p.theme.fontSizes.sm};
  font-family: ${p => p.theme.fonts.mono};
  color: ${p => p.theme.colors.textPrimary};
  background: ${p => p.theme.colors.bgTertiary};
  padding: 0.125rem 0.5rem;
  border-radius: ${p => p.theme.radii.sm};
`;

export function ConstNode({ value }: ConstNodeProps) {
  const displayValue = typeof value === 'string'
    ? `"${value}"`
    : JSON.stringify(value);

  return (
    <Wrapper>
      <CodeValue>{displayValue}</CodeValue>
      <Badge variant="type">const</Badge>
    </Wrapper>
  );
}
