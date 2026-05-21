'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Monitor } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

type Appointment = {
  id: string;
  date: string;
  startTime: string;
  status: string;
  queueNumber: number | null;
  doctor: { user: { name: string | null }; specialty: { name: string } };
};

export default function PatientDashboard() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<{ appointments: Appointment[] }>('/api/appointments/my', { token: accessToken }).then((r) =>
      setAppointments(r.appointments.slice(0, 5))
    );
  }, [accessToken]);

  const upcoming = appointments.filter((a) => !['COMPLETED', 'CANCELLED'].includes(a.status));

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('dashboard')}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/doctors">
          <Card className="transition hover:border-teal-300 hover:shadow-lg">
            <Calendar className="h-8 w-8 text-teal-600" />
            <CardTitle className="mt-3">{tr('book')}</CardTitle>
          </Card>
        </Link>
        <Link href="/patient/queue">
          <Card className="transition hover:border-teal-300 hover:shadow-lg">
            <Monitor className="h-8 w-8 text-cyan-600" />
            <CardTitle className="mt-3">{tr('queueTrack')}</CardTitle>
          </Card>
        </Link>
      </div>

      <Card className="mt-8">
        <CardTitle>{tr('myAppointments')}</CardTitle>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-slate-500">{tr('noAppointments')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div>
                  <p className="font-medium">{a.doctor.user.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(a.date, locale)} · {a.startTime}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40">
                    {a.status}
                  </span>
                  {a.queueNumber && (
                    <Link href={`/patient/queue/${a.id}`} className="mt-1 block text-xs text-teal-600 hover:underline">
                      #{a.queueNumber} · {tr('queueTrack')}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
