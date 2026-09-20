import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'error', title, children, className }: AlertProps) {
  const styles = {
    error: 'bg-red-950/40 border-red-800/50 text-red-300',
    success: 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300',
    warning: 'bg-amber-950/40 border-amber-800/50 text-amber-300',
    info: 'bg-blue-950/40 border-blue-800/50 text-blue-300',
  };

  const icons = {
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={twMerge(
        clsx(
          'p-3.5 border rounded-xl text-xs sm:text-sm flex gap-3 items-start backdrop-blur-sm',
          styles[variant],
          className
        )
      )}
    >
      {icons[variant]}
      <div className="space-y-1">
        {title && <h4 className="font-semibold leading-tight">{title}</h4>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}
