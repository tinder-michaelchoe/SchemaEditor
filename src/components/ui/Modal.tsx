import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import styled, { css } from 'styled-components';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'default' | 'large' | 'fullscreen';
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const ModalBox = styled.div<{ $size: 'default' | 'large' | 'fullscreen' }>`
  position: relative;
  width: 100%;
  margin: 0 1rem;
  background: ${p => p.theme.colors.bgPrimary};
  border-radius: 0.75rem;
  box-shadow: ${p => p.theme.shadows.xl};
  border: 1px solid ${p => p.theme.colors.border};
  overflow: hidden;

  ${p =>
    p.$size === 'fullscreen' &&
    css`
      max-width: 95vw;
      height: 90vh;
    `}
  ${p =>
    p.$size === 'large' &&
    css`
      max-width: 56rem;
    `}
  ${p =>
    p.$size === 'default' &&
    css`
      max-width: 32rem;
    `}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
`;

const Title = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${p => p.theme.colors.textPrimary};
  margin: 0;
`;

const Content = styled.div<{ $scrollable?: boolean }>`
  padding: 1rem;
  ${p => p.$scrollable && css`overflow: auto;`}
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
`;

export function Modal({ isOpen, onClose, title, children, footer, size = 'default' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Overlay>
      <Backdrop onClick={onClose} />
      <ModalBox $size={size}>
        <Header>
          <Title>{title}</Title>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </Header>
        <Content $scrollable={size === 'fullscreen'}>{children}</Content>
        {footer && <Footer>{footer}</Footer>}
      </ModalBox>
    </Overlay>
  );
}
