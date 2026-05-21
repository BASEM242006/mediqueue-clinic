import { prisma } from '@/lib/prisma';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) return '+966' + cleaned.slice(1);
  if (!cleaned.startsWith('+')) return '+' + cleaned;
  return cleaned;
}

export async function sendOtp(phone: string) {
  const normalized = normalizePhone(phone);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone: normalized, code, expiresAt },
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) console.log(`[OTP] ${normalized} => ${code}`);

  return {
    message: 'OTP sent successfully',
    ...(isDev ? { devCode: code } : {}),
  };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const record = await prisma.otpCode.findFirst({
    where: {
      phone: normalized,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return false;
  await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
  return true;
}
