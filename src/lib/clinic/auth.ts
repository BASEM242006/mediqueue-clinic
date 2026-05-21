import { UserRole } from '@prisma/client';
import { verifyAccessToken, getBearerToken } from '@/lib/clinic/jwt';
import { prisma } from '@/lib/prisma';

export async function requireAuth(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return payload;
  } catch {
    return null;
  }
}

export async function getPatientId(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  return patient?.id ?? null;
}

export { UserRole };
