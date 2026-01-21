import React, { useState, useCallback, useRef } from 'react';
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
    <div className="space-y-2">
      {/* Image Type Selector */}
      <div className="flex gap-1">
        {IMAGE_TYPES.map(({ value: typeValue, label, icon: Icon }) => (
          <button
            key={typeValue}
            onClick={() => handleTypeChange(typeValue)}
            className={`
              flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium
              transition-colors
              ${imageType === typeValue
                ? 'bg-[var(--accent-color)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
              }
            `}
            title={IMAGE_TYPES.find(t => t.value === typeValue)?.description}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Value Input */}
      {imageType === 'url' ? (
        <div className="space-y-2">
          {/* URL Input with file picker */}
          <div className="flex gap-1">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.png"
              className="flex-1 px-2 py-1.5 text-sm rounded border border-[var(--border-color)]
                         bg-[var(--bg-primary)] text-[var(--text-primary)]
                         focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1.5 rounded border border-[var(--border-color)]
                         bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
                         hover:bg-[var(--border-color)] transition-colors"
              title="Select local file for preview"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          {/* Preview thumbnail */}
          {previewUrl && (
            <div className="relative">
              <div className="flex items-center gap-2 p-2 rounded border border-dashed border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)]">Local Preview</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    For visualization only - won't be exported
                  </p>
                </div>
                <button
                  onClick={handleClearPreview}
                  className="p-1 rounded hover:bg-[var(--border-color)] text-[var(--text-tertiary)]"
                  title="Clear preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={imageName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={imageType === 'system' ? 'SF Symbol name (e.g., star.fill)' : 'Asset name'}
            className="w-full px-2 py-1.5 text-sm rounded border border-[var(--border-color)]
                       bg-[var(--bg-primary)] text-[var(--text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
          />
          
          {/* Symbol picker button for system type */}
          {imageType === 'system' && (
            <button
              onClick={() => setShowSymbolPicker(!showSymbolPicker)}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs
                         bg-[var(--bg-tertiary)] rounded hover:bg-[var(--border-color)]
                         text-[var(--text-secondary)]"
            >
              Browse
            </button>
          )}
        </div>
      )}

      {/* SF Symbol Picker */}
      {imageType === 'system' && showSymbolPicker && (
        <div className="border border-[var(--border-color)] rounded bg-[var(--bg-primary)] p-2 max-h-32 overflow-y-auto">
          <div className="grid grid-cols-5 gap-1">
            {COMMON_SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleSymbolSelect(symbol)}
                className={`
                  p-1.5 text-xs rounded hover:bg-[var(--bg-tertiary)] text-center
                  ${imageName === symbol ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)]'}
                `}
                title={symbol}
              >
                {symbol.split('.')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview hint */}
      <p className="text-[10px] text-[var(--text-tertiary)]">
        {imageType === 'asset' && 'Enter the name of an image asset in your app bundle'}
        {imageType === 'url' && (previewUrl 
          ? 'Local preview active. Enter a URL for the exported JSON.'
          : 'Enter a URL, or use the upload button to preview a local file'
        )}
        {imageType === 'system' && 'Enter an SF Symbol name (iOS) or browse common symbols'}
      </p>
    </div>
  );
}
