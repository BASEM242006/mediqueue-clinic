'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardTitle } from '@/components/ui/Card';

type Clinic = {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  branches: { id: string; name: string; nameAr: string }[];
};

export default function AdminClinicsPage() {
  const { accessToken } = useAuthStore();
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api<{ clinics: Clinic[] }>('/api/admin/clinics', { token: accessToken }).then((r) =>
      setClinics(r.clinics)
    );
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Clinics & Branches</h1>
      <div className="mt-6 space-y-4">
        {clinics.map((c) => (
          <Card key={c.id}>
            <CardTitle>
              {c.name} / {c.nameAr}
            </CardTitle>
            <p className="text-sm text-slate-500">{c.city}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {c.branches.map((b) => (
                <li key={b.id}>
                  • {b.name} ({b.nameAr})
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
