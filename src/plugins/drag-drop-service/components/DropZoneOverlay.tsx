/**
 * DropZoneOverlay Component
 *
 * Main overlay component that manages and renders all drop zones during drag operations.
 * Shows line indicators for insert positions and highlight boxes for empty containers.
 */

import React, { useState, useEffect } from 'react';
import { DropZoneLine } from './DropZoneLine';
import { DropZoneHighlight } from './DropZoneHighlight';
import { useDragState } from '../useDragDrop';
import type { DropZoneVisual } from '../DragDropRegistry';

export interface DropZoneOverlayProps {
  /** Array of drop zones to render */
  zones: DropZoneVisual[];
  /** Callback when a zone is hovered */
  onZoneHover?: (zoneId: string | null) => void;
  /** Callback when a zone is clicked/dropped on */
  onZoneDrop?: (zoneId: string) => void;
  /** Whether to show zones (default: show when dragging) */
  visible?: boolean;
}

export function DropZoneOverlay({
  zones,
  onZoneHover,
  onZoneDrop,
  visible,
}: DropZoneOverlayProps) {
  const { isDragging } = useDragState();
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  // Determine visibility
  const shouldShow = visible !== undefined ? visible : isDragging;

  // Handle mouse movement to detect hover over zones
  useEffect(() => {
    if (!shouldShow) {
      setHoveredZoneId(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Find which zone (if any) the mouse is over
      let foundZone: string | null = null;

      for (const zone of zones) {
        const bounds = zone.bounds;

        // Expand bounds slightly for easier targeting
        const hitMargin = zone.indicator === 'line' ? 8 : 4;
        const expandedBounds = {
          left: bounds.left - hitMargin,
          right: bounds.right + hitMargin,
          top: bounds.top - hitMargin,
          bottom: bounds.bottom + hitMargin,
        };

        if (
          mouseX >= expandedBounds.left &&
          mouseX <= expandedBounds.right &&
          mouseY >= expandedBounds.top &&
          mouseY <= expandedBounds.bottom
        ) {
          foundZone = zone.id;
          break;
        }
      }

      if (foundZone !== hoveredZoneId) {
        setHoveredZoneId(foundZone);
        onZoneHover?.(foundZone);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [shouldShow, zones, hoveredZoneId, onZoneHover]);

  // Reset hover state when drag ends
  useEffect(() => {
    if (!isDragging) {
      setHoveredZoneId(null);
      setActiveZoneId(null);
    }
  }, [isDragging]);

  // Handle mouseup to trigger drop
  // Use capture phase to ensure this fires before useDragSource's mouseup handler
  useEffect(() => {
    if (!shouldShow) return;

    const handleMouseUp = (e: MouseEvent) => {
      // Capture zones array at the moment of mouseup, before any state changes
      const currentZones = [...zones];
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      console.log('[DropZoneOverlay] mouseup detected:', {
        mouseX,
        mouseY,
        zonesCount: currentZones.length,
        isDragging,
      });

      // Only process if we're actually dragging
      if (!isDragging) {
        console.log('[DropZoneOverlay] Not dragging, ignoring mouseup');
        return;
      }

      // Find which zone the mouse is over
      let foundZone = false;
      for (const zone of currentZones) {
        const bounds = zone.bounds;
        const hitMargin = zone.indicator === 'line' ? 8 : 4;
        const expandedBounds = {
          left: bounds.left - hitMargin,
          right: bounds.right + hitMargin,
          top: bounds.top - hitMargin,
          bottom: bounds.bottom + hitMargin,
        };

        if (
          mouseX >= expandedBounds.left &&
          mouseX <= expandedBounds.right &&
          mouseY >= expandedBounds.top &&
          mouseY <= expandedBounds.bottom
        ) {
          // Drop on this zone
          console.log('[DropZoneOverlay] Drop detected on zone:', zone.id);
          foundZone = true;
          onZoneDrop?.(zone.id);
          break;
        }
      }

      if (foundZone) {
        console.log('[DropZoneOverlay] Successful drop, zones should clear on next render');
      } else {
        console.log('[DropZoneOverlay] No zone found at drop location');
      }
    };

    // Use capture phase to run before other mouseup handlers
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [shouldShow, zones, onZoneDrop, isDragging]);

  // Don't render anything if not visible
  if (!shouldShow) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999, // Below drag preview (1000)
      }}
    >
      {zones.map((zone) => {
        const isHovered = hoveredZoneId === zone.id;
        const isActive = activeZoneId === zone.id;

        if (zone.indicator === 'line') {
          return (
            <DropZoneLine
              key={zone.id}
              bounds={zone.bounds}
              orientation={zone.orientation || 'horizontal'}
              isHovered={isHovered}
              isActive={isActive}
            />
          );
        }

        if (zone.indicator === 'highlight') {
          return (
            <DropZoneHighlight
              key={zone.id}
              bounds={zone.bounds}
              isHovered={isHovered}
              isActive={isActive}
              label={isHovered ? 'Drop here' : undefined}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

/**
 * Hook to manage drop zone state and rendering
 */
export function useDropZoneOverlay(zones: DropZoneVisual[]) {
  const [hoveredZone, setHoveredZone] = useState<DropZoneVisual | null>(null);

  const handleZoneHover = (zoneId: string | null) => {
    if (zoneId) {
      const zone = zones.find((z) => z.id === zoneId);
      setHoveredZone(zone || null);
    } else {
      setHoveredZone(null);
    }
  };

  return {
    hoveredZone,
    onZoneHover: handleZoneHover,
  };
}
