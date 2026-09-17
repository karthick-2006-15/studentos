import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className
}) => {
  const variants = {
    neutral: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    primary: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded',
    md: 'text-xs px-2 py-0.5 rounded-md'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-mono font-medium border select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
