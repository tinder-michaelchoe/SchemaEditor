import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'required' | 'type' | 'error' | 'success';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    required: 'bg-[var(--accent-color)] text-white',
    type: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-mono',
    error: 'bg-[var(--error-color)] text-white',
    success: 'bg-[var(--success-color)] text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center px-1.5 py-0.5 
        text-[10px] font-medium rounded
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
