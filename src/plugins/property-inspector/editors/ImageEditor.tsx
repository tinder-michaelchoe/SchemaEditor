import React, { useState, useCallback, useRef } from 'react';
import styled, { css } from 'styled-components';
import { Image, Link, Package, Upload, X } from 'lucide-react';

interface ImageValue {
  type: 'asset' | 'url' | 'system';
  name?: string;
  url?: string;
  _previewUrl?: string; // Local preview only, not exported
}

interface ImageEditorProps {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
}

const IMAGE_TYPES = [
  { value: 'asset', label: 'Asset', icon: Package, description: 'Named asset from the app bundle' },
  { value: 'url', label: 'URL', icon: Link, description: 'Remote image URL' },
  { value: 'system', label: 'System', icon: Image, description: 'SF Symbol or system icon' },
] as const;

const ImageEditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TypeButtonGroup = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const TypeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 150ms;

  ${p => p.$active
    ? css`
        background: ${p.theme.colors.accent};
        color: white;
      `
    : css`
        background: ${p.theme.colors.bgTertiary};
        color: ${p.theme.colors.textSecondary};
        &:hover {
          background: ${p.theme.colors.border};
        }
      `
  }
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px ${p => p.theme.colors.accent};
  }
`;

const UploadButton = styled.button`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;
  transition: background-color 150ms;

  &:hover {
    background: ${p => p.theme.colors.border};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px dashed ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const PreviewImage = styled.img`
  width: 3rem;
  height: 3rem;
  object-fit: cover;
  border-radius: 0.25rem;
`;

const PreviewInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PreviewTitle = styled.p`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const PreviewNote = styled.p`
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
`;

const ClearButton = styled.button`
  padding: 0.25rem;
  border-radius: 0.25rem;
  border: none;
  background: transparent;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;

  &:hover {
    background: ${p => p.theme.colors.border};
  }
`;

const NameInput = styled.input`
  width: 100%;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px ${p => p.theme.colors.accent};
  }
`;

const BrowseButton = styled.button`
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  background: ${p => p.theme.colors.bgTertiary};
  border-radius: 0.25rem;
  border: none;
  color: ${p => p.theme.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background: ${p => p.theme.colors.border};
  }
`;

const SymbolPicker = styled.div`
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 0.25rem;
  background: ${p => p.theme.colors.bgPrimary};
  padding: 0.5rem;
  max-height: 8rem;
  overflow-y: auto;
`;

const SymbolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
`;

const SymbolButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  text-align: center;
  border: none;
  cursor: pointer;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }

  ${p => p.$active
    ? css`
        background: ${p.theme.colors.accent};
        color: white;
      `
    : css`
        background: transparent;
        color: ${p.theme.colors.textSecondary};
      `
  }
`;

const HintText = styled.p`
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
`;

// Common SF Symbols for quick selection
const COMMON_SYMBOLS = [
  'star.fill', 'heart.fill', 'person.fill', 'gear', 'house.fill',
  'magnifyingglass', 'bell.fill', 'envelope.fill', 'phone.fill', 'camera.fill',
  'photo', 'folder.fill', 'trash', 'pencil', 'plus',
  'minus', 'checkmark', 'xmark', 'arrow.right', 'arrow.left',
];

export function ImageEditor({ value, onChange }: ImageEditorProps) {
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const imageType = value?.type || 'asset';
  const imageName = value?.name || '';
  const imageUrl = value?.url || '';
  const previewUrl = value?._previewUrl || '';

  const handleTypeChange = useCallback((newType: 'asset' | 'url' | 'system') => {
    onChange({
      type: newType,
      name: newType === 'url' ? undefined : imageName,
      url: newType === 'url' ? imageUrl : undefined,
    });
  }, [onChange, imageName, imageUrl]);

  const handleNameChange = useCallback((newName: string) => {
    onChange({
      ...value,
      type: imageType,
      name: newName,
    });
  }, [onChange, value, imageType]);

  const handleUrlChange = useCallback((newUrl: string) => {
    onChange({
      ...value,
      type: 'url',
      url: newUrl,
    });
  }, [onChange, value]);

  const handleSymbolSelect = useCallback((symbol: string) => {
    onChange({
      type: 'system',
      name: symbol,
    });
    setShowSymbolPicker(false);
  }, [onChange]);

  // Handle local file selection for preview
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onChange({
          ...value,
          type: 'url',
          _previewUrl: dataUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onChange, value]);

  // Clear preview
  const handleClearPreview = useCallback(() => {
    onChange({
      ...value,
      _previewUrl: undefined,
    });
  }, [onChange, value]);

  return (
    <ImageEditorWrapper>
      {/* Image Type Selector */}
      <TypeButtonGroup>
        {IMAGE_TYPES.map(({ value: typeValue, label, icon: Icon }) => (
          <TypeButton
            key={typeValue}
            onClick={() => handleTypeChange(typeValue)}
            $active={imageType === typeValue}
            title={IMAGE_TYPES.find(t => t.value === typeValue)?.description}
          >
            <Icon size={12} />
            {label}
          </TypeButton>
        ))}
      </TypeButtonGroup>

      {/* Value Input */}
      {imageType === 'url' ? (
        <ImageEditorWrapper>
          {/* URL Input with file picker */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <UrlInput
              type="url"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.png"
            />
            <UploadButton
              onClick={() => fileInputRef.current?.click()}
              title="Select local file for preview"
            >
              <Upload size={16} />
            </UploadButton>
            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>

          {/* Preview thumbnail */}
          {previewUrl && (
            <div style={{ position: 'relative' }}>
              <PreviewContainer>
                <PreviewImage
                  src={previewUrl}
                  alt="Preview"
                />
                <PreviewInfo>
                  <PreviewTitle>Local Preview</PreviewTitle>
                  <PreviewNote>
                    For visualization only - won't be exported
                  </PreviewNote>
                </PreviewInfo>
                <ClearButton
                  onClick={handleClearPreview}
                  title="Clear preview"
                >
                  <X size={16} />
                </ClearButton>
              </PreviewContainer>
            </div>
          )}
        </ImageEditorWrapper>
      ) : (
        <div style={{ position: 'relative' }}>
          <NameInput
            type="text"
            value={imageName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={imageType === 'system' ? 'SF Symbol name (e.g., star.fill)' : 'Asset name'}
          />

          {/* Symbol picker button for system type */}
          {imageType === 'system' && (
            <BrowseButton
              onClick={() => setShowSymbolPicker(!showSymbolPicker)}
            >
              Browse
            </BrowseButton>
          )}
        </div>
      )}

      {/* SF Symbol Picker */}
      {imageType === 'system' && showSymbolPicker && (
        <SymbolPicker>
          <SymbolGrid>
            {COMMON_SYMBOLS.map((symbol) => (
              <SymbolButton
                key={symbol}
                onClick={() => handleSymbolSelect(symbol)}
                $active={imageName === symbol}
                title={symbol}
              >
                {symbol.split('.')[0]}
              </SymbolButton>
            ))}
          </SymbolGrid>
        </SymbolPicker>
      )}

      {/* Preview hint */}
      <HintText>
        {imageType === 'asset' && 'Enter the name of an image asset in your app bundle'}
        {imageType === 'url' && (previewUrl
          ? 'Local preview active. Enter a URL for the exported JSON.'
          : 'Enter a URL, or use the upload button to preview a local file'
        )}
        {imageType === 'system' && 'Enter an SF Symbol name (iOS) or browse common symbols'}
      </HintText>
    </ImageEditorWrapper>
  );
}
