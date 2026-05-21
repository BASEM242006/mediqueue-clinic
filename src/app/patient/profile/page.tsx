'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function PatientProfilePage() {
  const { accessToken, user, setUser } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [form, setForm] = useState({ name: '', email: '', gender: '', bloodType: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api<{ patient: { user: { name: string; email: string }; gender: string; bloodType: string } }>(
      '/api/patients/profile',
      { token: accessToken }
    ).then((r) => {
      setForm({
        name: r.patient.user.name ?? '',
        email: r.patient.user.email ?? '',
        gender: r.patient.gender ?? '',
        bloodType: r.patient.bloodType ?? '',
      });
    });
  }, [accessToken]);

  async function save() {
    if (!accessToken) return;
    await api('/api/patients/profile', {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify(form),
    });
    setUser({ name: form.name, email: form.email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">{tr('profile')}</h1>
      <Card className="mt-6 space-y-4">
        <Input label="Phone" value={user?.phone ?? ''} disabled />
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
        <Input
          label="Blood type"
          value={form.bloodType}
          onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
        />
        <Button onClick={save}>{saved ? '✓ Saved' : 'Save'}</Button>
      </Card>
    </div>
  );
}
