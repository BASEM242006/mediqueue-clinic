'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | 'SUPER_ADMIN';

export type AuthUser = {
  id: string;
  phone: string;
  name: string | null;
  nameAr: string | null;
  email: string | null;
  role: UserRole;
  locale: string;
  darkMode: boolean;
  patientId?: string;
  doctorId?: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refresh: string, user: AuthUser) => void;
  setUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),
      setUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'mediqueue-auth' }
  )
);

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'DOCTOR':
      return '/doctor';
    case 'RECEPTIONIST':
      return '/reception';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    default:
      return '/patient';
  }
}
