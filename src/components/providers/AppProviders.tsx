'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const { darkMode, locale } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [darkMode, locale]);

  return <>{children}</>;
}
