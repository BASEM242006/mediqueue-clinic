'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const { accessToken } = useAuthStore();
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<{ settings: typeof settings }>('/api/admin/settings', { token: accessToken }).then((r) =>
      setSettings(r.settings)
    );
  }, [accessToken]);

  async function save(key: string, value: string) {
    if (!accessToken) return;
    await api(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify({ value }),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">System settings</h1>
      <div className="mt-6 max-w-lg space-y-3">
        {settings.map((s) => (
          <Card key={s.key} className="flex items-center gap-4 !py-3">
            <span className="flex-1 text-sm font-medium">{s.key}</span>
            <input
              className="w-32 rounded-lg border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
              defaultValue={s.value}
              onBlur={(e) => save(s.key, e.target.value)}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
