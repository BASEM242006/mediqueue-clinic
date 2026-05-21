import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizePhone, verifyOtp } from '@/lib/clinic/otp';
import { signAccessToken } from '@/lib/clinic/jwt';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, code, name, role } = body;
  if (!phone || !code) {
    return NextResponse.json({ error: 'phone and code required' }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  const valid = await verifyOtp(normalized, code);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
  }

  let user = await prisma.user.findUnique({ where: { phone: normalized } });

  if (!user) {
    const userRole = (role as UserRole) ?? UserRole.PATIENT;
    user = await prisma.user.create({
      data: { phone: normalized, name, role: userRole, locale: 'en' },
    });
    if (userRole === UserRole.PATIENT) {
      await prisma.patient.create({ data: { userId: user.id } });
    }
  } else if (name && !user.name) {
    user = await prisma.user.update({ where: { id: user.id }, data: { name } });
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    phone: user.phone,
  });

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    accessToken,
    refreshToken: crypto.randomUUID(),
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
}
