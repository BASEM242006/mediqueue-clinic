'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Monitor,
  Bell,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import Button from '@/components/ui/Button';

const features = [
  { icon: Calendar, titleEn: 'Online Booking', titleAr: 'حجز أونلاين', descEn: 'Book by specialty, date & time slot', descAr: 'احجز حسب التخصص والتاريخ' },
  { icon: Monitor, titleEn: 'Live Queue', titleAr: 'طابور مباشر', descEn: 'Track your number from home', descAr: 'تابع رقمك من المنزل' },
  { icon: Bell, titleEn: 'Smart Alerts', titleAr: 'تنبيهات ذكية', descEn: 'SMS, WhatsApp, Email & Push', descAr: 'رسائل وواتساب وإيميل' },
  { icon: Shield, titleEn: 'Secure & RBAC', titleAr: 'آمن ومتعدد الأدوار', descEn: 'Admin, doctor, reception portals', descAr: 'لوحات إدارة وأطباء واستقبال' },
];

export default function HomePage() {
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const isAr = locale === 'ar';

  return (
    <div className="overflow-hidden">
      <section className="relative medical-gradient px-4 py-24 text-white sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Activity className="mx-auto h-14 w-14 text-teal-200" />
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              {tr('appName')}
            </h1>
            <p className="mt-4 text-lg text-teal-100 sm:text-xl">{tr('tagline')}</p>
            <p className="mx-auto mt-6 max-w-2xl text-teal-50/90">
              {isAr
                ? 'نظام متكامل لإدارة العيادات — حجز المواعيد، متابعة الطابور لحظياً، ولوحات تحكم للأطباء والاستقبال والإدارة.'
                : 'Complete clinic management — book appointments, monitor queues in real time, and power doctor, reception & admin dashboards.'}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/doctors">
                <Button className="!bg-white !text-teal-800 hover:!bg-teal-50">
                  {tr('bookNow')}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="!border-white !text-white hover:!bg-white/10">
                  {tr('login')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          {isAr ? 'لماذا ميديكيو؟' : 'Why MediQueue?'}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.titleEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
            >
              <f.icon className="h-10 w-10 text-teal-600" />
              <h3 className="mt-4 font-semibold">{isAr ? f.titleAr : f.titleEn}</h3>
              <p className="mt-2 text-sm text-slate-500">{isAr ? f.descAr : f.descEn}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:flex-row sm:text-left">
          <Smartphone className="h-16 w-16 shrink-0 text-teal-600" />
          <div>
            <h3 className="text-xl font-bold">
              {isAr ? 'انتظر من المنزل' : 'Wait from home'}
            </h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {isAr
                ? 'بعد تسجيل الحضور، تابع رقم الطابور ووقت الانتظار المتوقع مباشرة على هاتفك.'
                : 'After check-in, watch your queue number and estimated wait update live on your phone.'}
            </p>
            <Link href="/patient/queue" className="mt-4 inline-block text-teal-600 font-medium hover:underline">
              {tr('queueTrack')} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
