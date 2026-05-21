'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Globe, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app';
import { useAuthStore, getDashboardPath } from '@/store/auth';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const pathname = usePathname();
  const { locale, darkMode, setLocale, toggleDark } = useAppStore();
  const { user, logout, accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);

  const links = [
    { href: '/', label: tr('home') },
    { href: '/doctors', label: tr('doctors') },
    { href: '/display', label: tr('queueDisplay') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-400">
          <Activity className="h-7 w-7" />
          <span>{tr('appName')}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition hover:text-teal-600',
                pathname === l.href ? 'text-teal-600' : 'text-slate-600 dark:text-slate-400'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={tr('language')}
          >
            <Globe className="h-5 w-5" />
            <span className="sr-only">{locale}</span>
          </button>
          <button
            type="button"
            onClick={toggleDark}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {accessToken && user ? (
            <>
              <Link href={getDashboardPath(user.role)}>
                <Button variant="outline" className="!py-2 !px-4 text-xs">
                  {tr('dashboard')}
                </Button>
              </Link>
              <Button variant="ghost" className="!py-2 !px-3 text-xs" onClick={logout}>
                {tr('logout')}
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="!py-2 !px-4 text-xs">{tr('login')}</Button>
            </Link>
          )}
        </div>

        <button type="button" className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 dark:border-slate-800 md:hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 font-medium">
                  {l.label}
                </Link>
              ))}
              <Link href={accessToken ? getDashboardPath(user!.role) : '/login'} onClick={() => setOpen(false)}>
                {accessToken ? tr('dashboard') : tr('login')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
