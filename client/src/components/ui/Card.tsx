import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, interactive = false, className, ...props }) => {
  return (
    <div
      className={clsx(
        interactive ? 'nexus-card-interactive cursor-pointer' : 'nexus-card',
        'p-4 md:p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
