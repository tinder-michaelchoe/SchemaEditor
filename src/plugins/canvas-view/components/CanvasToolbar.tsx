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
    <div className="flex items-center gap-2 px-2 py-1 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
      {/* Tool Selection */}
      <div className="flex items-center gap-0.5">
        <Button
          variant={currentTool === 'select' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('select')}
          title="Select (V)"
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          variant={currentTool === 'hand' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onToolChange('hand')}
          title="Hand Tool (H)"
        >
          <Hand className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-[var(--border-color)]" />

      {/* Device Selector */}
      <div className="flex items-center gap-1">
        <Smartphone className="w-4 h-4 text-[var(--text-secondary)]" />
        <select
          value={selectedDevice}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="
            px-2 py-1 text-xs font-medium rounded
            bg-[var(--bg-primary)] border border-[var(--border-color)]
            text-[var(--text-primary)]
            focus:outline-none focus:border-[var(--accent-color)]
          "
          title={selectedDeviceInfo ? `${selectedDeviceInfo.width}×${selectedDeviceInfo.height}` : ''}
        >
          {DEVICE_FRAMES.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-5 bg-[var(--border-color)]" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <select
          value={zoom}
          onChange={(e) => onZoomTo(parseFloat(e.target.value))}
          className="
            px-2 py-1 text-xs font-medium rounded
            bg-[var(--bg-primary)] border border-[var(--border-color)]
            text-[var(--text-primary)]
            focus:outline-none focus:border-[var(--accent-color)]
          "
        >
          {ZOOM_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {Math.round(preset * 100)}%
            </option>
          ))}
          {!ZOOM_PRESETS.includes(zoom) && (
            <option value={zoom}>{zoomPercent}%</option>
          )}
        </select>
        
        <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onZoomToFit} title="Zoom to Fit (⌘1)">
          <Maximize2 className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onCenterFrame} title="Center Frame">
          <Focus className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-[var(--border-color)]" />

      {/* Grid/Snap Toggles */}
      <div className="flex items-center gap-0.5">
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleGrid}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant={snapEnabled ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleSnap}
          title="Toggle Snap"
        >
          <Magnet className="w-4 h-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
