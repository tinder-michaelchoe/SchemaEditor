import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResizableDivider } from '@/plugins/app-shell/components/ResizableDivider';

interface SplitViewProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialSplit?: number; // 0-100 percentage for left panel
  minLeftWidth?: number;
  minRightWidth?: number;
  onSplitChange?: (split: number) => void;
}

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
    <div ref={containerRef} className="flex h-full">
      {/* Left Panel */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: `${split}%` }}
      >
        {leftPanel}
      </div>

      {/* Divider */}
      <ResizableDivider direction="horizontal" onResize={handleResize} />

      {/* Right Panel */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
