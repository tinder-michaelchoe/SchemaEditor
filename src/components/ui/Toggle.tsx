import { forwardRef, InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className = '', label, checked, onChange, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div className={`
            w-11 h-6 rounded-full transition-colors
            peer-focus:ring-2 peer-focus:ring-[var(--accent-color)] peer-focus:ring-offset-2
            ${checked ? 'bg-[var(--accent-color)]' : 'bg-[var(--bg-tertiary)]'}
          `} />
          <div className={`
            absolute top-0.5 left-0.5
            w-5 h-5 bg-white rounded-full shadow-sm
            transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `} />
        </div>
        {label && (
          <span className="text-sm text-[var(--text-primary)]">{label}</span>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
