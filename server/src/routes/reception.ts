import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRoles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/patients', async (_req, res) => {
  const patients = await prisma.patient.findMany({
    take: 100,
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    patients: patients.map((p) => ({
      id: p.id,
      user: { name: p.user.name, phone: p.user.phone },
    })),
  });
});

export default router;
