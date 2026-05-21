'use client';

import { useEffect, useState } from 'react';
import { getSocket, joinQueueRoom, type QueueState } from '@/lib/socket';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';

export default function DoctorQueuePage() {
  const { accessToken, user } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    api<{ user: { doctor: { id: string; branchId: string } } }>('/api/auth/me', { token: accessToken }).then(
      (r) => {
        if (r.user.doctor) {
          setDoctorId(r.user.doctor.id);
          setBranchId(r.user.doctor.branchId);
          joinQueueRoom(r.user.doctor.id, r.user.doctor.branchId);
          api<QueueState>(`/api/queue/${r.user.doctor.id}/${r.user.doctor.branchId}`).then(setQueue);
        }
      }
    );
  }, [accessToken]);

  useEffect(() => {
    if (!doctorId) return;
    const socket = getSocket();
    socket.on('queue:update', setQueue);
    return () => {
      socket.off('queue:update', setQueue);
    };
  }, [doctorId]);

  async function callNext() {
    if (!accessToken || !doctorId) return;
    await api(`/api/queue/${doctorId}/${branchId}/call-next`, {
      method: 'POST',
      token: accessToken,
    });
  }

  async function complete(appointmentId: string) {
    if (!accessToken || !doctorId) return;
    await api(`/api/queue/${doctorId}/${branchId}/complete/${appointmentId}`, {
      method: 'POST',
      token: accessToken,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('queueTrack')}</h1>
      <div className="mt-6 flex gap-3">
        <Button onClick={callNext}>{tr('callNext')}</Button>
      </div>

      {queue?.currentPatient && (
        <Card className="mt-6 border-teal-300 bg-teal-50/50 dark:bg-teal-950/20">
          <CardTitle>{tr('currentPatient')}</CardTitle>
          <p className="mt-2 text-4xl font-bold text-teal-700">#{queue.currentPatient.queueNumber}</p>
          <p>{queue.currentPatient.patientName}</p>
        </Card>
      )}

      <Card className="mt-6">
        <CardTitle>{tr('waitingPatients')} ({queue?.waitingCount ?? 0})</CardTitle>
        <ul className="mt-4 space-y-2">
          {queue?.entries
            .filter((e) => e.status === 'WAITING' || e.status === 'CALLED')
            .map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                <span>
                  #{e.queueNumber} {e.patientName}
                </span>
                <div className="flex gap-2">
                  <span className="text-xs text-slate-500">{e.estimatedWaitMin}m</span>
                  {e.status === 'CALLED' && (
                    <Button variant="outline" className="!py-1 !px-2 !text-xs" onClick={() => complete(e.appointmentId)}>
                      Complete
                    </Button>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
