import React, { useState, useCallback, useRef, useEffect, ReactNode, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { usePersistentUIStore } from '@/plugins/app-shell/hooks/usePersistence';
import { useCanvasNavigation } from '../hooks/useCanvasNavigation';
import { useCanvasSelection } from '../hooks/useCanvasSelection';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSmartGuides } from '../hooks/useSmartGuides';
import { CanvasNode } from './CanvasNode';
import { SelectionOverlay, HoverOverlay, MarqueeOverlay } from './SelectionOverlay';
import type { EdgePin, ResizeHandle } from './SelectionOverlay';
import { SmartGuides } from './SmartGuides';
import { CanvasToolbar, DEVICE_FRAMES } from './CanvasToolbar';
import { CanvasMinimap } from './CanvasMinimap';
import { LayersPanel } from '@/plugins/layers-panel/components/LayersPanel';
import { ResizableDivider } from '@/plugins/app-shell/components/ResizableDivider';
import { stringToPath, getValueAtPath, pathToString } from '@/utils/pathUtils';
import { DropZoneOverlay, useDragState } from '@/plugins/drag-drop-service';
import type { DropZoneVisual } from '@/plugins/drag-drop-service';
import { useCanvasDropZones } from '../hooks/useCanvasDropZones';
import { useContextMenu } from '@/plugins/context-menu/hooks/useContextMenu';
import { ContextMenu } from '@/plugins/context-menu/components/ContextMenu';
import { FloatingPalette } from '@/plugins/component-palette';
import { Layers } from 'lucide-react';
import styled from 'styled-components';

// ─── Styled Components ───────────────────────────────────────────────────────

const CanvasWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ContentRow = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;

const CollapsedLayersBar = styled.div`
  flex-shrink: 0;
  width: 3rem;
  background-color: ${p => p.theme.colors.bgSecondary};
  border-right: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

const ExpandButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.25rem;
  color: ${p => p.theme.colors.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;

  &:hover {
    background-color: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.textPrimary};
  }
`;

const LayersPanelWrapper = styled.div`
  flex-shrink: 0;
  background-color: ${p => p.theme.colors.bgSecondary};
  border-right: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const LayersHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
`;

const LayersTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const CollapseButton = styled.button`
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: ${p => p.theme.colors.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;

  &:hover {
    background-color: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.textPrimary};
  }
`;

const CanvasArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const GridOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const TransformedContent = styled.div`
  position: absolute;
  transform-origin: top left;
`;

const DeviceFrame = styled.div`
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 3px;
  overflow: hidden;
`;

const DeviceLabel = styled.div`
  position: absolute;
  top: -1.5rem;
  left: 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
`;

const ContentArea = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const OverlaysContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const EmptyStateMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${p => p.theme.colors.textTertiary};
  font-size: 0.875rem;
`;

const NoComponentsMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${p => p.theme.colors.textTertiary};
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
`;

const DocumentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
`;

const InspectorWrapper = styled.div`
  flex-shrink: 0;
  background-color: ${p => p.theme.colors.bgSecondary};
  border-left: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const InspectorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background-color: ${p => p.theme.colors.bgTertiary};
`;

const InspectorTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InspectorIcon = styled.svg`
  color: ${p => p.theme.colors.textSecondary};
`;

const InspectorTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const InspectorContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const DialogBox = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  max-width: 24rem;
  margin-left: 1rem;
  margin-right: 1rem;
`;

const DialogTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const DialogMessage = styled.p`
  color: #4b5563;
  margin-bottom: 1rem;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;

  &:hover {
    background-color: #e5e7eb;
  }
`;

const DeleteButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #ef4444;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;

  &:hover {
    background-color: #dc2626;
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

type Tool = 'select' | 'hand';

interface CanvasViewProps {
  inspectorPanel?: ReactNode;
}

export function CanvasView({ inspectorPanel }: CanvasViewProps) {
  const {
    data,
    selectedPath,
    setSelectedPath,
    updateValue,
    addArrayItem,
    removeArrayItem,
    undo,
    redo,
  } = useEditorStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeletePath, setPendingDeletePath] = useState<string | null>(null);

  const {
    canvasZoom,
    canvasPanX,
    canvasPanY,
    canvasDevice,
    layersPanelWidth,
    isLayersPanelOpen,
    isLayersPanelCollapsed,
    isMinimapExpanded,
    inspectorWidth,
    setCanvasZoom,
    setCanvasPan,
    setCanvasDevice,
    setLayersPanelWidth,
    setIsLayersPanelCollapsed,
    setIsMinimapExpanded,
    setInspectorWidth,
  } = usePersistentUIStore();

  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<unknown>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeBoundsRef = useRef<Map<string, DOMRect>>(new Map());

  // Drag and drop state
  const { isDragging, dragData } = useDragState();
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Context menu state
  const {
    visible: menuVisible,
    position: menuPosition,
    actions: menuActions,
    showMenu,
    hideMenu,
    handleAction,
  } = useContextMenu();

  // Calculate drop zones dynamically based on component bounds
  const dropZones = useCanvasDropZones({
    nodeBoundsMap: nodeBoundsRef.current,
    componentData: data?.root,
    enabled: isDragging,
  });

  // Handle drop on canvas drop zone
  const handleCanvasDrop = useCallback((zoneId: string) => {
    console.log('[CanvasView] handleCanvasDrop called:', {
      zoneId,
      hasDragData: !!dragData,
      dragDataType: dragData?.source.type,
    });

    if (!dragData) {
      console.log('[CanvasView] No dragData, aborting');
      return;
    }

    const zone = dropZones.find(z => z.id === zoneId);
    if (!zone) {
      console.log('[CanvasView] Zone not found:', zoneId);
      return;
    }

    console.log('[CanvasView] Found zone:', {
      zoneId: zone.id,
      targetPath: zone.targetPath,
      position: zone.position,
      index: zone.index,
    });

    // Store drag source info before it gets cleared
    const dragSourceType = dragData.source.type;

    // Handle palette-component drops (adding new components)
    if (dragData.source.type === 'palette-component') {
      const componentData = dragData.source.data as {
        type: string;
        name: string;
        defaultProps?: any;
      };

      // Create the new component
      const newComponent = {
        type: componentData.type,
        ...componentData.defaultProps,
      };

      // Parse the target path and insert at the correct index
      const pathParts = zone.targetPath.split('.');
      const pathArray: (string | number)[] = [];

      for (const part of pathParts) {
        if (part.includes('[')) {
          // Handle array notation like "children[0]"
          const [key, indexStr] = part.split('[');
          if (key) pathArray.push(key);
          const index = parseInt(indexStr.replace(']', ''));
          if (!isNaN(index)) pathArray.push(index);
        } else {
          pathArray.push(part);
        }
      }

      // Always append 'children' to target the container's children array
      pathArray.push('children');

      // Get the array at the target path
      const targetArray = getValueAtPath(data, pathArray);

      if (Array.isArray(targetArray) && zone.index !== undefined) {
        // Insert at specific index
        const newArray = [...targetArray];
        newArray.splice(zone.index, 0, newComponent);
        updateValue(pathArray, newArray);

        // Select the new component
        const newComponentPath = [...pathArray, zone.index].join('.');
        setSelectedPath(newComponentPath);
      } else {
        // Append to end
        addArrayItem(pathArray, newComponent);

        // Select the new component
        const newIndex = targetArray ? targetArray.length : 0;
        const newComponentPath = [...pathArray, newIndex].join('.');
        setSelectedPath(newComponentPath);
      }
    }

    // Handle canvas-node drops (reordering existing components)
    else if (dragData.source.type === 'canvas-node') {
      console.log('[CanvasView] Handling canvas-node drop (reorder)');

      const sourceData = dragData.source.data as {
        path: string;
        type: string;
        componentData: any;
      };

      console.log('[CanvasView] Source data:', {
        path: sourceData.path,
        type: sourceData.type,
      });

      const sourcePath = stringToPath(sourceData.path);
      console.log('[CanvasView] Source path parsed:', sourcePath);

      // Parse the target path
      const pathParts = zone.targetPath.split('.');
      const targetPathArray: (string | number)[] = [];

      for (const part of pathParts) {
        if (part.includes('[')) {
          const [key, indexStr] = part.split('[');
          if (key) targetPathArray.push(key);
          const index = parseInt(indexStr.replace(']', ''));
          if (!isNaN(index)) targetPathArray.push(index);
        } else {
          targetPathArray.push(part);
        }
      }

      // Always append 'children' to target the container's children array
      // zone.targetPath points to the container (e.g., "root.children[0]" for vstack)
      // We need to append 'children' to get to its children array
      targetPathArray.push('children');

      console.log('[CanvasView] Target path with children:', targetPathArray);

      // Don't allow dropping onto itself
      const sourcePathStr = pathToString(sourcePath);
      const targetPathStr = pathToString(targetPathArray);
      if (sourcePathStr === targetPathStr && zone.index !== undefined) {
        // Check if source and target are in the same array
        const sourceParentPath = sourcePath.slice(0, -1);
        const sourceIndex = sourcePath[sourcePath.length - 1];

        if (pathToString(sourceParentPath) === targetPathStr &&
            typeof sourceIndex === 'number' &&
            sourceIndex === zone.index) {
          return; // Dropping on same position
        }
      }

      // Perform the move
      const sourceParentPath = sourcePath.slice(0, -2);
      const sourceArrayKey = sourcePath[sourcePath.length - 2];
      const sourceIndex = sourcePath[sourcePath.length - 1];

      console.log('[CanvasView] Move details:', {
        sourceParentPath,
        sourceArrayKey,
        sourceIndex,
        zoneIndex: zone.index,
      });

      if (typeof sourceIndex === 'number' && zone.index !== undefined) {
        const sourceArrayPath = [...sourceParentPath, sourceArrayKey];

        console.log('[CanvasView] Source array path:', sourceArrayPath);
        console.log('[CanvasView] Target array path:', targetPathArray);

        // Check if moving within same array
        if (pathToString(sourceArrayPath) === targetPathStr) {
          // Moving within same array - use moveArrayItem
          console.log('[CanvasView] Moving within same array:', {
            fromIndex: sourceIndex,
            toIndex: zone.index,
          });
          useEditorStore.getState().moveArrayItem(sourceArrayPath, sourceIndex, zone.index);
        } else {
          // Moving between arrays - use moveItemBetweenArrays
          console.log('[CanvasView] Moving between arrays:', {
            sourceArray: pathToString(sourceArrayPath),
            targetArray: targetPathStr,
            fromIndex: sourceIndex,
            toIndex: zone.index,
          });
          useEditorStore.getState().moveItemBetweenArrays(
            sourceArrayPath,
            sourceIndex,
            targetPathArray,
            zone.index
          );
        }

        // Update selection to new position
        const newPath = [...targetPathArray, zone.index];
        console.log('[CanvasView] Move complete, new selection:', pathToString(newPath));
        setSelectedPath(pathToString(newPath));
      } else {
        console.log('[CanvasView] Invalid move - sourceIndex or zone.index is not a number');
      }
    } else {
      console.log('[CanvasView] Unhandled drag source type:', dragData.source.type);
    }
  }, [dragData, dropZones, data, updateValue, addArrayItem, setSelectedPath]);

  // Get current device frame dimensions
  const currentDevice = DEVICE_FRAMES.find(d => d.id === canvasDevice) || DEVICE_FRAMES[0];

  // Navigation (zoom/pan)
  const navigation = useCanvasNavigation({
    initialZoom: canvasZoom,
    initialPanX: canvasPanX,
    initialPanY: canvasPanY,
    onZoomChange: setCanvasZoom,
    onPanChange: setCanvasPan,
  });

  // Selection
  const selection = useCanvasSelection({
    selectedPath,
    onSelect: setSelectedPath,
    zoom: navigation.zoom,
    panX: navigation.panX,
    panY: navigation.panY,
  });

  // Smart guides
  const smartGuides = useSmartGuides({
    enabled: snapEnabled,
  });

  // Track node bounds
  const handleBoundsChange = useCallback((path: string, bounds: DOMRect) => {
    nodeBoundsRef.current.set(path, bounds);
    selection.registerNodeBounds(path, bounds);
    smartGuides.registerNodeBounds(path, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }, [selection, smartGuides]);

  // Handle delete with confirmation
  const handleDeleteRequest = useCallback(() => {
    if (selectedPath && selectedPath.startsWith('root.children')) {
      setPendingDeletePath(selectedPath);
      setShowDeleteConfirm(true);
    }
  }, [selectedPath]);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeletePath) {
      // Parse the path to get the array path and index
      // e.g., "root.children[0]" -> arrayPath: ["root", "children"], index: 0
      const match = pendingDeletePath.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        const arrayPathStr = match[1];
        const index = parseInt(match[2], 10);
        
        // Convert string path to array
        const arrayPath = arrayPathStr.split('.').flatMap(segment => {
          const arrMatch = segment.match(/^(.+)\[(\d+)\]$/);
          if (arrMatch) {
            return [arrMatch[1], parseInt(arrMatch[2], 10)];
          }
          return segment;
        });
        
        removeArrayItem(arrayPath, index);
        setSelectedPath(null);
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeletePath(null);
  }, [pendingDeletePath, removeArrayItem, setSelectedPath]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setPendingDeletePath(null);
  }, []);

  // Get selected node data for resize
  const selectedNodeData = useMemo(() => {
    if (!selectedPath || !data) return null;
    const pathArray = stringToPath(selectedPath);
    return getValueAtPath(data, pathArray) as Record<string, unknown> | null;
  }, [selectedPath, data]);

  // Resize handlers
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    if (selectedNodeData) {
      setResizePreview({
        width: (selectedNodeData.width as number) || 100,
        height: (selectedNodeData.height as number) || 100,
      });
    }
  }, [selectedNodeData]);

  const handleResize = useCallback((width: number, height: number, _handle: ResizeHandle) => {
    setResizePreview({ width, height });
  }, []);

  const handleResizeEnd = useCallback((width: number, height: number) => {
    if (selectedPath && width > 0 && height > 0) {
      const pathArray = stringToPath(selectedPath);
      
      // Check if this component has pinned edges - if so, don't set absolute dimensions
      const nodeData = getValueAtPath(data, pathArray) as Record<string, unknown> | null;
      const pinnedEdges = (nodeData?._pinnedEdges as string[]) || [];
      const isHorizontalPinned = pinnedEdges.includes('left') && pinnedEdges.includes('right');
      const isVerticalPinned = pinnedEdges.includes('top') && pinnedEdges.includes('bottom');
      
      // Only update dimensions that aren't pinned
      if (!isHorizontalPinned) {
        updateValue([...pathArray, 'width'], width);
      }
      if (!isVerticalPinned) {
        updateValue([...pathArray, 'height'], height);
      }
    }
    setIsResizing(false);
    setResizePreview(null);
  }, [selectedPath, updateValue, data]);

  const handleToggleAspectRatioLock = useCallback(() => {
    if (selectedPath && selectedNodeData) {
      const pathArray = stringToPath(selectedPath);
      const currentLock = selectedNodeData._aspectRatioLocked as boolean || false;
      updateValue([...pathArray, '_aspectRatioLocked'], !currentLock);
    }
  }, [selectedPath, selectedNodeData, updateValue]);

  const handleToggleEdgePin = useCallback((edge: EdgePin) => {
    if (selectedPath && selectedNodeData) {
      const pathArray = stringToPath(selectedPath);
      const currentPins = (selectedNodeData._pinnedEdges as EdgePin[]) || [];
      const newPins = currentPins.includes(edge)
        ? currentPins.filter(e => e !== edge)
        : [...currentPins, edge];
      updateValue([...pathArray, '_pinnedEdges'], newPins);
      
      // If pinning left and right, set fillWidth
      if (newPins.includes('left') && newPins.includes('right')) {
        updateValue([...pathArray, 'fillWidth'], true);
      } else {
        updateValue([...pathArray, 'fillWidth'], false);
      }
    }
  }, [selectedPath, selectedNodeData, updateValue]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    currentTool,
    onToolChange: setCurrentTool,
    selectedPath,
    onDelete: handleDeleteRequest,
    onDuplicate: () => {
      // TODO: Implement duplicate
      console.log('Duplicate:', selectedPath);
    },
    onCopy: () => {
      if (selectedPath && data) {
        // TODO: Get value at path and copy
        console.log('Copy:', selectedPath);
      }
    },
    onPaste: () => {
      if (clipboard) {
        console.log('Paste:', clipboard);
      }
    },
    onCut: () => {
      console.log('Cut:', selectedPath);
    },
    onSelectAll: selection.selectAll,
    onEscape: selection.handleEscape,
    onGroup: () => {
      console.log('Group');
    },
    onUngroup: () => {
      console.log('Ungroup');
    },
    onBringForward: () => {
      console.log('Bring forward');
    },
    onSendBackward: () => {
      console.log('Send backward');
    },
    onUndo: undo,
    onRedo: redo,
    onZoom100: () => navigation.zoomTo(1),
    onZoomToFit: navigation.zoomToFit,
    onZoomToSelection: () => {
      if (selectedPath) {
        const bounds = nodeBoundsRef.current.get(selectedPath);
        if (bounds) {
          navigation.zoomToSelection({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          });
        }
      }
    },
  });

  // Get selected node bounds for overlay
  const selectedBounds = selectedPath ? nodeBoundsRef.current.get(selectedPath) : null;
  const hoveredBounds = hoveredPath && hoveredPath !== selectedPath
    ? nodeBoundsRef.current.get(hoveredPath)
    : null;

  // Calculate content bounds for minimap
  const contentBounds = useCallback(() => {
    // Return device frame bounds
    return {
      x: 0,
      y: 0,
      width: currentDevice.width,
      height: currentDevice.height,
    };
  }, [currentDevice]);

  // Handle layers panel resize
  const handleLayersPanelResize = useCallback((delta: number) => {
    const MIN_LAYERS_WIDTH = 180;
    const MAX_LAYERS_WIDTH = 350;
    setLayersPanelWidth(
      Math.min(MAX_LAYERS_WIDTH, Math.max(MIN_LAYERS_WIDTH, layersPanelWidth + delta))
    );
  }, [layersPanelWidth, setLayersPanelWidth]);

  // Handle inspector panel resize (negative delta = growing from left)
  const handleInspectorResize = useCallback((delta: number) => {
    const MIN_INSPECTOR_WIDTH = 240;
    const MAX_INSPECTOR_WIDTH = 400;
    setInspectorWidth(
      Math.min(MAX_INSPECTOR_WIDTH, Math.max(MIN_INSPECTOR_WIDTH, inspectorWidth - delta))
    );
  }, [inspectorWidth, setInspectorWidth]);

  // Center the device frame in the viewport
  const handleCenterFrame = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate the pan values to center the frame
    const frameWidth = currentDevice.width * navigation.zoom;
    const frameHeight = currentDevice.height * navigation.zoom;

    const newPanX = (containerWidth - frameWidth) / 2;
    const newPanY = (containerHeight - frameHeight) / 2;

    navigation.setPan(newPanX, newPanY);
  }, [currentDevice, navigation]);

  // Center frame on initial load and device change
  useEffect(() => {
    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      handleCenterFrame();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDevice.id]); // Only re-center when device changes


  // Render the document as canvas nodes
  const renderDocument = () => {
    // Get the root component from the document structure
    const rootData = data && typeof data === 'object' ? (data as Record<string, unknown>).root : null;
    
    if (!rootData || typeof rootData !== 'object') {
      return (
        <EmptyStateMessage>
          No document loaded. Load a schema and JSON to see content.
        </EmptyStateMessage>
      );
    }

    // Render the root's children as a VStack
    const children = (rootData as Record<string, unknown>).children as Record<string, unknown>[] | undefined;
    
    if (!children || children.length === 0) {
      return (
        <NoComponentsMessage>
          No components yet.<br />
          Click the Add button to add components.
        </NoComponentsMessage>
      );
    }

    return (
      <DocumentContainer>
        {children.map((child, index) => (
          <CanvasNode
            key={index}
            node={child}
            path={['root', 'children', index]}
            selectedPath={selectedPath}
            hoveredPath={hoveredPath}
            editingContainerPath={selection.editingContainerPath}
            onSelect={selection.handleNodeClick}
            onDoubleClick={selection.handleNodeDoubleClick}
            onHover={setHoveredPath}
            onBoundsChange={handleBoundsChange}
            onContextMenu={showMenu}
            zoom={navigation.zoom}
          />
        ))}
      </DocumentContainer>
    );
  };

  // Assign containerRef to navigation
  useEffect(() => {
    if (containerRef.current && navigation.containerRef) {
      (navigation.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = containerRef.current;
    }
  }, [navigation.containerRef]);

  return (
    <CanvasWrapper>
      {/* Toolbar */}
      <CanvasToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        zoom={navigation.zoom}
        onZoomIn={() => navigation.setZoom(navigation.zoom * 1.2)}
        onZoomOut={() => navigation.setZoom(navigation.zoom / 1.2)}
        onZoomToFit={navigation.zoomToFit}
        onZoomTo={navigation.zoomTo}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        selectedDevice={canvasDevice}
        onDeviceChange={setCanvasDevice}
        onCenterFrame={handleCenterFrame}
      />

      {/* Canvas Content with Layers Panel */}
      <ContentRow>
        {/* Layers Panel */}
        {isLayersPanelOpen && (
          <>
            {isLayersPanelCollapsed ? (
              /* Collapsed state - thin bar with icon */
              <CollapsedLayersBar>
                <ExpandButton
                  onClick={() => setIsLayersPanelCollapsed(false)}
                  title="Expand Layers Panel"
                >
                  <Layers size={20} />
                </ExpandButton>
              </CollapsedLayersBar>
            ) : (
              /* Expanded state */
              <>
                <LayersPanelWrapper style={{ width: layersPanelWidth }}>
                  <LayersHeader>
                    <LayersTitle>Layers</LayersTitle>
                    <CollapseButton
                      onClick={() => setIsLayersPanelCollapsed(true)}
                      title="Collapse Layers Panel"
                    >
                      <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </CollapseButton>
                  </LayersHeader>
                  <LayersPanel />
                </LayersPanelWrapper>

                <ResizableDivider
                  direction="horizontal"
                  onResize={handleLayersPanelResize}
                />
              </>
            )}
          </>
        )}

        {/* Canvas Area - Light beige/gray background */}
      <CanvasArea
        ref={containerRef}
        style={{
          cursor: navigation.cursorStyle,
          backgroundColor: '#e8e4df', // Light warm beige/gray
        }}
        onClick={(e) => {
          // Deselect when clicking on the canvas background (not on children)
          if (e.target === containerRef.current) {
            setSelectedPath(null);
          }
        }}
        {...navigation.handlers}
        {...(currentTool === 'select' && !navigation.isSpacePressed ? selection.marqueeHandlers : {})}
      >
        {/* Grid Background */}
        {showGrid && (
          <GridOverlay
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * navigation.zoom}px ${20 * navigation.zoom}px`,
              backgroundPosition: `${navigation.panX}px ${navigation.panY}px`,
            }}
          />

        )}

        {/* Transformed Content */}
        <TransformedContent
          ref={contentRef}
          style={{ transform: navigation.transform }}
          onClick={(e) => {
            // Deselect when clicking on transformed content but outside the device frame
            if (e.target === contentRef.current) {
              setSelectedPath(null);
            }
          }}
        >
          {/* Device Frame */}
          <DeviceFrame
            style={{
              width: currentDevice.width,
              height: currentDevice.height,
              backgroundColor: '#ffffff',
            }}
            onClick={(e) => {
              // Deselect when clicking on the device frame background (white area)
              // but not on any component inside
              if (e.target === e.currentTarget) {
                setSelectedPath(null);
              }
            }}
          >
            {/* Device frame label */}
            <DeviceLabel style={{ whiteSpace: 'nowrap' }}>
              {currentDevice.name} ({currentDevice.width}×{currentDevice.height})
            </DeviceLabel>
            
            {/* Content area */}
            <ContentArea
              onClick={(e) => {
                // Deselect when clicking on empty content area
                if (e.target === e.currentTarget) {
                  setSelectedPath(null);
                }
              }}
            >
              {renderDocument()}
            </ContentArea>
          </DeviceFrame>
        </TransformedContent>

        {/* Overlays (not transformed) - bounds are already in viewport coords from getBoundingClientRect */}
        <OverlaysContainer>
          {/* Smart guides */}
          <SmartGuides guides={smartGuides.activeGuides} />

          {/* Hover overlay - make bounds relative to container */}
          {hoveredBounds && containerRef.current && (() => {
            const containerRect = containerRef.current.getBoundingClientRect();
            return (
              <HoverOverlay
                bounds={{
                  x: hoveredBounds.x - containerRect.x,
                  y: hoveredBounds.y - containerRect.y,
                  width: hoveredBounds.width,
                  height: hoveredBounds.height,
                }}
              />
            );
          })()}

          {/* Selection overlay - make bounds relative to container */}
          {selectedBounds && containerRef.current && (() => {
            const containerRect = containerRef.current.getBoundingClientRect();
            const displayWidth = resizePreview?.width ?? selectedBounds.width;
            const displayHeight = resizePreview?.height ?? selectedBounds.height;
            
            return (
              <SelectionOverlay
                bounds={{
                  x: selectedBounds.x - containerRect.x,
                  y: selectedBounds.y - containerRect.y,
                  width: displayWidth,
                  height: displayHeight,
                }}
                componentType={
                  selectedPath
                    ? (nodeBoundsRef.current.get(selectedPath) as any)?.type
                    : undefined
                }
                aspectRatioLocked={(selectedNodeData?._aspectRatioLocked as boolean) || false}
                pinnedEdges={(selectedNodeData?._pinnedEdges as EdgePin[]) || []}
                zoom={navigation.zoom}
                onResizeStart={handleResizeStart}
                onResize={handleResize}
                onResizeEnd={handleResizeEnd}
                onToggleAspectRatioLock={handleToggleAspectRatioLock}
                onToggleEdgePin={handleToggleEdgePin}
              />
            );
          })()}

          {/* Marquee selection */}
          {selection.marqueeBounds && (
            <MarqueeOverlay
              bounds={{
                x: selection.marqueeBounds.x * navigation.zoom + navigation.panX,
                y: selection.marqueeBounds.y * navigation.zoom + navigation.panY,
                width: selection.marqueeBounds.width * navigation.zoom,
                height: selection.marqueeBounds.height * navigation.zoom,
              }}
            />
          )}
        </OverlaysContainer>

        {/* Drop Zone Overlay - rendered at root level (not inside absolute inset div) */}
        {isDragging && (
          <DropZoneOverlay
            zones={dropZones}
            visible={isDragging}
            onZoneHover={setHoveredZoneId}
            onZoneDrop={handleCanvasDrop}
          />
        )}

        {/* Minimap */}
        <CanvasMinimap
          zoom={navigation.zoom}
          panX={navigation.panX}
          panY={navigation.panY}
          canvasWidth={currentDevice.width}
          canvasHeight={currentDevice.height}
          contentBounds={contentBounds()}
          viewportWidth={containerRef.current?.clientWidth || 800}
          viewportHeight={containerRef.current?.clientHeight || 600}
          onPanTo={navigation.setPan}
          isExpanded={isMinimapExpanded}
          onToggleExpand={() => setIsMinimapExpanded(!isMinimapExpanded)}
        />
      </CanvasArea>

        {/* Right Panel - Property Inspector (slides in when component selected) */}
        {inspectorPanel && (
          <>
            <ResizableDivider
              direction="horizontal"
              onResize={handleInspectorResize}
            />
            <InspectorWrapper style={{ width: inspectorWidth }}>
              {/* Inspector Header */}
              <InspectorHeader>
                <InspectorTitleGroup>
                  <InspectorIcon
                    width={16}
                    height={16}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </InspectorIcon>
                  <InspectorTitle>Properties</InspectorTitle>
                </InspectorTitleGroup>
              </InspectorHeader>

              {/* Inspector Content */}
              <InspectorContent>
                {inspectorPanel}
              </InspectorContent>
            </InspectorWrapper>
          </>
        )}
      </ContentRow>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DialogOverlay>
          <DialogBox>
            <DialogTitle>
              Delete Component?
            </DialogTitle>
            <DialogMessage>
              Are you sure you want to delete this component? This action cannot be undone.
            </DialogMessage>
            <DialogActions>
              <CancelButton onClick={handleCancelDelete}>
                Cancel
              </CancelButton>
              <DeleteButton onClick={handleConfirmDelete}>
                Delete
              </DeleteButton>
            </DialogActions>
          </DialogBox>
        </DialogOverlay>
      )}

      {/* Context Menu */}
      <ContextMenu
        visible={menuVisible}
        position={menuPosition}
        actions={menuActions}
        onActionClick={handleAction}
        onClose={hideMenu}
      />

      {/* Floating Component Palette */}
      <FloatingPalette />
    </CanvasWrapper>
  );
}
