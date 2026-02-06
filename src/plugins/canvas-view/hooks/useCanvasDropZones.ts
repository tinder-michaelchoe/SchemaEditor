/**
 * useCanvasDropZones Hook
 *
 * Calculates drop zones on the canvas based on component bounds,
 * drag type, and component types (vstack, hstack, zstack, etc.)
 */

import { useMemo, useEffect, useState } from 'react';
import { useDragState } from '@/plugins/drag-drop-service';
import { getDragDropRegistry } from '@/plugins/drag-drop-service';
import type { DropZoneVisual } from '@/plugins/drag-drop-service';
import type { DragSource } from '@/plugins/drag-drop-service';

interface ComponentData {
  type: string;
  path: string;
  children?: any[];
  bounds?: DOMRect;
}

export interface UseCanvasDropZonesOptions {
  /** Map of component paths to their bounds */
  nodeBoundsMap: Map<string, DOMRect>;
  /** Component data structure from editor store */
  componentData: any;
  /** Whether drop zones are enabled */
  enabled?: boolean;
}

/**
 * Calculate drop zones for a specific component
 */
function calculateDropZonesForComponent(
  component: ComponentData,
  dragSource: DragSource | null
): DropZoneVisual[] {
  console.log('[calculateDropZones] Called for:', {
    componentType: component.type,
    componentPath: component.path,
    hasBounds: !!component.bounds,
    hasDragSource: !!dragSource,
  });

  if (!component.bounds || !dragSource) {
    console.log('[calculateDropZones] Missing bounds or dragSource');
    return [];
  }

  const registry = getDragDropRegistry();
  const zones: DropZoneVisual[] = [];

  // For canvas-node reordering, only show zones for containers that can accept children
  // Check if this component is a container that can accept the dragged item
  const canAccept = registry.canDrop(dragSource, component.type);
  console.log('[calculateDropZones] Can drop?', {
    dragSourceType: dragSource.type,
    targetType: component.type,
    canAccept,
  });

  // Skip non-container components (they can't have drop zones)
  const isContainer = ['vstack', 'hstack', 'zstack', 'forEach'].includes(component.type);
  if (!isContainer) {
    console.log('[calculateDropZones] Not a container, skipping');
    return [];
  }

  if (!canAccept) return [];

  const bounds = component.bounds;
  const children = component.children || [];

  // Layout containers: vstack, hstack, zstack
  if (component.type === 'vstack') {
    if (children.length === 0) {
      // Empty vstack: show highlight
      zones.push({
        id: `${component.path}-inside`,
        targetPath: component.path,
        bounds,
        position: 'inside',
        indicator: 'highlight',
        componentType: 'vstack',
        index: 0,
      });
    } else {
      // VStack with children: show horizontal lines between items
      children.forEach((child, index) => {
        // Calculate line position between children
        const childBounds = child.bounds as DOMRect | undefined;
        if (childBounds) {
          // Before this child
          const beforeBounds = new DOMRect(
            childBounds.left,
            childBounds.top - 4, // 4px above the child
            childBounds.width,
            8 // 8px tall line area
          );

          zones.push({
            id: `${component.path}-before-${index}`,
            targetPath: component.path,
            bounds: beforeBounds,
            position: 'before',
            indicator: 'line',
            orientation: 'horizontal',
            componentType: 'vstack',
            index,
          });
        }
      });

      // Add zone after last child
      const lastChild = children[children.length - 1];
      const lastChildBounds = lastChild?.bounds as DOMRect | undefined;
      if (lastChildBounds) {
        const afterBounds = new DOMRect(
          lastChildBounds.left,
          lastChildBounds.bottom - 4,
          lastChildBounds.width,
          8
        );

        zones.push({
          id: `${component.path}-after-${children.length - 1}`,
          targetPath: component.path,
          bounds: afterBounds,
          position: 'after',
          indicator: 'line',
          orientation: 'horizontal',
          componentType: 'vstack',
          index: children.length,
        });
      }
    }
  } else if (component.type === 'hstack') {
    console.log('[calculateDropZones] Processing hstack:', {
      path: component.path,
      childrenCount: children.length,
      children: children.map((c: any, i: number) => ({
        index: i,
        type: c.type,
        hasBounds: !!c.bounds,
      })),
    });

    if (children.length === 0) {
      // Empty hstack: show highlight
      zones.push({
        id: `${component.path}-inside`,
        targetPath: component.path,
        bounds,
        position: 'inside',
        indicator: 'highlight',
        componentType: 'hstack',
        index: 0,
      });
    } else {
      // HStack with children: show vertical lines between items
      children.forEach((child, index) => {
        const childBounds = child.bounds as DOMRect | undefined;
        console.log(`[calculateDropZones] hstack child ${index}:`, {
          type: child.type,
          hasBounds: !!childBounds,
          bounds: childBounds,
        });
        if (childBounds) {
          // Before this child
          const beforeBounds = new DOMRect(
            childBounds.left - 4, // 4px left of the child
            childBounds.top,
            8, // 8px wide line area
            childBounds.height
          );

          const zone = {
            id: `${component.path}-before-${index}`,
            targetPath: component.path,
            bounds: beforeBounds,
            position: 'before',
            indicator: 'line',
            orientation: 'vertical',
            componentType: 'hstack',
            index,
          };
          console.log('[calculateDropZones] Created hstack zone:', zone);
          zones.push(zone);
        }
      });

      // Add zone after last child
      const lastChild = children[children.length - 1];
      const lastChildBounds = lastChild?.bounds as DOMRect | undefined;
      console.log('[calculateDropZones] hstack last child:', {
        hasBounds: !!lastChildBounds,
        bounds: lastChildBounds,
      });
      if (lastChildBounds) {
        const afterBounds = new DOMRect(
          lastChildBounds.right - 4,
          lastChildBounds.top,
          8,
          lastChildBounds.height
        );

        const afterZone = {
          id: `${component.path}-after-${children.length - 1}`,
          targetPath: component.path,
          bounds: afterBounds,
          position: 'after',
          indicator: 'line',
          orientation: 'vertical',
          componentType: 'hstack',
          index: children.length,
        };
        console.log('[calculateDropZones] Created hstack after zone:', afterZone);
        zones.push(afterZone);
      }
    }
  } else if (component.type === 'zstack') {
    // ZStack: always show highlight (layered on top)
    zones.push({
      id: `${component.path}-inside`,
      targetPath: component.path,
      bounds,
      position: 'inside',
      indicator: 'highlight',
      componentType: 'zstack',
      index: children.length, // Add to end
    });
  } else if (component.type === 'forEach') {
    // forEach has a template property
    if (!component.children || component.children.length === 0) {
      zones.push({
        id: `${component.path}-template`,
        targetPath: component.path,
        bounds,
        position: 'inside',
        indicator: 'highlight',
        componentType: 'forEach',
      });
    }
  }

  return zones;
}

/**
 * Recursively extract all components with bounds from the data structure
 */
function extractComponentsWithBounds(
  data: any,
  path: string,
  nodeBoundsMap: Map<string, DOMRect>
): ComponentData[] {
  const components: ComponentData[] = [];

  console.log('[extractComponents] Called for path:', path, 'type:', data?.type);

  if (!data) {
    console.log('[extractComponents] No data!');
    return components;
  }

  const bounds = nodeBoundsMap.get(path);
  console.log('[extractComponents] Bounds lookup for', path, ':', !!bounds);

  if (bounds) {
    const component: ComponentData = {
      type: data.type,
      path,
      children: data.children,
      bounds,
    };
    components.push(component);
    console.log('[extractComponents] Added component:', component.type);
  } else {
    console.log('[extractComponents] No bounds found for', path);
  }

  // Recursively process children
  if (data.children && Array.isArray(data.children)) {
    data.children.forEach((child: any, index: number) => {
      const childPath = `${path}.children[${index}]`;
      const childComponents = extractComponentsWithBounds(child, childPath, nodeBoundsMap);

      // Add bounds to children in the parent
      if (bounds) {
        const childBounds = nodeBoundsMap.get(childPath);
        if (childBounds) {
          data.children[index] = {
            ...child,
            bounds: childBounds,
          };
        }
      }

      components.push(...childComponents);
    });
  }

  return components;
}

/**
 * Hook to calculate drop zones on the canvas
 */
export function useCanvasDropZones({
  nodeBoundsMap,
  componentData,
  enabled = true,
}: UseCanvasDropZonesOptions): DropZoneVisual[] {
  const { isDragging, dragData } = useDragState();
  const [dropZones, setDropZones] = useState<DropZoneVisual[]>([]);

  useEffect(() => {
    console.log('[useCanvasDropZones] Effect triggered:', {
      enabled,
      isDragging,
      hasDragData: !!dragData,
      hasComponentData: !!componentData,
      componentDataType: componentData?.type,
      componentDataChildren: componentData?.children?.length,
    });

    if (!enabled || !isDragging || !dragData) {
      console.log('[useCanvasDropZones] Early return - not enabled or not dragging');
      setDropZones([]);
      return;
    }

    console.log('[useCanvasDropZones] Drag active:', {
      dragSourceType: dragData.source.type,
      dragSourceData: dragData.source.data,
      boundsMapSize: nodeBoundsMap.size,
      boundsKeys: Array.from(nodeBoundsMap.keys()),
    });

    // Extract all components with bounds
    // componentData is now data.root, so we extract its children
    const components: ComponentData[] = [];

    if (componentData && componentData.children && Array.isArray(componentData.children)) {
      console.log('[useCanvasDropZones] Processing', componentData.children.length, 'children');
      componentData.children.forEach((child: any, index: number) => {
        const childPath = `root.children[${index}]`;
        console.log('[useCanvasDropZones] Extracting from:', childPath, 'type:', child.type);
        const childComponents = extractComponentsWithBounds(child, childPath, nodeBoundsMap);
        console.log('[useCanvasDropZones] Got', childComponents.length, 'components from', childPath);
        components.push(...childComponents);
      });
    } else {
      console.log('[useCanvasDropZones] No children to process!', {
        hasComponentData: !!componentData,
        hasChildren: !!componentData?.children,
        isArray: Array.isArray(componentData?.children),
      });
    }

    console.log('[useCanvasDropZones] Total components extracted:', components.length);

    // Calculate drop zones for each component
    const allZones: DropZoneVisual[] = [];
    components.forEach((component) => {
      console.log('[useCanvasDropZones] Calculating zones for:', component.type, 'at', component.path);
      const zones = calculateDropZonesForComponent(component, dragData.source);
      console.log('[useCanvasDropZones] Got', zones.length, 'zones');
      allZones.push(...zones);
    });

    console.log('[useCanvasDropZones] Total zones before filtering:', allZones.length);

    // Filter out drop zones that reference the dragged element itself
    // (to prevent dropping on its own position)
    const filteredZones = allZones.filter((zone) => {
      if (dragData.source.type === 'canvas-node') {
        const draggedPath = (dragData.source.data as { path?: string }).path;
        // Don't show zones that are the exact dragged element's position
        return !zone.id.includes(draggedPath || '');
      }
      return true;
    });

    console.log('[useCanvasDropZones] Filtered zones:', filteredZones.length);
    console.log('[useCanvasDropZones] Final zones:', filteredZones);
    setDropZones(filteredZones);
  }, [enabled, isDragging, dragData, nodeBoundsMap, componentData]);

  return dropZones;
}
