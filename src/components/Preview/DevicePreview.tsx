import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Copy, Check, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { initClads, renderCladsDocument, isCladsInitialized } from '@clads-preview/index.js';
import styled, { css } from 'styled-components';
import { spin } from '@/styles/mixins';

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

/* ── styled-components ── */

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: ${p => p.theme.colors.textSecondary};
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 2px solid ${p => p.theme.colors.accent};
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  font-size: ${p => p.theme.fontSizes.sm};
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ErrorDrawer = styled.div`
  flex-shrink: 0;
  border-bottom: 1px solid ${p => p.theme.colors.error}4d;
  background: ${p => p.theme.colors.error}1a;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;

  &:hover {
    background: ${p => p.theme.colors.error}0d;
  }
`;

const ErrorTitle = styled.span`
  flex: 1;
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  color: ${p => p.theme.colors.error};
`;

const CopyErrorButton = styled.button`
  padding: 4px;
  border-radius: ${p => p.theme.radii.sm};
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: ${p => p.theme.colors.bgTertiary};
  }
`;

const ErrorContent = styled.div`
  padding: 0 12px 12px;
`;

const ErrorPre = styled.pre`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 5lh;
  overflow: hidden;
  margin: 0;
`;

const PhoneContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
`;

const FitButton = styled.button<{ $active: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${p => p.theme.radii.md};
  font-size: ${p => p.theme.fontSizes.xs};
  font-weight: 500;
  transition: background-color 0.15s, color 0.15s;
  box-shadow: ${p => p.theme.shadows.sm};
  cursor: pointer;

  ${p =>
    p.$active
      ? css`
          background: ${p.theme.colors.accent};
          color: #ffffff;
          border: none;
        `
      : css`
          background: ${p.theme.colors.bgPrimary};
          color: ${p.theme.colors.textSecondary};
          border: 1px solid ${p.theme.colors.border};

          &:hover {
            color: ${p.theme.colors.textPrimary};
            background: ${p.theme.colors.bgTertiary};
          }
        `}
`;

const PhoneSizer = styled.div<{ $fit: boolean }>`
  position: relative;
  width: 100%;
  ${p =>
    p.$fit
      ? css`
          height: 100%;
          max-width: 100%;
        `
      : css`
          max-width: 280px;
        `}
`;

const FitModeInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FitModeFrame = styled.div`
  position: relative;
  aspect-ratio: 9 / 19.5;
  height: 100%;
  max-width: 100%;
`;

const BezelImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 10;
`;

const ScreenArea = styled.div`
  position: absolute;
  overflow: hidden;
  background: black;
  left: 7%;
  right: 7%;
  top: calc(1.5% + 36px);
  bottom: calc(1.5% + 36px);
  border-radius: 24px;
`;

const BottomSheet = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  transition: all 0.3s;
  overflow: hidden;
`;

const DragHandle = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0;
`;

const DragHandleBar = styled.div`
  width: 36px;
  height: 4px;
  background: ${p => p.theme.colors.bgTertiary};
  border-radius: ${p => p.theme.radii.full};
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  border: 0;
  background: white;
`;

const NoPreviewMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${p => p.theme.colors.textTertiary};
  font-size: ${p => p.theme.fontSizes.sm};
`;

const ControlSelect = styled.select<{ $position: 'left' | 'right' }>`
  position: absolute;
  bottom: 8px;
  ${p => (p.$position === 'left' ? 'left: 8px;' : 'right: 8px;')}
  z-index: 20;
  padding: 6px 8px;
  border-radius: ${p => p.theme.radii.md};
  font-size: ${p => p.theme.fontSizes.xs};
  font-weight: 500;
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textSecondary};
  border: 1px solid ${p => p.theme.colors.border};
  transition: background-color 0.15s, color 0.15s;
  box-shadow: ${p => p.theme.shadows.sm};
  cursor: pointer;

  &:hover {
    color: ${p => p.theme.colors.textPrimary};
    background: ${p => p.theme.colors.bgTertiary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 1px ${p => p.theme.colors.accent};
  }
`;

const DisabledOption = styled.option`
  color: ${p => p.theme.colors.textTertiary};
`;

/* ── component ── */

export function DevicePreview({ data, className }: DevicePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(isCladsInitialized());
  const [html, setHtml] = useState<string>('');
  const [lastSuccessfulHtml, setLastSuccessfulHtml] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [copiedError, setCopiedError] = useState(false);
  const [isErrorExpanded, setIsErrorExpanded] = useState(true);
  const [fitToContainer, setFitToContainer] = useState(true);
  const [detentSize, setDetentSize] = useState<DetentSize>('large');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
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
      <LoadingWrapper className={className}>
        <LoadingContent>
          <Spinner />
          <LoadingText>Loading CLADS renderer...</LoadingText>
        </LoadingContent>
      </LoadingWrapper>
    );
  }

  // Display HTML (either current or last successful)
  const displayHtml = html || lastSuccessfulHtml;

  const renderScreenContent = () => (
    <>
      {/* Bottom sheet simulation */}
      <BottomSheet
        style={{
          top: `${DETENT_CONFIG[detentSize].topPercent}%`,
          borderTopLeftRadius: detentSize !== 'full' ? '20px' : '0',
          borderTopRightRadius: detentSize !== 'full' ? '20px' : '0',
        }}
      >
        {/* Drag handle for non-full detents */}
        {detentSize !== 'full' && (
          <DragHandle>
            <DragHandleBar />
          </DragHandle>
        )}
        {displayHtml ? (
          <PreviewIframe
            srcDoc={displayHtml}
            style={{ height: detentSize !== 'full' ? 'calc(100% - 20px)' : '100%' }}
            title="CLADS Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          <NoPreviewMessage>
            No preview available
          </NoPreviewMessage>
        )}
      </BottomSheet>
    </>
  );

  return (
    <Container className={className}>
      {/* Error drawer */}
      {error && (
        <ErrorDrawer>
          {/* Error header - always visible */}
          <ErrorHeader onClick={() => setIsErrorExpanded(!isErrorExpanded)}>
            <AlertCircle size={16} style={{ color: 'inherit', flexShrink: 0 }} />
            <ErrorTitle>Render failed</ErrorTitle>
            <CopyErrorButton
              onClick={(e) => {
                e.stopPropagation();
                handleCopyError();
              }}
              title="Copy error to clipboard"
            >
              {copiedError ? (
                <Check size={14} style={{ color: 'var(--success-color)' }} />
              ) : (
                <Copy size={14} />
              )}
            </CopyErrorButton>
            {isErrorExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </ErrorHeader>

          {/* Error content - collapsible */}
          {isErrorExpanded && (
            <ErrorContent>
              <ErrorPre>
                {getTruncatedError(error.message)}
              </ErrorPre>
            </ErrorContent>
          )}
        </ErrorDrawer>
      )}

      {/* Phone bezel container */}
      <PhoneContainer>
        {/* Fit button - upper right corner */}
        <FitButton
          $active={fitToContainer}
          onClick={() => setFitToContainer(!fitToContainer)}
          title={fitToContainer ? 'Use fixed size' : 'Fit to panel'}
        >
          <Maximize2 size={12} />
          Fit
        </FitButton>

        <PhoneSizer
          $fit={fitToContainer}
          style={{ aspectRatio: fitToContainer ? undefined : '9 / 19.5' }}
        >
          {fitToContainer ? (
            // Fit mode: scale to fill container while maintaining aspect ratio
            <FitModeInner>
              <FitModeFrame>
                {/* Phone bezel image */}
                <BezelImage
                  src="/phone-bezel.png"
                  alt="Phone frame"
                />

                {/* Screen content area - iframe isolates styles */}
                <ScreenArea>
                  {renderScreenContent()}
                </ScreenArea>
              </FitModeFrame>
            </FitModeInner>
          ) : (
            // Fixed size mode
            <>
              {/* Phone bezel image */}
              <BezelImage
                src="/phone-bezel.png"
                alt="Phone frame"
              />

              {/* Screen content area - iframe isolates styles */}
              <ScreenArea>
                {renderScreenContent()}
              </ScreenArea>
            </>
          )}
        </PhoneSizer>

        {/* Detent selector - lower left corner */}
        <ControlSelect
          $position="left"
          value={detentSize}
          onChange={(e) => setDetentSize(e.target.value as DetentSize)}
        >
          <option value="full">Full Screen</option>
          <option value="large">Large Detent</option>
          <option value="medium">Medium Detent</option>
        </ControlSelect>

        {/* Platform selector - lower right corner */}
        <ControlSelect
          $position="right"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as 'ios' | 'android')}
        >
          <option value="ios">iOS</option>
          <DisabledOption value="android" disabled>
            Android
          </DisabledOption>
        </ControlSelect>
      </PhoneContainer>
    </Container>
  );
}
