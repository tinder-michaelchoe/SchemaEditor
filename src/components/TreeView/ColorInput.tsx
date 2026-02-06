import { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
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

/* ── Styled Components ──────────────────────────────────────────── */

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ColorPreviewButton = styled.button`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 2px solid ${p => p.theme.colors.border};
  transition: border-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: none;

  &:hover {
    border-color: ${p => p.theme.colors.accent};
  }
`;

const ColorPreviewInner = styled.div`
  width: 100%;
  height: 100%;
`;

const StyledPalette = styled(Palette)`
  color: ${p => p.theme.colors.textSecondary};
  margin: auto;
  margin-top: 0.375rem;
`;

const StyledInput = styled(Input)`
  flex: 1;
  font-family: ${p => p.theme.fonts.mono};
`;

const Popover = styled.div`
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 0.25rem;
  z-index: 50;
  background-color: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 0.75rem;
  box-shadow: ${p => p.theme.shadows.xl};
  padding: 0.75rem;
  width: 280px;
`;

const SectionLabel = styled.div<{ $mt?: boolean }>`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 0.5rem;
  ${p => p.$mt && 'margin-top: 0.75rem;'}
`;

const ColorGrid = styled.div<{ $mb?: boolean }>`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.375rem;
  ${p => p.$mb && 'margin-bottom: 0.75rem;'}
`;

const SwatchButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid ${p => p.theme.colors.border};
  transition: all 0.15s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  padding: 0;

  &:hover {
    transform: scale(1.1);
    border-color: ${p => p.theme.colors.accent};
  }
`;

const SwatchOverlay = styled.div`
  position: absolute;
  inset: 0;
`;

const SelectionIndicatorContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SelectionDot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: ${p => p.theme.shadows.sm};
`;

const CurrentValueSection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${p => p.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CurrentValueSwatch = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  border: 1px solid ${p => p.theme.colors.border};
`;

const CurrentValueText = styled.span`
  font-size: 0.75rem;
  font-family: ${p => p.theme.fonts.mono};
  color: ${p => p.theme.colors.textPrimary};
`;

/* ── Checkerboard background inline styles ──────────────────────── */

const checkerboardSmall = {
  background: `linear-gradient(45deg, #ccc 25%, transparent 25%),
               linear-gradient(-45deg, #ccc 25%, transparent 25%),
               linear-gradient(45deg, transparent 75%, #ccc 75%),
               linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
  backgroundSize: '6px 6px',
  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
};

const checkerboardLarge = {
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
};

/* ── Component ──────────────────────────────────────────────────── */

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
    <Container ref={containerRef}>
      {/* Color preview button */}
      <ColorPreviewButton
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={
          isValidColor
            ? {
                background: `linear-gradient(45deg, #ccc 25%, transparent 25%),
                   linear-gradient(-45deg, #ccc 25%, transparent 25%),
                   linear-gradient(45deg, transparent 75%, #ccc 75%),
                   linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                ...checkerboardLarge,
              }
            : undefined
        }
        title="Choose color"
      >
        <ColorPreviewInner
          style={{
            backgroundColor: isValidColor ? currentColor : 'transparent',
          }}
        >
          {!isValidColor && (
            <StyledPalette size={16} />
          )}
        </ColorPreviewInner>
      </ColorPreviewButton>

      {/* Text input */}
      <StyledInput
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
      />

      {/* Color palette popover */}
      {isOpen && (
        <Popover ref={popoverRef}>
          {/* Recent colors section */}
          {recentColors.length > 0 && (
            <>
              <SectionLabel>Recent</SectionLabel>
              <ColorGrid $mb>
                {recentColors.map((color, index) => (
                  <SwatchButton
                    key={`recent-${index}-${color}`}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    style={checkerboardSmall}
                    title={color}
                  >
                    <SwatchOverlay style={{ backgroundColor: color }} />
                    {value?.toUpperCase() === color.toUpperCase() && (
                      <SelectionIndicatorContainer>
                        <SelectionDot />
                      </SelectionIndicatorContainer>
                    )}
                  </SwatchButton>
                ))}
              </ColorGrid>
            </>
          )}

          <SectionLabel>Color Palette</SectionLabel>

          {/* Color grid */}
          <ColorGrid>
            {COLOR_PALETTE.slice(0, 18).map((color) => (
              <SwatchButton
                key={color.hex}
                type="button"
                onClick={() => handleSelectColor(color.hex)}
                style={checkerboardSmall}
                title={`${color.name} (${color.hex})`}
              >
                <SwatchOverlay style={{ backgroundColor: color.hex }} />
                {value?.toUpperCase() === color.hex.toUpperCase() && (
                  <SelectionIndicatorContainer>
                    <SelectionDot />
                  </SelectionIndicatorContainer>
                )}
              </SwatchButton>
            ))}
          </ColorGrid>

          {/* Semantic colors section */}
          <SectionLabel $mt>Semantic</SectionLabel>
          <ColorGrid>
            {COLOR_PALETTE.slice(18).map((color) => (
              <SwatchButton
                key={color.hex + color.name}
                type="button"
                onClick={() => handleSelectColor(color.hex)}
                style={checkerboardSmall}
                title={`${color.name} (${color.hex})`}
              >
                <SwatchOverlay style={{ backgroundColor: color.hex }} />
                {value?.toUpperCase() === color.hex.toUpperCase() && (
                  <SelectionIndicatorContainer>
                    <SelectionDot />
                  </SelectionIndicatorContainer>
                )}
              </SwatchButton>
            ))}
          </ColorGrid>

          {/* Current value display */}
          {value && (
            <CurrentValueSection>
              <CurrentValueSwatch
                style={{
                  backgroundColor: isValidColor ? currentColor : 'transparent',
                  background: !isValidColor ? '#f0f0f0' : undefined,
                }}
              />
              <CurrentValueText>{value}</CurrentValueText>
            </CurrentValueSection>
          )}
        </Popover>
      )}
    </Container>
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
