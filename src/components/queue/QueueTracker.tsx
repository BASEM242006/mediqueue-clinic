'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Hash } from 'lucide-react';
import { getSocket, joinQueueRoom, type QueueState } from '@/lib/socket';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';

type TrackData = {
  yourNumber: number;
  currentPatientNumber: number;
  patientsAhead: number;
  estimatedWaitMin: number;
  waitingCount: number;
  appointment: { doctorId: string; branchId: string; status: string };
};

export default function QueueTracker({ appointmentId }: { appointmentId: string }) {
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [data, setData] = useState<TrackData | null>(null);
  const [queue, setQueue] = useState<QueueState | null>(null);

  const fetchTrack = () =>
    api<{
      yourNumber: number;
      currentPatientNumber: number;
      patientsAhead: number;
      estimatedWaitMin: number;
      waitingCount: number;
      appointment: TrackData['appointment'];
      queue: QueueState;
    }>(`/api/queue/appointment/${appointmentId}/track`);

  useEffect(() => {
    fetchTrack().then((res) => {
      setData({
        yourNumber: res.yourNumber,
        currentPatientNumber: res.currentPatientNumber,
        patientsAhead: res.patientsAhead,
        estimatedWaitMin: res.estimatedWaitMin,
        waitingCount: res.waitingCount,
        appointment: res.appointment,
      });
      setQueue(res.queue);
      joinQueueRoom(res.appointment.doctorId, res.appointment.branchId, appointmentId);
    });
  }, [appointmentId]);

  useEffect(() => {
    if (!data) return;
    const poll = setInterval(() => {
      fetchTrack().then((res) => {
        setQueue(res.queue);
        const my = res.queue.entries.find((e) => e.appointmentId === appointmentId);
        setData((d) =>
          d
            ? {
                ...d,
                currentPatientNumber: res.currentPatientNumber,
                yourNumber: res.yourNumber,
                patientsAhead: res.patientsAhead,
                estimatedWaitMin: res.estimatedWaitMin,
                waitingCount: res.waitingCount,
              }
            : null
        );
      }).catch(() => {});
    }, 4000);

    const socket = getSocket();
    const handler = (state: QueueState) => {
      setQueue(state);
      const my = state.entries.find((e) => e.appointmentId === appointmentId);
      const current = state.currentPatient?.queueNumber ?? 0;
      setData((d) =>
        d
          ? {
              ...d,
              currentPatientNumber: current,
              yourNumber: my?.queueNumber ?? d.yourNumber,
              patientsAhead: my
                ? state.entries.filter(
                    (e) => e.status === 'WAITING' && e.position < my.position
                  ).length
                : 0,
              estimatedWaitMin: my?.estimatedWaitMin ?? d.estimatedWaitMin,
              waitingCount: state.waitingCount,
            }
          : null
      );
    };
    socket.on('queue:update', handler);
    return () => {
      clearInterval(poll);
      socket.off('queue:update', handler);
    };
  }, [appointmentId, data?.appointment.doctorId]);

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const progress =
    data.yourNumber > 0
      ? Math.min(100, ((data.currentPatientNumber / data.yourNumber) * 100) || 0)
      : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-8 text-center text-white shadow-2xl"
      >
        <p className="text-sm uppercase tracking-widest text-teal-100">{tr('yourNumber')}</p>
        <p className="mt-2 font-mono text-7xl font-bold">{data.yourNumber || '—'}</p>
        <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <Hash className="mx-auto h-6 w-6 text-teal-600" />
          <p className="mt-2 text-2xl font-bold">{data.currentPatientNumber || '—'}</p>
          <p className="text-xs text-slate-500">{tr('currentPatient')}</p>
        </Card>
        <Card className="text-center">
          <Users className="mx-auto h-6 w-6 text-amber-500" />
          <p className="mt-2 text-2xl font-bold">{data.patientsAhead}</p>
          <p className="text-xs text-slate-500">{tr('patientsAhead')}</p>
        </Card>
        <Card className="text-center">
          <Clock className="mx-auto h-6 w-6 text-cyan-600" />
          <p className="mt-2 text-2xl font-bold">
            {data.estimatedWaitMin} <span className="text-sm font-normal">{tr('minutes')}</span>
          </p>
          <p className="text-xs text-slate-500">{tr('estimatedWait')}</p>
        </Card>
      </div>

      {data.patientsAhead <= 2 && data.patientsAhead > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
        >
          {locale === 'ar'
            ? 'اقترب دورك! يرجى التوجه للعيادة.'
            : 'Almost your turn! Please head to the clinic.'}
        </motion.div>
      )}

      {queue && (
        <Card>
          <p className="mb-3 text-sm font-medium text-slate-500">{tr('waitingPatients')}: {queue.waitingCount}</p>
          <ul className="space-y-2">
            {queue.entries.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className={`flex justify-between rounded-lg px-3 py-2 text-sm ${
                  e.appointmentId === appointmentId
                    ? 'bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <span>#{e.queueNumber}</span>
                <span className="capitalize text-slate-500">{e.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
