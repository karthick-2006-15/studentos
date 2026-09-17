import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-zinc-100 text-zinc-950 hover:bg-white active:bg-zinc-200 shadow-sm',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-750 active:bg-zinc-700 border border-zinc-700/60',
    outline: 'bg-transparent text-zinc-200 border border-zinc-700 hover:bg-zinc-850 hover:text-white',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5'
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
