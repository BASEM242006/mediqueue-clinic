'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/Card';

type User = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  doctor?: { specialty: { name: string } };
};

export default function AdminUsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    const q = filter ? `?role=${filter}` : '';
    api<{ users: User[] }>(`/api/admin/users${q}`, { token: accessToken }).then((r) => setUsers(r.users));
  }, [accessToken, filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <select
        className="mt-4 rounded-xl border px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="">All roles</option>
        <option value="PATIENT">Patients</option>
        <option value="DOCTOR">Doctors</option>
        <option value="RECEPTIONIST">Reception</option>
      </select>
      <div className="mt-6 space-y-2">
        {users.map((u) => (
          <Card key={u.id} className="!py-3">
            <div className="flex justify-between">
              <span className="font-medium">{u.name ?? u.phone}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{u.role}</span>
            </div>
            {u.doctor && <p className="text-sm text-slate-500">{u.doctor.specialty.name}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
