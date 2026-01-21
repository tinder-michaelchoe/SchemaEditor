import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette } from 'lucide-react';
import { Input } from '../ui/Input';

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RECENT_COLORS_KEY = 'schemaEditor_recentColors';
const MAX_RECENT_COLORS = 12;

// Load recent colors from localStorage
function loadRecentColors(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      const colors = JSON.parse(stored);
      if (Array.isArray(colors)) {
        return colors.slice(0, MAX_RECENT_COLORS);
      }
    }
  } catch (e) {
    console.error('Failed to load recent colors:', e);
  }
  return [];
}

// Save a color to recent colors
function saveRecentColor(color: string): string[] {
  if (!color || !/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return loadRecentColors();
  }
  
  try {
    let recent = loadRecentColors();
    // Remove if already exists (to move to front)
    recent = recent.filter(c => c.toLowerCase() !== color.toLowerCase());
    // Add to front
    recent.unshift(color.toUpperCase());
    // Limit to max
    recent = recent.slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recent));
    return recent;
  } catch (e) {
    console.error('Failed to save recent color:', e);
    return loadRecentColors();
  }
}

// Predefined color palette - iOS/SwiftUI inspired colors
const COLOR_PALETTE = [
  // Grayscale
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Gray', hex: '#3C3C43' },
  { name: 'Gray', hex: '#8E8E93' },
  { name: 'Light Gray', hex: '#C7C7CC' },
  { name: 'White', hex: '#FFFFFF' },
  
  // Primary colors
  { name: 'Red', hex: '#FF3B30' },
  { name: 'Orange', hex: '#FF9500' },
  { name: 'Yellow', hex: '#FFCC00' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Mint', hex: '#00C7BE' },
  { name: 'Teal', hex: '#30B0C7' },
  { name: 'Cyan', hex: '#32ADE6' },
  { name: 'Blue', hex: '#007AFF' },
  { name: 'Indigo', hex: '#5856D6' },
  { name: 'Purple', hex: '#AF52DE' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Brown', hex: '#A2845E' },
  
  // Semantic colors
  { name: 'Label', hex: '#000000' },
  { name: 'Secondary Label', hex: '#3C3C4399' },
  { name: 'Tertiary Label', hex: '#3C3C434D' },
  { name: 'System Background', hex: '#FFFFFF' },
  { name: 'Secondary Background', hex: '#F2F2F7' },
  { name: 'Grouped Background', hex: '#F2F2F7' },
  
  // Additional useful colors
  { name: 'Clear', hex: '#00000000' },
  { name: 'Accent Blue', hex: '#0A84FF' },
  { name: 'Success', hex: '#30D158' },
  { name: 'Warning', hex: '#FFD60A' },
  { name: 'Error', hex: '#FF453A' },
];

export function ColorInput({ value, onChange, placeholder }: ColorInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load recent colors when popover opens
  useEffect(() => {
    if (isOpen) {
      setRecentColors(loadRecentColors());
    }
  }, [isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle color selection - save to recents
  const handleSelectColor = useCallback((color: string) => {
    const newRecents = saveRecentColor(color);
    setRecentColors(newRecents);
    onChange(color);
    setIsOpen(false);
  }, [onChange]);

  // Get display color (handle alpha values)
  const getDisplayColor = (hex: string): string => {
    if (!hex) return 'transparent';
    // Handle 8-character hex with alpha
    if (hex.length === 9 && hex.startsWith('#')) {
      return hex;
    }
    return hex;
  };

  const currentColor = getDisplayColor(value);
  const isValidColor = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      {/* Color preview button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex-shrink-0 w-8 h-8 rounded-lg border-2 
          border-[var(--border-color)] hover:border-[var(--accent-color)]
          transition-colors flex items-center justify-center
          overflow-hidden
        "
        style={{
          background: isValidColor 
            ? `linear-gradient(45deg, #ccc 25%, transparent 25%), 
               linear-gradient(-45deg, #ccc 25%, transparent 25%), 
               linear-gradient(45deg, transparent 75%, #ccc 75%), 
               linear-gradient(-45deg, transparent 75%, #ccc 75%)`
            : undefined,
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
        }}
        title="Choose color"
      >
        <div 
          className="w-full h-full"
          style={{ 
            backgroundColor: isValidColor ? currentColor : 'transparent',
          }}
        >
          {!isValidColor && (
            <Palette className="w-4 h-4 text-[var(--text-secondary)] m-auto mt-1.5" />
          )}
        </div>
      </button>

      {/* Text input */}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          // Save to recents when user finishes typing a valid color
          if (value && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
            const newRecents = saveRecentColor(value);
            setRecentColors(newRecents);
          }
        }}
        placeholder={placeholder || '#RRGGBB'}
        className="flex-1 font-mono"
      />

      {/* Color palette popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="
            absolute left-0 top-full mt-1 z-50
            bg-[var(--bg-primary)] border border-[var(--border-color)]
            rounded-xl shadow-xl p-3
            w-[280px]
          "
        >
          {/* Recent colors section */}
          {recentColors.length > 0 && (
            <>
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                Recent
              </div>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {recentColors.map((color, index) => (
                  <button
                    key={`recent-${index}-${color}`}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className="
                      w-8 h-8 rounded-lg border border-[var(--border-color)]
                      hover:scale-110 hover:border-[var(--accent-color)]
                      transition-all cursor-pointer
                      relative overflow-hidden
                    "
                    style={{
                      background: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                   linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                   linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                   linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                    }}
                    title={color}
                  >
                    <div 
                      className="absolute inset-0"
                      style={{ backgroundColor: color }}
                    />
                    {value?.toUpperCase() === color.toUpperCase() && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white border border-black/20 shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
            Color Palette
          </div>
          
          {/* Color grid */}
          <div className="grid grid-cols-6 gap-1.5">
            {COLOR_PALETTE.slice(0, 18).map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => handleSelectColor(color.hex)}
                className="
                  w-8 h-8 rounded-lg border border-[var(--border-color)]
                  hover:scale-110 hover:border-[var(--accent-color)]
                  transition-all cursor-pointer
                  relative overflow-hidden
                "
                style={{
                  background: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                               linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                               linear-gradient(45deg, transparent 75%, #ccc 75%), 
                               linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
                title={`${color.name} (${color.hex})`}
              >
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: color.hex }}
                />
                {value?.toUpperCase() === color.hex.toUpperCase() && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white border border-black/20 shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Semantic colors section */}
          <div className="text-xs font-medium text-[var(--text-secondary)] mt-3 mb-2">
            Semantic
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {COLOR_PALETTE.slice(18).map((color) => (
              <button
                key={color.hex + color.name}
                type="button"
                onClick={() => handleSelectColor(color.hex)}
                className="
                  w-8 h-8 rounded-lg border border-[var(--border-color)]
                  hover:scale-110 hover:border-[var(--accent-color)]
                  transition-all cursor-pointer
                  relative overflow-hidden
                "
                style={{
                  background: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                               linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                               linear-gradient(45deg, transparent 75%, #ccc 75%), 
                               linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                }}
                title={`${color.name} (${color.hex})`}
              >
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: color.hex }}
                />
                {value?.toUpperCase() === color.hex.toUpperCase() && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white border border-black/20 shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Current value display */}
          {value && (
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded border border-[var(--border-color)]"
                style={{ 
                  backgroundColor: isValidColor ? currentColor : 'transparent',
                  background: !isValidColor ? '#f0f0f0' : undefined,
                }}
              />
              <span className="text-xs font-mono text-[var(--text-primary)]">
                {value}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to check if a property is a color field
export function isColorProperty(propertyName: string, schema?: { description?: string }): boolean {
  const colorPropertyNames = [
    'color',
    'textColor',
    'backgroundColor',
    'borderColor',
    'tintColor',
    'lightColor',
    'darkColor',
  ];
  
  // Check property name
  if (colorPropertyNames.includes(propertyName)) {
    return true;
  }
  
  // Check if name ends with "Color"
  if (propertyName.endsWith('Color')) {
    return true;
  }
  
  // Check description for "hex" mention
  if (schema?.description?.toLowerCase().includes('hex')) {
    return true;
  }
  
  return false;
}
