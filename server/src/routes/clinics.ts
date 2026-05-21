import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    include: { branches: { where: { isActive: true } } },
  });
  res.json({ clinics });
});

router.get('/:slug', async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: req.params.slug },
    include: {
      branches: { where: { isActive: true } },
      doctors: {
        where: { isActive: true },
        include: {
          user: { select: { name: true, nameAr: true, avatarUrl: true } },
          specialty: true,
        },
      },
    },
  });
  if (!clinic) return res.status(404).json({ error: 'Clinic not found' });
  res.json({ clinic });
});

export default router;
