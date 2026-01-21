/**
 * PreviewCanvas Component
 * Simplified read-only canvas preview for generated JSON
 */

import React from 'react';
import { CanvasNode } from '@/plugins/canvas-view/components/CanvasNode';

interface PreviewCanvasProps {
  json: unknown;
}

const DEVICE_WIDTH = 390;
const DEVICE_HEIGHT = 844;
const ASPECT_RATIO = DEVICE_WIDTH / DEVICE_HEIGHT; // ~0.462 (iPhone aspect ratio)

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
      <div className="preview-canvas flex items-center justify-center h-full bg-[#e8e4df]">
        <div className="text-gray-400 text-center">
          <p className="text-sm">No preview available</p>
          <p className="text-xs mt-1">Generate JSON to see preview</p>
        </div>
      </div>
    );
  }

  if (!isValidStructure(json) || !json.root || !json.root.children) {
    return (
      <div className="preview-canvas flex items-center justify-center h-full bg-[#e8e4df]">
        <div className="text-red-600 text-center">
          <p className="text-sm">Invalid JSON structure</p>
          <p className="text-xs mt-1">JSON must have root.children array</p>
        </div>
      </div>
    );
  }

  const rootChildren = json.root.children as unknown[];

  return (
    <div ref={containerRef} className="preview-canvas flex items-center justify-center h-full bg-[#e8e4df] p-4">
      {/* Device frame with fixed iPhone dimensions */}
      <div
        className="device-frame bg-white shadow-2xl overflow-hidden flex-shrink-0"
        style={{
          width: DEVICE_WIDTH,
          height: DEVICE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          borderRadius: 30,
          border: '8px solid #1a1a1a',
        }}
      >
        {/* Canvas content */}
        <div className="canvas-content h-full w-full overflow-auto">
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
        </div>
      </div>
    </div>
  );
}
