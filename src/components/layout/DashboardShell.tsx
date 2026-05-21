'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Stethoscope,
  ClipboardList,
  Monitor,
  BarChart3,
  User,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, type UserRole } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';

type NavItem = { href: string; label: string; icon: React.ElementType; roles?: UserRole[] };

const navByRole: Record<string, NavItem[]> = {
  patient: [
    { href: '/patient', label: 'dashboard', icon: LayoutDashboard },
    { href: '/patient/appointments', label: 'myAppointments', icon: Calendar },
    { href: '/patient/queue', label: 'queueTrack', icon: Monitor },
    { href: '/patient/profile', label: 'profile', icon: User },
    { href: '/patient/files', label: 'uploadFiles', icon: ClipboardList },
  ],
  doctor: [
    { href: '/doctor', label: 'dashboard', icon: LayoutDashboard },
    { href: '/doctor/queue', label: 'queueTrack', icon: Users },
    { href: '/doctor/schedule', label: 'settings', icon: Calendar },
    { href: '/doctor/analytics', label: 'analytics', icon: BarChart3 },
  ],
  reception: [
    { href: '/reception', label: 'dashboard', icon: LayoutDashboard },
    { href: '/reception/book', label: 'walkIn', icon: Stethoscope },
    { href: '/reception/queue', label: 'queueTrack', icon: Users },
    { href: '/reception/tickets', label: 'printTicket', icon: ClipboardList },
  ],
  admin: [
    { href: '/admin', label: 'dashboard', icon: LayoutDashboard },
    { href: '/admin/clinics', label: 'clinics', icon: Stethoscope },
    { href: '/admin/users', label: 'doctors', icon: Users },
    { href: '/admin/reports', label: 'analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'settings', icon: Settings },
  ],
};

export default function DashboardShell({
  children,
  roleKey,
  allowedRoles,
}: {
  children: React.ReactNode;
  roleKey: keyof typeof navByRole;
  allowedRoles: UserRole[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
    else if (user && !allowedRoles.includes(user.role)) router.replace('/');
  }, [accessToken, user, allowedRoles, router]);

  const nav = navByRole[roleKey] ?? [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 lg:block">
        <p className="mb-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {user?.name ?? user?.phone}
        </p>
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {tr(item.label as Parameters<typeof t>[1])}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="mt-8 w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          {tr('logout')}
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
