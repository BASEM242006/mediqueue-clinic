'use client';

import { useParams } from 'next/navigation';
import QueueTracker from '@/components/queue/QueueTracker';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';

export default function PatientQueueTrackPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('queueTrack')}</h1>
      <div className="mt-8 max-w-lg">
        <QueueTracker appointmentId={id} />
      </div>
    </div>
  );
}
