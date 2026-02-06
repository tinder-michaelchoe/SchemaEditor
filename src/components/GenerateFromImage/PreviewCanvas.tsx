/**
 * PreviewCanvas Component
 * Simplified read-only canvas preview for generated JSON
 */

import React from 'react';
import styled from 'styled-components';
import { CanvasNode } from '@/plugins/canvas-view/components/CanvasNode';

/* ------------------------------------------------------------------ */
/*  Styled Components                                                  */
/* ------------------------------------------------------------------ */

const CanvasBackground = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #e8e4df;
  padding: 16px;
`;

const EmptyMessage = styled.div`
  color: ${p => p.theme.colors.textTertiary};
  text-align: center;
`;

const EmptyTitle = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
`;

const EmptySubtext = styled.p`
  font-size: ${p => p.theme.fontSizes.xs};
  margin-top: 4px;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  text-align: center;
`;

const ErrorTitle = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
`;

const ErrorSubtext = styled.p`
  font-size: ${p => p.theme.fontSizes.xs};
  margin-top: 4px;
`;

const DeviceFrame = styled.div`
  background: #ffffff;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 30px;
  border: 8px solid #1a1a1a;
`;

const CanvasContent = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface PreviewCanvasProps {
  json: unknown;
}

const DEVICE_WIDTH = 390;
const DEVICE_HEIGHT = 844;

export function PreviewCanvas({ json }: PreviewCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  // Calculate scale to fit iPhone in container
  React.useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth - 32; // padding
      const containerHeight = container.clientHeight - 32;

      const scaleX = containerWidth / DEVICE_WIDTH;
      const scaleY = containerHeight / DEVICE_HEIGHT;

      // Use the smaller scale to ensure it fits
      setScale(Math.min(scaleX, scaleY, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Validate that json has the expected structure
  const isValidStructure = (data: unknown): data is { root?: { children?: unknown[] } } => {
    return typeof data === 'object' && data !== null;
  };

  if (!json) {
    return (
      <CanvasBackground style={{ padding: 0 }}>
        <EmptyMessage>
          <EmptyTitle>No preview available</EmptyTitle>
          <EmptySubtext>Generate JSON to see preview</EmptySubtext>
        </EmptyMessage>
      </CanvasBackground>
    );
  }

  if (!isValidStructure(json) || !json.root || !json.root.children) {
    return (
      <CanvasBackground style={{ padding: 0 }}>
        <ErrorMessage>
          <ErrorTitle>Invalid JSON structure</ErrorTitle>
          <ErrorSubtext>JSON must have root.children array</ErrorSubtext>
        </ErrorMessage>
      </CanvasBackground>
    );
  }

  const rootChildren = json.root.children as unknown[];

  return (
    <CanvasBackground ref={containerRef}>
      {/* Device frame with fixed iPhone dimensions */}
      <DeviceFrame
        style={{
          width: DEVICE_WIDTH,
          height: DEVICE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Canvas content */}
        <CanvasContent>
          {rootChildren.map((child, index) => (
            <CanvasNode
              key={index}
              node={child as Record<string, unknown>}
              path={['root', 'children', index]}
              selectedPath={null}
              hoveredPath={null}
              editingContainerPath={null}
              onSelect={() => {}}
              onDoubleClick={() => {}}
              onHover={() => {}}
              onBoundsChange={() => {}}
              zoom={1}
            />
          ))}
        </CanvasContent>
      </DeviceFrame>
    </CanvasBackground>
  );
}
