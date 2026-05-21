'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ReceptionTicketsPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [queueNumber, setQueueNumber] = useState('');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const trackUrl = ticketCode ? `${appUrl}/patient/queue?code=${ticketCode}` : '';

  return (
    <div>
      <h1 className="text-2xl font-bold">Print ticket</h1>
      <Card className="mt-6 max-w-sm space-y-4">
        <Input
          label="Appointment / ticket code"
          value={ticketCode}
          onChange={(e) => setTicketCode(e.target.value)}
        />
        <Input label="Queue number" value={queueNumber} onChange={(e) => setQueueNumber(e.target.value)} />
        {ticketCode && (
          <div className="flex flex-col items-center rounded-xl border p-6 print:border-0">
            <p className="text-4xl font-bold text-teal-700">#{queueNumber || '—'}</p>
            <p className="mt-2 text-sm text-slate-500">Scan to track queue</p>
            <QRCodeSVG value={trackUrl} size={160} className="mt-4" />
            <p className="mt-2 break-all text-xs text-slate-400">{ticketCode}</p>
            <button
              type="button"
              className="mt-4 text-sm text-teal-600 hover:underline"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
