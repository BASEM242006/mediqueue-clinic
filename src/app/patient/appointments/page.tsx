'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

type Appointment = {
  id: string;
  date: string;
  startTime: string;
  status: string;
  queueNumber: number | null;
  doctor: { user: { name: string | null }; specialty: { name: string } };
  branch: { name: string };
};

export default function PatientAppointmentsPage() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  function load() {
    if (!accessToken) return;
    api<{ appointments: Appointment[] }>('/api/appointments/my', { token: accessToken }).then((r) =>
      setAppointments(r.appointments)
    );
  }

  useEffect(load, [accessToken]);

  async function cancel(id: string) {
    if (!accessToken || !confirm('Cancel appointment?')) return;
    try {
      await api(`/api/appointments/${id}/cancel`, {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify({ reason: 'Patient request' }),
      });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('myAppointments')}</h1>
      <div className="mt-6 space-y-4">
        {appointments.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{a.doctor.user.name}</p>
                <p className="text-sm text-slate-500">{a.doctor.specialty.name} · {a.branch.name}</p>
                <p className="mt-1 text-sm">
                  {formatDate(a.date, locale)} · {a.startTime}
                </p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                  {a.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.queueNumber && ['CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED'].includes(a.status) && (
                  <Link href={`/patient/queue/${a.id}`}>
                    <Button variant="outline" className="!py-2 !text-xs">
                      {tr('queueTrack')} #{a.queueNumber}
                    </Button>
                  </Link>
                )}
                {!['COMPLETED', 'CANCELLED'].includes(a.status) && (
                  <Button variant="danger" className="!py-2 !text-xs" onClick={() => cancel(a.id)}>
                    {tr('cancel')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
