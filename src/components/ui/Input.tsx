import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export default function Input({ className, label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block w-full">
      {label ? <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span> : null}
      <input
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white',
          className
        )}
        {...props}
      />
    </label>
  );
}
