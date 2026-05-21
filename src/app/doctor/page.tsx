'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Appointment = {
  id: string;
  startTime: string;
  status: string;
  queueNumber: number | null;
  patient: { user: { name: string | null; phone: string } };
};

export default function DoctorDashboard() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, waiting: 0 });

  function load() {
    if (!accessToken) return;
    api<{ appointments: Appointment[]; stats: typeof stats }>('/api/appointments/doctor/today', {
      token: accessToken,
    }).then((r) => {
      setAppointments(r.appointments);
      setStats(r.stats);
    });
  }

  useEffect(load, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('todayAppointments')}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <Users className="h-8 w-8 text-teal-600" />
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-slate-500">Done</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <Clock className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-2xl font-bold">{stats.waiting}</p>
            <p className="text-xs text-slate-500">{tr('waitingPatients')}</p>
          </div>
        </Card>
      </div>

      <Link href="/doctor/queue">
        <Button className="mt-6">{tr('callNext')}</Button>
      </Link>

      <Card className="mt-8">
        <CardTitle>{tr('todayAppointments')}</CardTitle>
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {appointments.map((a) => (
            <li key={a.id} className="flex justify-between py-3">
              <div>
                <p className="font-medium">{a.patient.user.name}</p>
                <p className="text-sm text-slate-500">{a.startTime}</p>
              </div>
              <span className="text-sm">
                {a.queueNumber ? `#${a.queueNumber}` : '—'} · {a.status}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
