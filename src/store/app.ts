'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/lib/i18n';

type AppState = {
  locale: Locale;
  darkMode: boolean;
  setLocale: (locale: Locale) => void;
  toggleDark: () => void;
  setDarkMode: (v: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: 'en',
      darkMode: false,
      setLocale: (locale) => set({ locale }),
      toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    { name: 'mediqueue-app' }
  )
);
