import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export type AuthRequest = Request & {
  user?: {
    id: string;
    role: UserRole;
    phone: string;
  };
};

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.userId, role: payload.role as UserRole, phone: payload.phone };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export async function attachPatient(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
  (req as AuthRequest & { patientId: string }).patientId = patient.id;
  next();
}

export async function attachDoctor(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });
  (req as AuthRequest & { doctorId: string }).doctorId = doctor.id;
  next();
}
