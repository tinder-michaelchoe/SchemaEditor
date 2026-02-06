/**
 * ImageDropZone Component
 * Drag-and-drop image upload with preview
 */

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import styled, { css } from 'styled-components';
import { imageUtils } from '../../services/imageUtils';

/* ------------------------------------------------------------------ */
/*  Styled Components                                                  */
/* ------------------------------------------------------------------ */

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const DropArea = styled.div<{
  $isDragging: boolean;
  $hasImage: boolean;
  $disabled: boolean;
}>`
  position: relative;
  border: 2px dashed;
  border-radius: 8px;
  padding: 16px;
  transition: border-color 0.15s, background-color 0.15s;
  flex: 1;
  display: flex;
  flex-direction: column;

  border-color: ${p =>
    p.$isDragging ? '#3b82f6' : p.theme.colors.border};
  background: ${p =>
    p.$isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent'};

  ${p =>
    !p.$hasImage &&
    !p.$disabled &&
    css`
      cursor: pointer;
      &:hover {
        border-color: ${p.theme.colors.textSecondary};
      }
    `}

  ${p =>
    p.$disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
    `}
`;

const PreviewWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ef4444;
  color: #ffffff;
  border-radius: 9999px;
  padding: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: #dc2626;
  }
`;

const FileName = styled.div`
  margin-top: 8px;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
`;

const UploadPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: ${p => p.theme.colors.textSecondary};
`;

const UploadTitle = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  margin-bottom: 4px;
`;

const UploadSubtext = styled.p`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
`;

const UploadFormats = styled.p`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textTertiary};
  margin-top: 8px;
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  font-size: ${p => p.theme.fontSizes.sm};
  color: #ef4444;
  flex-shrink: 0;
`;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

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
    <Container>
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
      <DropArea
        $isDragging={isDragging}
        $hasImage={!!imageFile}
        $disabled={disabled}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {previewUrl ? (
          // Image preview
          <PreviewWrapper>
            <ImageContainer>
              <PreviewImage
                src={previewUrl}
                alt="Preview"
              />
            </ImageContainer>
            {!disabled && (
              <RemoveButton
                onClick={handleRemove}
                title="Delete image"
              >
                <Trash2 size={16} />
              </RemoveButton>
            )}
            <FileName>
              {imageFile?.name}
            </FileName>
          </PreviewWrapper>
        ) : (
          // Upload prompt
          <UploadPrompt>
            <Upload size={48} />
            <UploadTitle>
              Drag and drop an image here
            </UploadTitle>
            <UploadSubtext>
              or click to browse
            </UploadSubtext>
            <UploadFormats>
              PNG, JPG, WEBP (max 10MB)
            </UploadFormats>
          </UploadPrompt>
        )}
      </DropArea>

      {/* Error message */}
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
    </Container>
  );
}
