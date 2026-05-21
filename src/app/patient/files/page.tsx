'use client';

import { useEffect, useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type MedicalFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
};

export default function PatientFilesPage() {
  const { accessToken } = useAuthStore();
  const { locale } = useAppStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    if (!accessToken) return;
    fetch(`${getApiUrl()}/api/patients/files`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []));
  }

  useEffect(load, [accessToken]);

  async function upload(file: File) {
    if (!accessToken) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fileType', 'report');
    await fetch(`${getApiUrl()}/api/patients/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: fd,
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{tr('uploadFiles')}</h1>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button className="mt-4" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        Upload
      </Button>
      <div className="mt-6 space-y-3">
        {files.map((f) => (
          <Card key={f.id}>
            <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline">
              {f.fileName}
            </a>
            <p className="text-xs text-slate-400">{f.fileType} · {new Date(f.uploadedAt).toLocaleDateString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
