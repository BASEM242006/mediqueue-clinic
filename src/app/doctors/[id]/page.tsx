'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Doctor = {
  id: string;
  consultationFee: number;
  bio: string | null;
  bioAr: string | null;
  branchId: string;
  user: { name: string | null; nameAr: string | null };
  specialty: { name: string; nameAr: string };
  clinic: { name: string; nameAr: string };
  branch: { name: string; nameAr: string; address: string; addressAr: string | null };
};

type Slot = { startTime: string; endTime: string; available: boolean };

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useAppStore();
  const { accessToken } = useAuthStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const isAr = locale === 'ar';

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<{ doctor: Doctor }>(`/api/doctors/${id}`).then((r) => setDoctor(r.doctor));
  }, [id]);

  useEffect(() => {
    if (!id || !date) return;
    api<{ slots: Slot[] }>(`/api/doctors/${id}/slots?date=${date}`).then((r) => setSlots(r.slots));
  }, [id, date]);

  async function book() {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    if (!selected || !doctor) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await api<{ appointment: { id: string } }>('/api/appointments', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({
          doctorId: doctor.id,
          branchId: doctor.branchId,
          date,
          startTime: selected.startTime,
          endTime: selected.endTime,
        }),
      });
      setMsg(isAr ? 'تم تأكيد الحجز!' : 'Booking confirmed!');
      router.push(`/patient/appointments/${res.appointment.id}`);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  if (!doctor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const name = isAr && doctor.user.nameAr ? doctor.user.nameAr : doctor.user.name;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-3xl font-bold text-white">
            {(name ?? 'D')[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            <p className="text-teal-600">{isAr ? doctor.specialty.nameAr : doctor.specialty.name}</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {isAr ? doctor.branch.addressAr ?? doctor.branch.address : doctor.branch.address}
            </p>
            <p className="mt-4 font-semibold">
              {tr('fee')}: {doctor.consultationFee} SAR
            </p>
            {(isAr ? doctor.bioAr : doctor.bio) && (
              <p className="mt-4 text-slate-600 dark:text-slate-400">{isAr ? doctor.bioAr : doctor.bio}</p>
            )}
          </div>
        </div>

        <Card className="mt-10">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            {tr('book')}
          </CardTitle>
          <input
            type="date"
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            value={date}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => {
              setDate(e.target.value);
              setSelected(null);
            }}
          />
          <p className="mt-4 text-sm font-medium text-slate-500">{tr('availableSlots')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {slots.filter((s) => s.available).map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                onClick={() => setSelected(slot)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition',
                  selected?.startTime === slot.startTime
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 hover:border-teal-400 dark:border-slate-700'
                )}
              >
                {slot.startTime}
              </button>
            ))}
            {slots.filter((s) => s.available).length === 0 && (
              <p className="text-sm text-slate-400">{isAr ? 'لا توجد أوقات' : 'No slots available'}</p>
            )}
          </div>
          <Button className="mt-6 w-full sm:w-auto" loading={loading} disabled={!selected} onClick={book}>
            {tr('confirmBooking')}
          </Button>
          {msg && <p className="mt-3 text-sm text-teal-600">{msg}</p>}
        </Card>
      </motion.div>
    </div>
  );
}
