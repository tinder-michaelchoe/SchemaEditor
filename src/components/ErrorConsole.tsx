import { useMemo, useState } from 'react';
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
    <div className={`
      border-t border-[var(--border-color)] bg-[var(--bg-secondary)]
      flex flex-col
      ${isMinimized ? 'h-10' : 'h-64'}
      transition-all duration-200
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Error Console
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--error-color)] text-white">
            {errorsWithLocations.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy all errors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-[var(--success-color)]" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Close"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Error List */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-2 font-mono text-xs">
          {errorsWithLocations.length === 0 ? (
            <div className="text-[var(--text-secondary)] text-center py-4">
              No errors
            </div>
          ) : (
            <div className="space-y-2">
              {errorsWithLocations.map((error, index) => (
                <div
                  key={index}
                  onClick={() => onErrorClick?.(error.line)}
                  className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--error-color)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--error-color)] flex-shrink-0">
                      [{error.line}:{error.column}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--text-secondary)] truncate" title={error.jsonPath}>
                        {error.jsonPath}
                      </div>
                      <div className="text-[var(--text-primary)] mt-0.5">
                        {error.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
