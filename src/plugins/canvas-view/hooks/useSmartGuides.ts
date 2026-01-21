import { useState, useCallback, useRef } from 'react';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Guide {
  type: 'center-x' | 'center-y' | 'left' | 'right' | 'top' | 'bottom';
  position: number;
  start: number;
  end: number;
}

interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

interface UseSmartGuidesOptions {
  snapThreshold?: number;
  enabled?: boolean;
}

export function useSmartGuides(options: UseSmartGuidesOptions = {}) {
  const { snapThreshold = 5, enabled = true } = options;
  
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);
  const nodeBoundsRef = useRef<Map<string, Bounds>>(new Map());
  const excludedPathsRef = useRef<Set<string>>(new Set());

  // Register node bounds
  const registerNodeBounds = useCallback((path: string, bounds: Bounds) => {
    nodeBoundsRef.current.set(path, bounds);
  }, []);

  const unregisterNodeBounds = useCallback((path: string) => {
    nodeBoundsRef.current.delete(path);
  }, []);

  // Set paths to exclude from snapping (e.g., the dragged node)
  const setExcludedPaths = useCallback((paths: string[]) => {
    excludedPathsRef.current = new Set(paths);
  }, []);

  // Calculate snap position and guides
  const calculateSnap = useCallback((
    draggedBounds: Bounds,
    proposedX: number,
    proposedY: number
  ): SnapResult => {
    if (!enabled) {
      return { x: proposedX, y: proposedY, guides: [] };
    }

    const guides: Guide[] = [];
    let snappedX = proposedX;
    let snappedY = proposedY;

    const draggedCenterX = proposedX + draggedBounds.width / 2;
    const draggedCenterY = proposedY + draggedBounds.height / 2;
    const draggedRight = proposedX + draggedBounds.width;
    const draggedBottom = proposedY + draggedBounds.height;

    // Check against all other nodes
    nodeBoundsRef.current.forEach((bounds, path) => {
      if (excludedPathsRef.current.has(path)) return;

      const otherCenterX = bounds.x + bounds.width / 2;
      const otherCenterY = bounds.y + bounds.height / 2;
      const otherRight = bounds.x + bounds.width;
      const otherBottom = bounds.y + bounds.height;

      // Vertical alignment (X axis)
      // Left to left
      if (Math.abs(proposedX - bounds.x) < snapThreshold) {
        snappedX = bounds.x;
        guides.push({
          type: 'left',
          position: bounds.x,
          start: Math.min(proposedY, bounds.y),
          end: Math.max(draggedBottom, otherBottom),
        });
      }
      // Right to right
      if (Math.abs(draggedRight - otherRight) < snapThreshold) {
        snappedX = otherRight - draggedBounds.width;
        guides.push({
          type: 'right',
          position: otherRight,
          start: Math.min(proposedY, bounds.y),
          end: Math.max(draggedBottom, otherBottom),
        });
      }
      // Center to center (X)
      if (Math.abs(draggedCenterX - otherCenterX) < snapThreshold) {
        snappedX = otherCenterX - draggedBounds.width / 2;
        guides.push({
          type: 'center-x',
          position: otherCenterX,
          start: Math.min(proposedY, bounds.y),
          end: Math.max(draggedBottom, otherBottom),
        });
      }
      // Left to right
      if (Math.abs(proposedX - otherRight) < snapThreshold) {
        snappedX = otherRight;
        guides.push({
          type: 'left',
          position: otherRight,
          start: Math.min(proposedY, bounds.y),
          end: Math.max(draggedBottom, otherBottom),
        });
      }
      // Right to left
      if (Math.abs(draggedRight - bounds.x) < snapThreshold) {
        snappedX = bounds.x - draggedBounds.width;
        guides.push({
          type: 'right',
          position: bounds.x,
          start: Math.min(proposedY, bounds.y),
          end: Math.max(draggedBottom, otherBottom),
        });
      }

      // Horizontal alignment (Y axis)
      // Top to top
      if (Math.abs(proposedY - bounds.y) < snapThreshold) {
        snappedY = bounds.y;
        guides.push({
          type: 'top',
          position: bounds.y,
          start: Math.min(proposedX, bounds.x),
          end: Math.max(draggedRight, otherRight),
        });
      }
      // Bottom to bottom
      if (Math.abs(draggedBottom - otherBottom) < snapThreshold) {
        snappedY = otherBottom - draggedBounds.height;
        guides.push({
          type: 'bottom',
          position: otherBottom,
          start: Math.min(proposedX, bounds.x),
          end: Math.max(draggedRight, otherRight),
        });
      }
      // Center to center (Y)
      if (Math.abs(draggedCenterY - otherCenterY) < snapThreshold) {
        snappedY = otherCenterY - draggedBounds.height / 2;
        guides.push({
          type: 'center-y',
          position: otherCenterY,
          start: Math.min(proposedX, bounds.x),
          end: Math.max(draggedRight, otherRight),
        });
      }
      // Top to bottom
      if (Math.abs(proposedY - otherBottom) < snapThreshold) {
        snappedY = otherBottom;
        guides.push({
          type: 'top',
          position: otherBottom,
          start: Math.min(proposedX, bounds.x),
          end: Math.max(draggedRight, otherRight),
        });
      }
      // Bottom to top
      if (Math.abs(draggedBottom - bounds.y) < snapThreshold) {
        snappedY = bounds.y - draggedBounds.height;
        guides.push({
          type: 'bottom',
          position: bounds.y,
          start: Math.min(proposedX, bounds.x),
          end: Math.max(draggedRight, otherRight),
        });
      }
    });

    return { x: snappedX, y: snappedY, guides };
  }, [enabled, snapThreshold]);

  // Update active guides during drag
  const updateGuides = useCallback((guides: Guide[]) => {
    setActiveGuides(guides);
  }, []);

  // Clear guides when drag ends
  const clearGuides = useCallback(() => {
    setActiveGuides([]);
  }, []);

  return {
    activeGuides,
    registerNodeBounds,
    unregisterNodeBounds,
    setExcludedPaths,
    calculateSnap,
    updateGuides,
    clearGuides,
  };
}
