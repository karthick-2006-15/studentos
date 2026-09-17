import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-zinc-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50',
            error && 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
