import React from 'react';

interface PropertyRowProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  layout?: 'vertical' | 'horizontal';
}

export function PropertyRow({
  label,
  description,
  required,
  children,
  layout = 'horizontal',
}: PropertyRowProps) {
  if (layout === 'vertical') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <label className="text-sm text-[var(--text-secondary)]">{label}</label>
          {required && <span className="text-[var(--error-color)]">*</span>}
        </div>
        {description && (
          <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-1/3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <label className="text-sm text-[var(--text-secondary)] truncate">
            {label}
          </label>
          {required && <span className="text-[var(--error-color)]">*</span>}
        </div>
        {description && (
          <p className="text-xs text-[var(--text-tertiary)] truncate" title={description}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
