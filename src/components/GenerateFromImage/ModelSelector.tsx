/**
 * ModelSelector Component
 * Dropdown for selecting AI models with grouped sections
 */

import React, { useEffect, useState } from 'react';
import { litellmService, STANDARD_MODELS, type ModelInfo } from '../../services/litellm';

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
    <div className="model-selector">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Model
      </label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled || isLoading}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled || isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
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
      </select>

      {isLoading && (
        <div className="mt-1 text-xs text-gray-500">
          Loading additional models...
        </div>
      )}
    </div>
  );
}
