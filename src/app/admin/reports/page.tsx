'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardTitle } from '@/components/ui/Card';

export default function AdminReportsPage() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<{ status: string; _count: number; _sum: { fee: number | null } }[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<{ appointments: typeof data }>('/api/admin/reports/appointments', { token: accessToken }).then(
      (r) => setData(r.appointments)
    );
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {data.map((row) => (
          <Card key={row.status}>
            <CardTitle className="capitalize">{row.status.toLowerCase()}</CardTitle>
            <p className="text-2xl font-bold">{row._count}</p>
            <p className="text-sm text-slate-500">Fees: {row._sum.fee ?? 0} SAR</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
