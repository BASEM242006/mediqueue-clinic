'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, joinQueueRoom, type QueueState } from '@/lib/socket';
import { api } from '@/lib/api';

function DisplayContent() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId') ?? '';
  const branchId = searchParams.get('branchId') ?? '';
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [doctors, setDoctors] = useState<{ id: string; branchId: string; user: { name: string } }[]>([]);
  const [selected, setSelected] = useState({ doctorId, branchId });

  useEffect(() => {
    api<{ doctors: typeof doctors }>('/api/doctors').then((r) => {
      setDoctors(r.doctors);
      if (!doctorId && r.doctors[0]) {
        setSelected({ doctorId: r.doctors[0].id, branchId: r.doctors[0].branchId });
      }
    });
  }, [doctorId]);

  useEffect(() => {
    if (!selected.doctorId || !selected.branchId) return;
    joinQueueRoom(selected.doctorId, selected.branchId);
    api<QueueState>(`/api/queue/${selected.doctorId}/${selected.branchId}`).then(setQueue);
    const socket = getSocket();
    socket.on('queue:update', setQueue);
    return () => {
      socket.off('queue:update', setQueue);
    };
  }, [selected]);

  const current = queue?.currentPatient?.queueNumber;
  const next = queue?.entries.filter((e) => e.status === 'WAITING').slice(0, 5);

  return (
    <div className="min-h-screen medical-gradient p-8 text-white">
      {!doctorId && (
        <select
          className="mb-6 rounded-lg bg-white/10 px-4 py-2 text-white"
          value={selected.doctorId}
          onChange={(e) => {
            const d = doctors.find((x) => x.id === e.target.value);
            if (d) setSelected({ doctorId: d.id, branchId: d.branchId });
          }}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id} className="text-black">
              {d.user.name}
            </option>
          ))}
        </select>
      )}

      <div className="text-center">
        <p className="text-xl uppercase tracking-[0.3em] text-teal-100">Now Serving</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={current ?? 'none'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="mt-4 font-mono text-[12rem] font-bold leading-none sm:text-[16rem]"
          >
            {current ?? '—'}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <p className="mb-4 text-center text-lg text-teal-100">Up Next</p>
        <div className="flex flex-wrap justify-center gap-6">
          {next?.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 text-4xl font-bold backdrop-blur"
            >
              {e.queueNumber}
            </motion.div>
          ))}
        </div>
        <p className="mt-12 text-center text-teal-100/80">
          Waiting: {queue?.waitingCount ?? 0} patients
        </p>
      </div>
    </div>
  );
}

export default function QueueDisplayPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center medical-gradient text-white">Loading...</div>}>
      <DisplayContent />
    </Suspense>
  );
}
