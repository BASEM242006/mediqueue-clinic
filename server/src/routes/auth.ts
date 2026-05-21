import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateRefreshToken, signAccessToken } from '../lib/jwt.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { normalizePhone, sendOtp, verifyOtp } from '../services/otp.js';

const router = Router();

const phoneSchema = z.object({
  phone: z.string().min(8),
  name: z.string().optional(),
  locale: z.enum(['en', 'ar']).optional(),
});

const verifySchema = z.object({
  phone: z.string().min(8),
  code: z.string().length(6),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

router.post('/otp/send', async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await sendOtp(parsed.data.phone);
  res.json(result);
});

router.post('/otp/verify', async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const phone = normalizePhone(parsed.data.phone);
  const valid = await verifyOtp(phone, parsed.data.code);
  if (!valid) return res.status(401).json({ error: 'Invalid or expired OTP' });

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    const role = parsed.data.role ?? UserRole.PATIENT;
    user = await prisma.user.create({
      data: {
        phone,
        name: parsed.data.name,
        role,
        locale: 'en',
      },
    });

    if (role === UserRole.PATIENT) {
      await prisma.patient.create({ data: { userId: user.id } });
    }
  } else if (parsed.data.name && !user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    });
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    phone: user.phone,
  });

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30));

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
    include: { specialty: true, branch: true, clinic: true },
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      nameAr: user.nameAr,
      email: user.email,
      role: user.role,
      locale: user.locale,
      darkMode: user.darkMode,
      patientId: patient?.id,
      doctorId: doctor?.id,
    },
  });
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      patient: true,
      doctor: { include: { specialty: true, clinic: true, branch: true } },
      staff: { include: { clinic: true, branch: true } },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  const { name, nameAr, email, locale, darkMode, fcmToken } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, nameAr, email, locale, darkMode, fcmToken },
  });
  res.json({ user });
});

export default router;
