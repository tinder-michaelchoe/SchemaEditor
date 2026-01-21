import { ReactNode, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  nodeId?: string;
  title: ReactNode;
  subtitle?: string;
  badge?: ReactNode;
  error?: boolean;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Collapsible({
  isOpen,
  onToggle,
  onSelect,
  isSelected,
  nodeId,
  title,
  subtitle,
  badge,
  error,
  children,
  className = '',
  actions,
}: CollapsibleProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when selected
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const handleClick = () => {
    onSelect?.();
    onToggle();
  };

  return (
    <div 
      ref={ref}
      id={nodeId}
      className={`
        border rounded-lg overflow-hidden transition-all
        ${isSelected 
          ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30' 
          : 'border-[var(--border-color)]'
        }
        ${className}
      `}
    >
      {/* Header row - contains clickable area and actions */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2
          transition-colors
          ${isSelected 
            ? 'bg-[var(--accent-color)]/10' 
            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
          }
          ${error ? 'border-l-2 border-l-[var(--error-color)]' : ''}
        `}
      >
        {/* Clickable toggle/select area */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
        >
          <ChevronRight 
            className={`w-4 h-4 text-[var(--text-secondary)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <span className="text-xs text-[var(--text-secondary)] truncate block">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {/* Actions - outside the clickable area to avoid nested buttons */}
        {actions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="border-t border-[var(--border-color)]">
          {children}
        </div>
      )}
    </div>
  );
}
