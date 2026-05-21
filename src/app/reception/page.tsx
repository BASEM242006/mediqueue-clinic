'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card, CardTitle } from '@/components/ui/Card';

export default function ReceptionDashboard() {
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('reception')}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/reception/book">
          <Card className="hover:border-teal-400">
            <CardTitle>{tr('walkIn')}</CardTitle>
          </Card>
        </Link>
        <Link href="/reception/queue">
          <Card className="hover:border-teal-400">
            <CardTitle>{tr('queueTrack')}</CardTitle>
          </Card>
        </Link>
        <Link href="/reception/tickets">
          <Card className="hover:border-teal-400">
            <CardTitle>{tr('printTicket')}</CardTitle>
          </Card>
        </Link>
      </div>
    </div>
  );
}
