'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card, CardTitle } from '@/components/ui/Card';

export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointmentsToday: 0,
    clinics: 0,
    revenueToday: 0,
  });

  useEffect(() => {
    if (!accessToken) return;
    api<{ stats: typeof stats }>('/api/admin/dashboard', { token: accessToken }).then((r) =>
      setStats(r.stats)
    );
  }, [accessToken]);

  const items = [
    { label: 'Patients', value: stats.patients },
    { label: tr('doctors'), value: stats.doctors },
    { label: 'Today appointments', value: stats.appointmentsToday },
    { label: tr('clinics'), value: stats.clinics },
    { label: 'Revenue (SAR)', value: stats.revenueToday },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {tr('admin')} {tr('dashboard')}
      </h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label}>
            <CardTitle className="!text-sm !font-normal text-slate-500">{item.label}</CardTitle>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
