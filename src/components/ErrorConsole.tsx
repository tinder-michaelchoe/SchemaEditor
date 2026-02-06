import { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/Button';
import type { ValidationError } from '../types/schema';

interface ErrorConsoleProps {
  errors: Map<string, ValidationError[]>;
  data: unknown;
  isOpen: boolean;
  onClose: () => void;
  onErrorClick?: (line: number) => void;
}

interface ErrorWithLocation {
  path: string;
  message: string;
  line: number;
  column: number;
  jsonPath: string;
}

function findLocationInJSON(jsonString: string, path: string): { line: number; column: number } {
  // Convert path like "/root/children/0/type" to search pattern
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { line: 1, column: 1 };
  }

  const lines = jsonString.split('\n');
  let segmentIndex = 0;

  // Simple approach: search for the key pattern in the JSON
  // This is a simplified heuristic that works for most cases

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Look for the target segment
    const targetSegment = segments[segmentIndex];

    if (targetSegment !== undefined) {
      // Check if this is an array index - skip for now, continue to next segment
      if (/^\d+$/.test(targetSegment)) {
        // For array indices, we'll try to match the next non-index segment
        segmentIndex++;
        continue;
      } else {
        // Look for the key in this line
        const keyPattern = new RegExp(`"${escapeRegex(targetSegment)}"\\s*:`);
        const match = line.match(keyPattern);

        if (match) {
          segmentIndex++;

          if (segmentIndex >= segments.length) {
            // Found the target
            const column = (match.index || 0) + 1;
            return { line: lineNum + 1, column };
          }
        }
      }
    }
  }

  // Fallback: try to find any occurrence of the last segment
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && !/^\d+$/.test(lastSegment)) {
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const keyPattern = new RegExp(`"${escapeRegex(lastSegment)}"\\s*:`);
      const match = line.match(keyPattern);

      if (match) {
        return { line: lineNum + 1, column: (match.index || 0) + 1 };
      }
    }
  }

  return { line: 1, column: 1 };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pathToJSONPath(path: string): string {
  // Convert "/root/children/0/type" to "$.root.children[0].type"
  if (path === '/' || path === '') return '$';

  const segments = path.split('/').filter(Boolean);
  let jsonPath = '$';

  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      jsonPath += `[${segment}]`;
    } else {
      jsonPath += `.${segment}`;
    }
  }

  return jsonPath;
}

/* ── styled-components ── */

const ConsoleContainer = styled.div<{ $isMinimized: boolean }>`
  border-top: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
  display: flex;
  flex-direction: column;
  transition: all 0.2s;

  ${p =>
    p.$isMinimized
      ? css`height: 2.5rem;`
      : css`height: 16rem;`}
`;

const ConsoleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgTertiary};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ConsoleTitle = styled.span`
  font-size: ${p => p.theme.fontSizes.sm};
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const ErrorBadge = styled.span`
  font-size: ${p => p.theme.fontSizes.xs};
  padding: 0.125rem 0.375rem;
  border-radius: ${p => p.theme.radii.sm};
  background: ${p => p.theme.colors.error};
  color: white;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SuccessCheck = styled(Check)`
  color: ${p => p.theme.colors.success};
`;

const ErrorListContainer = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0.5rem;
  font-family: ${p => p.theme.fonts.mono};
  font-size: ${p => p.theme.fontSizes.xs};
`;

const NoErrorsMessage = styled.div`
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  padding: 1rem 0;
`;

const ErrorItemsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ErrorCard = styled.div`
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.sm};
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;

  &:hover {
    border-color: ${p => p.theme.colors.error};
    background: ${p => p.theme.colors.bgTertiary};
  }
`;

const ErrorCardInner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ErrorLocation = styled.span`
  color: ${p => p.theme.colors.error};
  flex-shrink: 0;
`;

const ErrorContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ErrorPath = styled.div`
  color: ${p => p.theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ErrorMessageText = styled.div`
  color: ${p => p.theme.colors.textPrimary};
  margin-top: 0.125rem;
`;

/* ── component ── */

export function ErrorConsole({ errors, data, isOpen, onClose, onErrorClick }: ErrorConsoleProps) {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '';
    }
  }, [data]);

  const errorsWithLocations = useMemo(() => {
    const result: ErrorWithLocation[] = [];

    for (const [path, pathErrors] of errors) {
      const location = findLocationInJSON(jsonString, path);

      for (const error of pathErrors) {
        result.push({
          path: path || '/',
          message: error.message,
          line: location.line,
          column: location.column,
          jsonPath: pathToJSONPath(path),
        });
      }
    }

    // Sort by line number
    result.sort((a, b) => a.line - b.line);

    return result;
  }, [errors, jsonString]);

  const formattedErrors = useMemo(() => {
    if (errorsWithLocations.length === 0) return '';

    let output = `JSON Validation Errors (${errorsWithLocations.length} total)\n`;
    output += '='.repeat(50) + '\n\n';

    for (const error of errorsWithLocations) {
      output += `Error at line ${error.line}, column ${error.column}\n`;
      output += `  Path: ${error.jsonPath}\n`;
      output += `  Message: ${error.message}\n`;
      output += '\n';
    }

    output += '='.repeat(50) + '\n';
    output += 'To fix: Check the paths above and ensure values match the schema requirements.';

    return output;
  }, [errorsWithLocations]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedErrors);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <ConsoleContainer $isMinimized={isMinimized}>
      {/* Header */}
      <ConsoleHeader>
        <HeaderLeft>
          <ConsoleTitle>Error Console</ConsoleTitle>
          <ErrorBadge>{errorsWithLocations.length}</ErrorBadge>
        </HeaderLeft>
        <HeaderActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy all errors"
          >
            {copied ? (
              <SuccessCheck size={12} />
            ) : (
              <Copy size={12} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Close"
          >
            <X size={12} />
          </Button>
        </HeaderActions>
      </ConsoleHeader>

      {/* Error List */}
      {!isMinimized && (
        <ErrorListContainer>
          {errorsWithLocations.length === 0 ? (
            <NoErrorsMessage>No errors</NoErrorsMessage>
          ) : (
            <ErrorItemsStack>
              {errorsWithLocations.map((error, index) => (
                <ErrorCard
                  key={index}
                  onClick={() => onErrorClick?.(error.line)}
                >
                  <ErrorCardInner>
                    <ErrorLocation>
                      [{error.line}:{error.column}]
                    </ErrorLocation>
                    <ErrorContent>
                      <ErrorPath title={error.jsonPath}>
                        {error.jsonPath}
                      </ErrorPath>
                      <ErrorMessageText>
                        {error.message}
                      </ErrorMessageText>
                    </ErrorContent>
                  </ErrorCardInner>
                </ErrorCard>
              ))}
            </ErrorItemsStack>
          )}
        </ErrorListContainer>
      )}
    </ConsoleContainer>
  );
}
