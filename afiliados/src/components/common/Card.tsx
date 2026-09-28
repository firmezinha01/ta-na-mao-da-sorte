import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow-emerald' | 'glow-amber' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900/90 border border-slate-800 shadow-xl',
    'glow-emerald': 'bg-slate-900 border border-emerald-500/40 shadow-2xl shadow-emerald-950/60',
    'glow-amber': 'bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-950/50',
    flat: 'bg-slate-950/80 border border-slate-800/80',
  }[variant];

  return (
    <div
      className={`rounded-2xl p-5 md:p-6 transition-all ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
