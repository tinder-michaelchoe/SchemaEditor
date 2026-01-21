import React from 'react';

interface Guide {
  type: 'center-x' | 'center-y' | 'left' | 'right' | 'top' | 'bottom';
  position: number;
  start: number;
  end: number;
}

interface SmartGuidesProps {
  guides: Guide[];
}

const CENTER_GUIDE_COLOR = '#FF3366'; // Red for center alignment
const EDGE_GUIDE_COLOR = '#FF69B4';   // Pink for edge alignment

export function SmartGuides({ guides }: SmartGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {guides.map((guide, index) => {
        const isCenter = guide.type === 'center-x' || guide.type === 'center-y';
        const color = isCenter ? CENTER_GUIDE_COLOR : EDGE_GUIDE_COLOR;
        const isVertical = guide.type === 'center-x' || guide.type === 'left' || guide.type === 'right';

        if (isVertical) {
          return (
            <div
              key={`${guide.type}-${index}`}
              className="absolute"
              style={{
                left: guide.position,
                top: guide.start,
                width: 1,
                height: guide.end - guide.start,
                backgroundColor: color,
              }}
            />
          );
        } else {
          return (
            <div
              key={`${guide.type}-${index}`}
              className="absolute"
              style={{
                left: guide.start,
                top: guide.position,
                width: guide.end - guide.start,
                height: 1,
                backgroundColor: color,
              }}
            />
          );
        }
      })}
    </div>
  );
}

/**
 * Distance measurement indicator
 */
interface DistanceIndicatorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  distance: number;
  direction: 'horizontal' | 'vertical';
}

export function DistanceIndicator({ from, to, distance, direction }: DistanceIndicatorProps) {
  const isHorizontal = direction === 'horizontal';
  
  const lineStyle: React.CSSProperties = isHorizontal
    ? {
        left: Math.min(from.x, to.x),
        top: from.y,
        width: Math.abs(to.x - from.x),
        height: 1,
      }
    : {
        left: from.x,
        top: Math.min(from.y, to.y),
        width: 1,
        height: Math.abs(to.y - from.y),
      };

  const labelStyle: React.CSSProperties = isHorizontal
    ? {
        left: (from.x + to.x) / 2,
        top: from.y - 16,
        transform: 'translateX(-50%)',
      }
    : {
        left: from.x + 8,
        top: (from.y + to.y) / 2,
        transform: 'translateY(-50%)',
      };

  return (
    <div className="absolute pointer-events-none">
      {/* Line */}
      <div
        className="absolute bg-[#FF3366]"
        style={lineStyle}
      />
      
      {/* End caps */}
      {isHorizontal ? (
        <>
          <div
            className="absolute w-px h-2 bg-[#FF3366]"
            style={{ left: from.x, top: from.y - 4 }}
          />
          <div
            className="absolute w-px h-2 bg-[#FF3366]"
            style={{ left: to.x, top: to.y - 4 }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute w-2 h-px bg-[#FF3366]"
            style={{ left: from.x - 4, top: from.y }}
          />
          <div
            className="absolute w-2 h-px bg-[#FF3366]"
            style={{ left: to.x - 4, top: to.y }}
          />
        </>
      )}
      
      {/* Distance label */}
      <div
        className="absolute px-1 py-0.5 text-[10px] font-medium text-white bg-[#FF3366] rounded"
        style={labelStyle}
      >
        {Math.round(distance)}px
      </div>
    </div>
  );
}
