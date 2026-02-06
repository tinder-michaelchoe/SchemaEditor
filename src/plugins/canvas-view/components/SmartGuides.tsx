import React from 'react';
import styled from 'styled-components';

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

const GuidesContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

const GuideLine = styled.div`
  position: absolute;
`;

export function SmartGuides({ guides }: SmartGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <GuidesContainer>
      {guides.map((guide, index) => {
        const isCenter = guide.type === 'center-x' || guide.type === 'center-y';
        const color = isCenter ? CENTER_GUIDE_COLOR : EDGE_GUIDE_COLOR;
        const isVertical = guide.type === 'center-x' || guide.type === 'left' || guide.type === 'right';

        if (isVertical) {
          return (
            <GuideLine
              key={`${guide.type}-${index}`}
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
            <GuideLine
              key={`${guide.type}-${index}`}
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
    </GuidesContainer>
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

const IndicatorContainer = styled.div`
  position: absolute;
  pointer-events: none;
`;

const MeasurementLine = styled.div`
  position: absolute;
  background-color: #FF3366;
`;

const VerticalEndCap = styled.div`
  position: absolute;
  width: 1px;
  height: 8px;
  background-color: #FF3366;
`;

const HorizontalEndCap = styled.div`
  position: absolute;
  width: 8px;
  height: 1px;
  background-color: #FF3366;
`;

const DistanceLabel = styled.div`
  position: absolute;
  padding: 2px 4px;
  font-size: 10px;
  font-weight: 500;
  color: white;
  background-color: #FF3366;
  border-radius: ${p => p.theme.radii.sm};
`;

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
    <IndicatorContainer>
      {/* Line */}
      <MeasurementLine style={lineStyle} />

      {/* End caps */}
      {isHorizontal ? (
        <>
          <VerticalEndCap style={{ left: from.x, top: from.y - 4 }} />
          <VerticalEndCap style={{ left: to.x, top: to.y - 4 }} />
        </>
      ) : (
        <>
          <HorizontalEndCap style={{ left: from.x - 4, top: from.y }} />
          <HorizontalEndCap style={{ left: to.x - 4, top: to.y }} />
        </>
      )}

      {/* Distance label */}
      <DistanceLabel style={labelStyle}>
        {Math.round(distance)}px
      </DistanceLabel>
    </IndicatorContainer>
  );
}
