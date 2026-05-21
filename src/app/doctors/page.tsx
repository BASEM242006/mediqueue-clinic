'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import DoctorCard from '@/components/doctors/DoctorCard';
import Input from '@/components/ui/Input';

type Specialty = { id: string; slug: string; name: string; nameAr: string };
type Doctor = Parameters<typeof DoctorCard>[0]['doctor'];

export default function DoctorsPage() {
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialty, setSpecialty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ specialties: Specialty[] }>('/api/doctors/specialties').then((r) => setSpecialties(r.specialties));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (search) params.set('search', search);
    api<{ doctors: Doctor[] }>(`/api/doctors?${params}`)
      .then((r) => setDoctors(r.doctors))
      .finally(() => setLoading(false));
  }, [specialty, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tr('doctors')}</h1>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
          <input
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800 rtl:pl-4 rtl:pr-10"
            placeholder={tr('searchDoctors')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">{locale === 'ar' ? 'كل التخصصات' : 'All specialties'}</option>
          {specialties.map((s) => (
            <option key={s.slug} value={s.slug}>
              {locale === 'ar' ? s.nameAr : s.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d, i) => (
            <DoctorCard key={d.id} doctor={d} index={i} />
          ))}
        </div>
      )}

      {!loading && doctors.length === 0 && (
        <p className="mt-16 text-center text-slate-500">{tr('noAppointments')}</p>
      )}
    </div>
  );
}
