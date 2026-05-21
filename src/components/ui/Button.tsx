'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20',
  secondary: 'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900',
  outline: 'border-2 border-teal-600 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export default function Button({
  variant = 'primary',
  className,
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...(props as object)}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  );
}
