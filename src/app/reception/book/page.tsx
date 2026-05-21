'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ReceptionBookPage() {
  const { accessToken } = useAuthStore();
  const [doctors, setDoctors] = useState<{ id: string; branchId: string; user: { name: string } }[]>([]);
  const [patients, setPatients] = useState<{ id: string; user: { name: string; phone: string } }[]>([]);
  const [form, setForm] = useState({
    doctorId: '',
    branchId: '',
    patientId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '09:30',
  });

  useEffect(() => {
    api<{ doctors: typeof doctors }>('/api/doctors').then((r) => setDoctors(r.doctors));
    if (accessToken) {
      api<{ patients: typeof patients }>('/api/reception/patients', { token: accessToken }).then((r) =>
        setPatients(r.patients)
      );
    }
  }, [accessToken]);

  async function book() {
    if (!accessToken) return;
    const doctor = doctors.find((d) => d.id === form.doctorId);
    await api('/api/appointments', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({
        ...form,
        branchId: form.branchId || doctor?.branchId,
        type: 'WALK_IN',
      }),
    });
    alert('Booked');
  }

  async function checkIn(appointmentId: string) {
    if (!accessToken) return;
    await api(`/api/appointments/${appointmentId}/check-in`, {
      method: 'POST',
      token: accessToken,
    });
    alert('Checked in — queue assigned');
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Manual booking</h1>
      <Card className="mt-6 space-y-4">
        <select
          className="w-full rounded-xl border px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          value={form.doctorId}
          onChange={(e) => {
            const d = doctors.find((x) => x.id === e.target.value);
            setForm({ ...form, doctorId: e.target.value, branchId: d?.branchId ?? '' });
          }}
        >
          <option value="">Select doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.user.name}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-xl border px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.name} ({p.user.phone})
            </option>
          ))}
        </select>
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <Button onClick={book}>Book walk-in</Button>
      </Card>
    </div>
  );
}
