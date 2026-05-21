'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardTitle } from '@/components/ui/Card';

export default function DoctorSchedulePage() {
  const { accessToken } = useAuthStore();
  const [schedules, setSchedules] = useState<{ dayOfWeek: string; startTime: string; endTime: string }[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<{
      user: {
        doctor: {
          schedules: { dayOfWeek: string; startTime: string; endTime: string }[];
          vacations: { startDate: string; endDate: string }[];
        } | null;
      };
    }>('/api/auth/me', { token: accessToken }).then((r) => {
      if (r.user.doctor) setSchedules(r.user.doctor.schedules);
    });
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Schedule</h1>
      <Card className="mt-6">
        <CardTitle>Weekly hours</CardTitle>
        <ul className="mt-4 space-y-2">
          {schedules.map((s) => (
            <li key={s.dayOfWeek} className="flex justify-between text-sm">
              <span>{s.dayOfWeek}</span>
              <span>
                {s.startTime} – {s.endTime}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
