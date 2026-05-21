'use client';

import { useEffect, useState } from 'react';
import { getSocket, joinQueueRoom, type QueueState } from '@/lib/socket';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';

type Doctor = { id: string; branchId: string; user: { name: string | null } };

export default function ReceptionQueuePage() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [queue, setQueue] = useState<QueueState | null>(null);

  useEffect(() => {
    api<{ doctors: Doctor[] }>('/api/doctors').then((r) => setDoctors(r.doctors));
  }, []);

  useEffect(() => {
    if (!selected) return;
    joinQueueRoom(selected.id, selected.branchId);
    api<QueueState>(`/api/queue/${selected.id}/${selected.branchId}`).then(setQueue);
    const socket = getSocket();
    socket.on('queue:update', setQueue);
    return () => {
      socket.off('queue:update', setQueue);
    };
  }, [selected]);

  async function callNext() {
    if (!accessToken || !selected) return;
    await api(`/api/queue/${selected.id}/${selected.branchId}/call-next`, {
      method: 'POST',
      token: accessToken,
    });
  }

  async function checkIn(appointmentId: string) {
    if (!accessToken) return;
    await api(`/api/appointments/${appointmentId}/check-in`, {
      method: 'POST',
      token: accessToken,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('queueTrack')}</h1>
      <select
        className="mt-4 rounded-xl border px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
        value={selected?.id ?? ''}
        onChange={(e) => setSelected(doctors.find((d) => d.id === e.target.value) ?? null)}
      >
        <option value="">Select doctor</option>
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            {d.user.name}
          </option>
        ))}
      </select>

      {selected && (
        <>
          <Button className="mt-4" onClick={callNext}>
            {tr('callNext')}
          </Button>
          {queue?.currentPatient && (
            <Card className="mt-6">
              <CardTitle>{tr('currentPatient')}</CardTitle>
              <p className="text-4xl font-bold text-teal-600">#{queue.currentPatient.queueNumber}</p>
            </Card>
          )}
          <Card className="mt-6">
            <ul className="space-y-2">
              {queue?.entries.map((e) => (
                <li key={e.id} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
                  <span>
                    #{e.queueNumber} {e.patientName} — {e.status}
                  </span>
                  {e.status === 'WAITING' && (
                    <button
                      type="button"
                      className="text-xs text-teal-600"
                      onClick={() => checkIn(e.appointmentId)}
                    >
                      Check in
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
