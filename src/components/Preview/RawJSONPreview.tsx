import { useMemo, useRef, useEffect, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import styled, { css } from 'styled-components';

interface RawJSONPreviewProps {
  data: unknown;
  selectedPath: string | null;
  editingPath: string | null;
  onSelectPath?: (path: string) => void;
  highlightedLine?: number | null;
  wrapText?: boolean;
  className?: string;
}

// Convert UI path format to path segments
// Note: "root" can be either:
// 1. A UI convention for the document root (when path is just "root")
// 2. An actual key in the JSON (like {"root": {...}})
// We only treat "root" as the document root when the path is exactly "root"
function parseUIPath(uiPath: string): (string | number)[] {
  // Only treat "root" as document root if it's the entire path
  if (!uiPath || uiPath === 'root') return [];

  const segments: (string | number)[] = [];
  const regex = /([^.\[\]]+)|\[(\d+)\]/g;
  let match;

  while ((match = regex.exec(uiPath)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      segments.push(parseInt(match[2], 10));
    }
  }

  return segments;
}

// Find the line range for a given path in JSON string
function findPathLineRange(
  jsonString: string,
  pathSegments: (string | number)[]
): { startLine: number; endLine: number } | null {
  if (pathSegments.length === 0) {
    // Root - highlight everything
    const lines = jsonString.split('\n');
    return { startLine: 0, endLine: lines.length - 1 };
  }

  const lines = jsonString.split('\n');
  let segmentIndex = 0;
  let arrayIndex = 0;
  let inArray = false;
  let foundStart = -1;
  let bracketCount = 0;
  let skipUntilNextElement = false;
  let skipBracketDepth = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmedLine = line.trim();

    // Track bracket depth for found element
    if (foundStart >= 0) {
      for (const char of line) {
        if (char === '{' || char === '[') {
          bracketCount++;
        } else if (char === '}' || char === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            return { startLine: foundStart, endLine: lineNum };
          }
        }
      }
      continue;
    }

    // Skip nested structures when counting array elements
    if (skipUntilNextElement) {
      for (const char of line) {
        if (char === '{' || char === '[') {
          skipBracketDepth++;
        } else if (char === '}' || char === ']') {
          skipBracketDepth--;
          if (skipBracketDepth === 0) {
            skipUntilNextElement = false;
          }
        }
      }
      continue;
    }

    if (segmentIndex >= pathSegments.length) continue;

    const targetSegment = pathSegments[segmentIndex];

    if (typeof targetSegment === 'string' && !inArray) {
      // Look for object key
      const keyPattern = new RegExp(`^"${escapeRegex(targetSegment)}"\\s*:`);
      if (keyPattern.test(trimmedLine)) {
        segmentIndex++;

        if (segmentIndex >= pathSegments.length) {
          // Found the target
          foundStart = lineNum;
          // Check if value is on same line (primitive) or starts object/array
          if (trimmedLine.includes('{') || trimmedLine.includes('[')) {
            bracketCount = 1;
          } else {
            // Primitive value - single line
            return { startLine: lineNum, endLine: lineNum };
          }
        } else {
          // Check if next segment is an array index and this key opens an array
          const nextSegment = pathSegments[segmentIndex];
          if (typeof nextSegment === 'number' && trimmedLine.includes('[')) {
            inArray = true;
            arrayIndex = 0;
          }
        }
      }
    } else if (typeof targetSegment === 'number') {
      // Array index - we should be in array mode or looking for array start
      if (!inArray) {
        // Look for array start
        if (trimmedLine.startsWith('[') || trimmedLine.includes(': [')) {
          inArray = true;
          arrayIndex = 0;
        }
      }

      if (inArray) {
        // Check if this line starts an array element
        const isElementStart =
          trimmedLine.startsWith('{') ||
          trimmedLine.startsWith('[') ||
          trimmedLine.startsWith('"') ||
          /^-?\d/.test(trimmedLine) ||
          trimmedLine === 'true' || trimmedLine === 'true,' ||
          trimmedLine === 'false' || trimmedLine === 'false,' ||
          trimmedLine === 'null' || trimmedLine === 'null,';

        if (isElementStart) {
          if (arrayIndex === targetSegment) {
            segmentIndex++;
            inArray = false;
            arrayIndex = 0;

            if (segmentIndex >= pathSegments.length) {
              foundStart = lineNum;
              if (trimmedLine.startsWith('{') || trimmedLine.startsWith('[')) {
                bracketCount = 1;
              } else {
                return { startLine: lineNum, endLine: lineNum };
              }
            }
          } else {
            // Skip this element - need to track its depth to find the next one
            arrayIndex++;
            if (trimmedLine.startsWith('{') || trimmedLine.startsWith('[')) {
              skipUntilNextElement = true;
              skipBracketDepth = 1;
            }
          }
        }
      }
    }
  }

  return foundStart >= 0 ? { startLine: foundStart, endLine: lines.length - 1 } : null;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a map of line numbers to JSON paths
// Path format matches TreeView: 'root' for document root, actual property paths for nested items
// Example for {"root": {"children": [...]}}: 'root' for the "root" key, 'root.children' for children
function buildLineToPathMap(jsonString: string): Map<number, string> {
  const lineToPath = new Map<number, string>();
  const lines = jsonString.split('\n');

  // Track the path as an array of segments
  const pathStack: (string | number)[] = [];

  // Track container types at each nesting level: 'object' or 'array'
  const containerStack: ('object' | 'array')[] = [];

  // Track array indices at each array level
  const arrayIndexStack: number[] = [];

  // Track whether we've seen a key at the current object level
  // (used to know if we should replace vs push)
  let lastKeyDepth = -1;

  // Build path string from pathStack - matches TreeView format
  const buildPathString = (): string => {
    if (pathStack.length === 0) return 'root';
    let path = '';
    for (let i = 0; i < pathStack.length; i++) {
      const segment = pathStack[i];
      if (typeof segment === 'number') {
        path += `[${segment}]`;
      } else if (i === 0) {
        path = segment;
      } else {
        path += `.${segment}`;
      }
    }
    return path;
  };

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Count opening/closing brackets on this line to handle same-line open/close
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;

    // Check for object key
    const keyMatch = trimmed.match(/^"([^"]+)"\s*:/);
    if (keyMatch) {
      const key = keyMatch[1];
      const currentDepth = containerStack.length;

      // If we're at the same depth as the last key, replace it
      if (lastKeyDepth === currentDepth && pathStack.length > 0 && typeof pathStack[pathStack.length - 1] === 'string') {
        pathStack.pop();
      }

      pathStack.push(key);
      lastKeyDepth = currentDepth;
      lineToPath.set(lineNum, buildPathString());

      // Check if this key's value opens a new container
      const valueOpensObject = trimmed.includes('{');
      const valueOpensArray = trimmed.includes('[');

      // Handle containers opened on this line
      if (valueOpensObject) {
        containerStack.push('object');
        // Check if it also closes on same line (empty object {})
        if (closeBraces > openBraces || trimmed.includes('{}')) {
          containerStack.pop();
          pathStack.pop();
          lastKeyDepth = containerStack.length;
        }
      } else if (valueOpensArray) {
        containerStack.push('array');
        arrayIndexStack.push(0);
        // Check if it also closes on same line (empty array [])
        if (closeBrackets > openBrackets || trimmed.includes('[]')) {
          containerStack.pop();
          arrayIndexStack.pop();
          pathStack.pop();
          lastKeyDepth = containerStack.length;
        }
      }
      continue;
    }

    // Check for standalone opening brace at root
    if (trimmed === '{' && containerStack.length === 0) {
      lineToPath.set(lineNum, 'root');
      containerStack.push('object');
      continue;
    }

    // Check for standalone opening bracket at root
    if (trimmed === '[' && containerStack.length === 0) {
      lineToPath.set(lineNum, 'root');
      containerStack.push('array');
      arrayIndexStack.push(0);
      continue;
    }

    // Check for array element (when we're inside an array)
    if (containerStack.length > 0 && containerStack[containerStack.length - 1] === 'array') {
      // This line starts an array element
      if (trimmed.startsWith('{') || trimmed.startsWith('[') ||
          trimmed.startsWith('"') || /^-?\d/.test(trimmed) ||
          trimmed === 'true' || trimmed === 'true,' ||
          trimmed === 'false' || trimmed === 'false,' ||
          trimmed === 'null' || trimmed === 'null,') {

        const idx = arrayIndexStack[arrayIndexStack.length - 1];
        pathStack.push(idx);
        arrayIndexStack[arrayIndexStack.length - 1]++;
        lineToPath.set(lineNum, buildPathString());

        if (trimmed.startsWith('{')) {
          containerStack.push('object');
          // Check if closes on same line
          if (trimmed.endsWith('}') || trimmed.endsWith('},')) {
            containerStack.pop();
            pathStack.pop();
          }
        } else if (trimmed.startsWith('[')) {
          containerStack.push('array');
          arrayIndexStack.push(0);
          // Check if closes on same line
          if (trimmed.endsWith(']') || trimmed.endsWith('],')) {
            containerStack.pop();
            arrayIndexStack.pop();
            pathStack.pop();
          }
        } else {
          // Primitive array element - pop immediately after recording
          pathStack.pop();
        }
        continue;
      }
    }

    // Check for closing brackets
    if (trimmed === '}' || trimmed === '},' || trimmed === ']' || trimmed === '],') {
      if (containerStack.length > 0) {
        const containerType = containerStack.pop();
        if (containerType === 'array') {
          arrayIndexStack.pop();
        }

        // Pop the last key from pathStack (if the last item is a string key)
        if (pathStack.length > 0 && typeof pathStack[pathStack.length - 1] === 'string') {
          pathStack.pop();
        }

        // If the closed container was an array element (object/array inside an array),
        // also pop the array index from pathStack
        if (containerStack.length > 0 && containerStack[containerStack.length - 1] === 'array') {
          if (pathStack.length > 0 && typeof pathStack[pathStack.length - 1] === 'number') {
            pathStack.pop();
          }
        }
      }

      // Update lastKeyDepth
      lastKeyDepth = containerStack.length;

      // Map closing bracket to the parent path
      lineToPath.set(lineNum, buildPathString());
    }
  }

  return lineToPath;
}

/* ── styled-components ── */

const Wrapper = styled.div`
  position: relative;
`;

const CopyButtonWrapper = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
`;

const CodePre = styled.pre<{ $wrap: boolean }>`
  height: 100%;
  overflow: auto;
  padding: 48px 16px 16px;
  background: ${p => p.theme.colors.bgSecondary};
  border-radius: ${p => p.theme.radii.lg};
  font-size: ${p => p.theme.fontSizes.sm};
  font-family: ${p => p.theme.fonts.mono};
  line-height: 20px;
  color: ${p => p.theme.colors.textPrimary};
  margin: 0;

  ${p =>
    p.$wrap
      ? css`
          white-space: pre-wrap;
          word-break: break-word;
        `
      : css`
          white-space: pre;
        `}
`;

const JsonLine = styled.div<{
  $clickable: boolean;
  $highlighted: boolean;
  $editing: boolean;
  $errorHighlighted: boolean;
}>`
  position: relative;
  display: flex;

  ${p =>
    p.$clickable &&
    css`
      cursor: pointer;
      &:hover {
        background: ${p.theme.colors.bgTertiary};
      }
    `}

  ${p =>
    p.$highlighted &&
    css`
      background: ${p.theme.colors.accent}1a;
    `}

  ${p =>
    p.$editing &&
    css`
      background: ${p.theme.colors.accent}33;
    `}

  ${p =>
    p.$errorHighlighted &&
    css`
      background: ${p.theme.colors.error}33;
      box-shadow: inset 0 0 0 1px ${p.theme.colors.error}80;
    `}
`;

const LineNumber = styled.span`
  width: 40px;
  flex-shrink: 0;
  padding-right: 12px;
  text-align: right;
  color: ${p => p.theme.colors.textSecondary}80;
  user-select: none;
`;

const LineContent = styled.span`
  flex: 1;
`;

const CopiedLabel = styled.span`
  font-size: ${p => p.theme.fontSizes.xs};
`;

const CopyLabel = styled.span`
  font-size: ${p => p.theme.fontSizes.xs};
`;

/* ── component ── */

export function RawJSONPreview({ data, selectedPath, editingPath, onSelectPath, highlightedLine, wrapText = true, className }: RawJSONPreviewProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const highlightedLineRef = useRef<HTMLDivElement>(null);

  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Error serializing JSON';
    }
  }, [data]);

  // Build line-to-path mapping
  const lineToPath = useMemo(() => buildLineToPathMap(jsonString), [jsonString]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine which path to highlight (editing takes priority)
  const highlightPath = editingPath || selectedPath;

  // Find line range for selected/editing path
  const highlightRange = useMemo(() => {
    if (!highlightPath) return null;
    const segments = parseUIPath(highlightPath);
    return findPathLineRange(jsonString, segments);
  }, [highlightPath, jsonString]);

  // Handle line click
  const handleLineClick = useCallback((lineNum: number) => {
    if (!onSelectPath) return;
    const path = lineToPath.get(lineNum);
    if (path) {
      onSelectPath(path);
    }
  }, [lineToPath, onSelectPath]);

  // Create line elements with syntax highlighting
  const jsonLines = useMemo(() => {
    const lines = jsonString.split('\n');

    return lines.map((line, index) => {
      // Apply syntax highlighting
      let highlighted = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span class="json-key">$1</span>:')
        .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="json-string">$1</span>')
        .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');

      // Check if this line should be highlighted
      const isHighlighted = highlightRange &&
        index >= highlightRange.startLine &&
        index <= highlightRange.endLine;

      const isEditing = editingPath && highlightRange &&
        index >= highlightRange.startLine &&
        index <= highlightRange.endLine;

      const hasPath = lineToPath.has(index);

      // Check if this line should be highlighted due to error click (1-based to 0-based)
      const isErrorHighlighted = highlightedLine !== null && highlightedLine !== undefined && index === highlightedLine - 1;

      return {
        html: highlighted,
        isHighlighted,
        isEditing,
        isErrorHighlighted,
        hasPath,
        lineNum: index,
      };
    });
  }, [jsonString, highlightRange, editingPath, lineToPath, highlightedLine]);

  // Auto-scroll to highlighted section
  useEffect(() => {
    if (highlightRange && preRef.current) {
      const lineHeight = 20; // Approximate line height
      const scrollTop = highlightRange.startLine * lineHeight - 100;
      preRef.current.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });
    }
  }, [highlightRange]);

  // Auto-scroll to error-highlighted line
  useEffect(() => {
    if (highlightedLine && highlightedLineRef.current && preRef.current) {
      highlightedLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedLine]);

  return (
    <Wrapper className={className}>
      <CopyButtonWrapper>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check size={12} />
              <CopiedLabel>Copied!</CopiedLabel>
            </>
          ) : (
            <>
              <Copy size={12} />
              <CopyLabel>Copy</CopyLabel>
            </>
          )}
        </Button>
      </CopyButtonWrapper>
      <CodePre
        ref={preRef}
        $wrap={wrapText}
      >
        {jsonLines.map((line) => (
          <JsonLine
            key={line.lineNum}
            ref={line.isErrorHighlighted ? highlightedLineRef : undefined}
            onClick={() => line.hasPath && handleLineClick(line.lineNum)}
            $clickable={!!line.hasPath && !!onSelectPath}
            $highlighted={!!line.isHighlighted}
            $editing={!!line.isEditing}
            $errorHighlighted={!!line.isErrorHighlighted}
          >
            {/* Line number */}
            <LineNumber>
              {line.lineNum + 1}
            </LineNumber>
            {/* Line content */}
            <LineContent
              dangerouslySetInnerHTML={{ __html: line.html || '&nbsp;' }}
            />
          </JsonLine>
        ))}
      </CodePre>
    </Wrapper>
  );
}
