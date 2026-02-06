import React from 'react';
import { 
  MousePointer, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Grid,
  Magnet,
  Smartphone,
  Focus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styled from 'styled-components';

type Tool = 'select' | 'hand';

// Device frame definitions
export interface DeviceFrame {
  id: string;
  name: string;
  width: number;
  height: number;
  // Physical device info for reference
  screenSize?: string;
}

export const DEVICE_FRAMES: DeviceFrame[] = [
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', width: 402, height: 874, screenSize: '6.3"' },
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', width: 440, height: 956, screenSize: '6.9"' },
  { id: 'samsung-s25', name: 'Samsung Galaxy S25', width: 412, height: 915, screenSize: '6.2"' },
  { id: 'samsung-s25-ultra', name: 'Samsung Galaxy S25 Ultra', width: 448, height: 998, screenSize: '6.9"' },
];

interface CanvasToolbarProps {
  // Current tool
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  
  // Zoom
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onZoomTo: (level: number) => void;
  
  // Grid/Snap
  showGrid: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  
  // Device frame
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
  onCenterFrame: () => void;
}

const ZOOM_PRESETS = [0.1, 0.25, 0.5, 1, 2, 4];

const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
`;

const ToolGroup = styled.div<{ $gap?: number }>`
  display: flex;
  align-items: center;
  gap: ${p => (p.$gap ?? 2)}px;
`;

const Separator = styled.div`
  width: 1px;
  height: 20px;
  background: ${p => p.theme.colors.border};
`;

const ToolbarSelect = styled.select`
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: ${p => p.theme.radii.sm};
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.accent};
  }
`;

const IconSecondary = styled.span`
  display: inline-flex;
  color: ${p => p.theme.colors.textSecondary};
`;

const Spacer = styled.div`
  flex: 1;
`;

export function CanvasToolbar({
  currentTool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onZoomTo,
  showGrid,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  selectedDevice,
  onDeviceChange,
  onCenterFrame,
}: CanvasToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);
  const selectedDeviceInfo = DEVICE_FRAMES.find(d => d.id === selectedDevice);

  return (
    <ToolbarWrapper>
      {/* Tool Selection */}
      <ToolGroup>
        <Button
          variant={currentTool === 'select' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('select')}
          title="Select (V)"
        >
          <MousePointer size={16} />
        </Button>
        <Button
          variant={currentTool === 'hand' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('hand')}
          title="Hand Tool (H)"
        >
          <Hand size={16} />
        </Button>
      </ToolGroup>

      <Separator />

      {/* Device Selector */}
      <ToolGroup $gap={4}>
        <IconSecondary>
          <Smartphone size={16} />
        </IconSecondary>
        <ToolbarSelect
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
          title={selectedDeviceInfo ? `${selectedDeviceInfo.width}×${selectedDeviceInfo.height}` : ''}
        >
          {DEVICE_FRAMES.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </ToolbarSelect>
      </ToolGroup>

      <Separator />

      {/* Zoom Controls */}
      <ToolGroup $gap={4}>
        <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </Button>

        <ToolbarSelect
          value={zoom}
          onChange={(e) => onZoomTo(parseFloat(e.target.value))}
        >
          {ZOOM_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {Math.round(preset * 100)}%
            </option>
          ))}
          {!ZOOM_PRESETS.includes(zoom) && (
            <option value={zoom}>{zoomPercent}%</option>
          )}
        </ToolbarSelect>

        <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </Button>

        <Button variant="ghost" size="sm" onClick={onZoomToFit} title="Zoom to Fit (⌘1)">
          <Maximize2 size={16} />
        </Button>

        <Button variant="ghost" size="sm" onClick={onCenterFrame} title="Center Frame">
          <Focus size={16} />
        </Button>
      </ToolGroup>

      <Separator />

      {/* Grid/Snap Toggles */}
      <ToolGroup>
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleGrid}
          title="Toggle Grid"
        >
          <Grid size={16} />
        </Button>
        <Button
          variant={snapEnabled ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleSnap}
          title="Toggle Snap"
        >
          <Magnet size={16} />
        </Button>
      </ToolGroup>

      {/* Spacer */}
      <Spacer />
    </ToolbarWrapper>
  );
}
