/**
 * ModelSelector Component
 * Dropdown for selecting AI models with grouped sections
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { litellmService, STANDARD_MODELS, type ModelInfo } from '../../services/litellm';

/* ------------------------------------------------------------------ */
/*  Styled Components                                                  */
/* ------------------------------------------------------------------ */

const Container = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const Select = styled.select<{ $isDisabled: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  background: ${p => (p.$isDisabled ? p.theme.colors.bgSecondary : p.theme.colors.bgPrimary)};
  color: ${p => p.theme.colors.textPrimary};
  cursor: ${p => (p.$isDisabled ? 'not-allowed' : 'pointer')};
  font-family: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => p.theme.colors.accent};
  }
`;

const LoadingHint = styled.div`
  margin-top: 4px;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
`;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>(STANDARD_MODELS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const allModels = await litellmService.getModels();
      setModels(allModels);
    } catch (error) {
      console.error('Failed to load models:', error);
      // Fallback to standard models
      setModels(STANDARD_MODELS);
    } finally {
      setIsLoading(false);
    }
  };

  const standardModels = models.filter(m => m.category === 'standard');
  const dynamicModels = models.filter(m => m.category === 'dynamic');

  return (
    <Container>
      <Label>
        Model
      </Label>
      <Select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled || isLoading}
        $isDisabled={disabled || isLoading}
      >
        {isLoading ? (
          <option>Loading models...</option>
        ) : (
          <>
            {/* Standard Models Section */}
            <optgroup label="Standard Vision Models">
              {standardModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </optgroup>

            {/* Dynamic Models Section (if any) */}
            {dynamicModels.length > 0 && (
              <optgroup label="Additional Models">
                {dynamicModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            )}
          </>
        )}
      </Select>

      {isLoading && (
        <LoadingHint>
          Loading additional models...
        </LoadingHint>
      )}
    </Container>
  );
}
