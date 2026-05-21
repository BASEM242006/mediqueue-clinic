'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

type Doctor = {
  id: string;
  consultationFee: number;
  avgDurationMin: number;
  rating: number;
  user: { name: string | null; nameAr: string | null; avatarUrl: string | null };
  specialty: { name: string; nameAr: string; slug: string };
  clinic: { name: string; nameAr: string };
  branch: { name: string; nameAr: string; address: string };
};

export default function DoctorCard({ doctor, index = 0 }: { doctor: Doctor; index?: number }) {
  const { locale } = useAppStore();
  const name = locale === 'ar' && doctor.user.nameAr ? doctor.user.nameAr : doctor.user.name;
  const specialty = locale === 'ar' ? doctor.specialty.nameAr : doctor.specialty.name;
  const branch = locale === 'ar' ? doctor.branch.nameAr : doctor.branch.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
    >
      <Link href={`/doctors/${doctor.id}`}>
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/10 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-700">
          <div className="flex h-28 items-center justify-center bg-gradient-to-br from-teal-500/10 to-cyan-500/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-2xl font-bold text-white">
              {(name ?? 'D')[0]}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-400">
                  {name}
                </h3>
                <p className="text-sm text-teal-600 dark:text-teal-400">{specialty}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {doctor.rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {branch}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white">
                {doctor.consultationFee} SAR
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {doctor.avgDurationMin} min
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
