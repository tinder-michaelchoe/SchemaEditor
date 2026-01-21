/**
 * ImageDropZone Component
 * Drag-and-drop image upload with preview
 */

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { imageUtils } from '../../services/imageUtils';

interface ImageDropZoneProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  imageFile: File | null;
  disabled?: boolean;
}

export function ImageDropZone({
  onImageSelect,
  onImageRemove,
  imageFile,
  disabled = false,
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create preview URL when image changes
  useEffect(() => {
    if (imageFile) {
      const url = imageUtils.createPreviewUrl(imageFile);
      setPreviewUrl(url);
      return () => {
        imageUtils.revokePreviewUrl(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  const handleFile = (file: File) => {
    setError(null);

    const validation = imageUtils.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    onImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !imageFile) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onImageRemove();
  };

  return (
    <div className="image-drop-zone h-full flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-colors flex-1 flex flex-col
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${!imageFile && !disabled ? 'cursor-pointer hover:border-gray-400' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {previewUrl ? (
          // Image preview
          <div className="relative flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="mt-2 text-xs text-gray-600 text-center truncate flex-shrink-0">
              {imageFile?.name}
            </div>
          </div>
        ) : (
          // Upload prompt
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
            <Upload className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium mb-1">
              Drag and drop an image here
            </p>
            <p className="text-xs text-gray-400">
              or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPG, WEBP (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex-shrink-0">
          {error}
        </div>
      )}
    </div>
  );
}
