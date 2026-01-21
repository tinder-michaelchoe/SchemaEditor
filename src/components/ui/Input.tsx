import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-3 py-1.5 text-sm
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          border rounded-lg
          placeholder:text-[var(--text-tertiary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-[var(--error-color)] focus:ring-[var(--error-color)]' 
            : 'border-[var(--border-color)]'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          border rounded-lg resize-none
          placeholder:text-[var(--text-tertiary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-[var(--error-color)] focus:ring-[var(--error-color)]' 
            : 'border-[var(--border-color)]'
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);

TextArea.displayName = 'TextArea';
