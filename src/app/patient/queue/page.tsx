'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';

type Appointment = {
  id: string;
  queueNumber: number | null;
  status: string;
  doctor: { user: { name: string | null } };
};

export default function PatientQueueListPage() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<{ appointments: Appointment[] }>('/api/appointments/my', { token: accessToken }).then((r) =>
      setItems(r.appointments.filter((a) => a.queueNumber && !['CANCELLED', 'COMPLETED'].includes(a.status)))
    );
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('queueTrack')}</h1>
      <p className="mt-2 text-slate-500">
        {locale === 'ar' ? 'اختر موعداً لمتابعة الطابور مباشرة' : 'Select an appointment to track live'}
      </p>
      <div className="mt-6 space-y-3">
        {items.map((a) => (
          <Link key={a.id} href={`/patient/queue/${a.id}`}>
            <Card className="transition hover:border-teal-400">
              <p className="font-semibold">{a.doctor.user.name}</p>
              <p className="text-teal-600">#{a.queueNumber}</p>
            </Card>
          </Link>
        ))}
        {items.length === 0 && <p className="text-slate-400">{tr('noAppointments')}</p>}
      </div>
    </div>
  );
}
