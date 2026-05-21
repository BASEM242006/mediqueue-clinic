'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, KeyRound } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore, getDashboardPath, type AuthUser } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { t } from '@/lib/i18n';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useAppStore();
  const { setAuth } = useAuthStore();
  const tr = (k: Parameters<typeof t>[1]) => t(locale, k);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ message: string; devCode?: string }>('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      if (res.devCode) setDevCode(res.devCode);
      setStep('otp');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code, name: name || undefined }),
      });
      setAuth(res.accessToken, res.refreshToken, res.user);
      router.push(getDashboardPath(res.user.role));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="!p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
              {step === 'phone' ? <Phone className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
            </div>
            <h1 className="mt-4 text-2xl font-bold">{tr('phoneLogin')}</h1>
          </div>

          {step === 'phone' ? (
            <div className="space-y-4">
              <Input
                label={tr('phoneLogin')}
                placeholder="+966500000301"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label={locale === 'ar' ? 'الاسم (اختياري)' : 'Name (optional)'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button className="w-full" loading={loading} onClick={sendOtp}>
                {tr('sendOtp')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {devCode && (
                <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  Dev OTP: <strong>{devCode}</strong>
                </p>
              )}
              <Input
                label={tr('enterOtp')}
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button className="w-full" loading={loading} onClick={verify}>
                {tr('verifyOtp')}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-slate-500 hover:text-teal-600"
                onClick={() => setStep('phone')}
              >
                ← {tr('phoneLogin')}
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

          <p className="mt-6 text-center text-xs text-slate-400">
            Demo: +966500000301 (patient), +966500000201 (doctor), +966500000101 (reception), +966500000100 (admin)
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
