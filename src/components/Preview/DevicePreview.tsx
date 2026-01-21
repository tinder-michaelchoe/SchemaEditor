import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Copy, Check, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { initClads, renderCladsDocument, isCladsInitialized } from '@clads-preview/index.js';

interface DevicePreviewProps {
  data: unknown;
  className?: string;
}

const DEBOUNCE_DELAY = 300;

type DetentSize = 'full' | 'large' | 'medium';

// Detent configurations - top offset as percentage of screen height
const DETENT_CONFIG: Record<DetentSize, { label: string; topPercent: number }> = {
  full: { label: 'Full Screen', topPercent: 0 },
  large: { label: 'Large Detent', topPercent: 8 },
  medium: { label: 'Medium Detent', topPercent: 50 },
};

export function DevicePreview({ data, className = '' }: DevicePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(isCladsInitialized());
  const [html, setHtml] = useState<string>('');
  const [lastSuccessfulHtml, setLastSuccessfulHtml] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [copiedError, setCopiedError] = useState(false);
  const [isErrorExpanded, setIsErrorExpanded] = useState(true);
  const [fitToContainer, setFitToContainer] = useState(true);
  const [detentSize, setDetentSize] = useState<DetentSize>('large');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize WASM on first mount (lazy loading)
  useEffect(() => {
    if (isCladsInitialized()) {
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        // Fetch WASM from public folder
        await initClads('/clads-preview.wasm');
        if (!cancelled) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced render function
  const renderDocument = useCallback((document: unknown) => {
    if (!isInitialized) return;

    try {
      const json = typeof document === 'string' ? document : JSON.stringify(document);
      const rendered = renderCladsDocument(json);
      setHtml(rendered);
      setLastSuccessfulHtml(rendered);
      setError(null);
    } catch (err) {
      const renderError = err instanceof Error ? err : new Error(String(err));
      setError(renderError);
      // Keep showing last successful render
    }
  }, [isInitialized]);

  // Debounce data changes
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Schedule new render
    debounceRef.current = setTimeout(() => {
      renderDocument(data);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [data, isInitialized, isLoading, renderDocument]);

  // Copy error to clipboard
  const handleCopyError = async () => {
    if (!error) return;
    try {
      await navigator.clipboard.writeText(error.message);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  // Get truncated error message (up to 5 lines)
  const getTruncatedError = (message: string) => {
    const lines = message.split('\n');
    if (lines.length <= 5) return message;
    return lines.slice(0, 5).join('\n') + '\n...';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
          <div className="w-8 h-8 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading CLADS renderer...</span>
        </div>
      </div>
    );
  }

  // Display HTML (either current or last successful)
  const displayHtml = html || lastSuccessfulHtml;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Error drawer */}
      {error && (
        <div className="flex-shrink-0 border-b border-[var(--error-color)]/30 bg-[var(--error-color)]/10">
          {/* Error header - always visible */}
          <div 
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--error-color)]/5"
            onClick={() => setIsErrorExpanded(!isErrorExpanded)}
          >
            <AlertCircle className="w-4 h-4 text-[var(--error-color)] flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-[var(--error-color)]">Render failed</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyError();
              }}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
              title="Copy error to clipboard"
            >
              {copiedError ? (
                <Check className="w-3.5 h-3.5 text-[var(--success-color)]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              )}
            </button>
            {isErrorExpanded ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </div>
          
          {/* Error content - collapsible */}
          {isErrorExpanded && (
            <div className="px-3 pb-3">
              <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words max-h-[5lh] overflow-hidden">
                {getTruncatedError(error.message)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Phone bezel container */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div 
          className={`relative ${fitToContainer ? 'w-full h-full max-w-full' : 'w-full max-w-[280px]'}`}
          style={{ aspectRatio: fitToContainer ? undefined : '9 / 19.5' }}
        >
          {fitToContainer ? (
            // Fit mode: scale to fill container while maintaining aspect ratio
            <div className="relative w-full h-full flex items-center justify-center">
              <div 
                className="relative"
                style={{ 
                  aspectRatio: '9 / 19.5',
                  height: '100%',
                  maxWidth: '100%',
                }}
              >
                {/* Phone bezel image */}
                <img
                  src="/phone-bezel.png"
                  alt="Phone frame"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                />
                
              {/* Screen content area - iframe isolates styles */}
              <div
                className="absolute overflow-hidden bg-black"
                style={{
                  left: '7%',
                  right: '7%',
                  top: 'calc(1.5% + 36px)',
                  bottom: 'calc(1.5% + 36px)',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                  borderBottomLeftRadius: '24px',
                  borderBottomRightRadius: '24px',
                }}
              >
                {/* Bottom sheet simulation */}
                <div 
                  className="absolute left-0 right-0 bottom-0 bg-white transition-all duration-300 overflow-hidden"
                  style={{
                    top: `${DETENT_CONFIG[detentSize].topPercent}%`,
                    borderTopLeftRadius: detentSize !== 'full' ? '20px' : '0',
                    borderTopRightRadius: detentSize !== 'full' ? '20px' : '0',
                  }}
                >
                  {/* Drag handle for non-full detents */}
                  {detentSize !== 'full' && (
                    <div className="flex justify-center py-2">
                      <div className="w-9 h-1 bg-gray-300 rounded-full" />
                    </div>
                  )}
                {displayHtml ? (
                    <iframe
                      srcDoc={displayHtml}
                      className="w-full border-0 bg-white"
                      style={{ height: detentSize !== 'full' ? 'calc(100% - 20px)' : '100%' }}
                      title="CLADS Preview"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No preview available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Fixed size mode
          <>
            {/* Phone bezel image */}
            <img
              src="/phone-bezel.png"
              alt="Phone frame"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />
            
            {/* Screen content area - iframe isolates styles */}
            <div
              className="absolute overflow-hidden bg-black"
              style={{
                left: '7%',
                right: '7%',
                top: 'calc(1.5% + 36px)',
                bottom: 'calc(1.5% + 36px)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                borderBottomLeftRadius: '24px',
                borderBottomRightRadius: '24px',
              }}
            >
              {/* Bottom sheet simulation */}
              <div 
                className="absolute left-0 right-0 bottom-0 bg-white transition-all duration-300 overflow-hidden"
                style={{
                  top: `${DETENT_CONFIG[detentSize].topPercent}%`,
                  borderTopLeftRadius: detentSize !== 'full' ? '20px' : '0',
                  borderTopRightRadius: detentSize !== 'full' ? '20px' : '0',
                }}
              >
                {/* Drag handle for non-full detents */}
                {detentSize !== 'full' && (
                  <div className="flex justify-center py-2">
                    <div className="w-9 h-1 bg-gray-300 rounded-full" />
                  </div>
                )}
                {displayHtml ? (
                  <iframe
                    srcDoc={displayHtml}
                    className="w-full border-0 bg-white"
                    style={{ height: detentSize !== 'full' ? 'calc(100% - 20px)' : '100%' }}
                    title="CLADS Preview"
                    sandbox="allow-same-origin allow-scripts"
                  />
                  ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No preview available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        </div>

        {/* Detent selector - lower left corner */}
        <select
          value={detentSize}
          onChange={(e) => setDetentSize(e.target.value as DetentSize)}
          className="
            absolute bottom-2 left-2 z-20
            px-2 py-1.5 rounded-md text-xs font-medium
            bg-[var(--bg-primary)] text-[var(--text-secondary)]
            border border-[var(--border-color)]
            hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]
            transition-colors shadow-sm cursor-pointer
            focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]
          "
        >
          <option value="full">Full Screen</option>
          <option value="large">Large Detent</option>
          <option value="medium">Medium Detent</option>
        </select>

        {/* Fit button - lower right corner */}
        <button
          onClick={() => setFitToContainer(!fitToContainer)}
          className={`
            absolute bottom-2 right-2 z-20
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
            transition-colors shadow-sm
            ${fitToContainer
              ? 'bg-[var(--accent-color)] text-white'
              : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
            }
          `}
          title={fitToContainer ? 'Use fixed size' : 'Fit to panel'}
        >
          <Maximize2 className="w-3 h-3" />
          Fit
        </button>
      </div>
    </div>
  );
}
