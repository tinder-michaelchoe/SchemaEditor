import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-1.5 text-sm
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none cursor-pointer
          bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2386868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')] 
          bg-no-repeat bg-[right_8px_center]
          pr-8
          ${error 
            ? 'border-[var(--error-color)] focus:ring-[var(--error-color)]' 
            : 'border-[var(--border-color)]'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
