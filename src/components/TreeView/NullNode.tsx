import styled from 'styled-components';
import { Badge } from '../ui/Badge';

interface NullNodeProps {
  onChange?: (value: null) => void;
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
`;

const HintText = styled.span`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
`;

export function NullNode({ onChange }: NullNodeProps) {
  return (
    <Wrapper>
      <Badge variant="type">null</Badge>
      {onChange && (
        <HintText>(value is null)</HintText>
      )}
    </Wrapper>
  );
}
