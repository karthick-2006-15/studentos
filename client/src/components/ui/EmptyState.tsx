import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="text-sm font-medium text-zinc-200 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
