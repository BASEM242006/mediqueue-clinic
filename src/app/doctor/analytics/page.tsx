'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardTitle } from '@/components/ui/Card';

export default function DoctorAnalyticsPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState({ total: 0, completed: 0, waiting: 0, cancelled: 0 });

  useEffect(() => {
    if (!accessToken) return;
    api<{ stats: typeof stats }>('/api/appointments/doctor/today', { token: accessToken }).then((r) =>
      setStats(r.stats)
    );
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}>
            <CardTitle className="capitalize">{k}</CardTitle>
            <p className="mt-2 text-3xl font-bold">{v}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
