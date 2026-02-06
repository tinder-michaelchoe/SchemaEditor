import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ResizableDivider } from '@/plugins/app-shell/components/ResizableDivider';

interface SplitViewProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialSplit?: number; // 0-100 percentage for left panel
  minLeftWidth?: number;
  minRightWidth?: number;
  onSplitChange?: (split: number) => void;
}

const Container = styled.div`
  display: flex;
  height: 100%;
`;

const LeftPanel = styled.div`
  flex-shrink: 0;
  overflow: hidden;
`;

const RightPanel = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

export function SplitView({
  leftPanel,
  rightPanel,
  initialSplit = 50,
  minLeftWidth = 200,
  minRightWidth = 200,
  onSplitChange,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(initialSplit);

  const handleResize = useCallback((delta: number) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const deltaPercent = (delta / containerWidth) * 100;
    
    setSplit((prev) => {
      const newSplit = prev + deltaPercent;
      const minLeft = (minLeftWidth / containerWidth) * 100;
      const maxLeft = 100 - (minRightWidth / containerWidth) * 100;
      const clampedSplit = Math.min(maxLeft, Math.max(minLeft, newSplit));
      
      onSplitChange?.(clampedSplit);
      return clampedSplit;
    });
  }, [minLeftWidth, minRightWidth, onSplitChange]);

  return (
    <Container ref={containerRef}>
      {/* Left Panel */}
      <LeftPanel style={{ width: `${split}%` }}>
        {leftPanel}
      </LeftPanel>

      {/* Divider */}
      <ResizableDivider direction="horizontal" onResize={handleResize} />

      {/* Right Panel */}
      <RightPanel>
        {rightPanel}
      </RightPanel>
    </Container>
  );
}
