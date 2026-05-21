import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/dashboard', async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [patients, doctors, appointmentsToday, clinics, revenue] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.appointment.count({
      where: { date: { gte: today, lt: tomorrow } },
    }),
    prisma.clinic.count({ where: { isActive: true } }),
    prisma.appointment.aggregate({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ['COMPLETED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
      _sum: { fee: true },
    }),
  ]);

  const appointmentsByStatus = await prisma.appointment.groupBy({
    by: ['status'],
    where: { date: { gte: today, lt: tomorrow } },
    _count: true,
  });

  res.json({
    stats: {
      patients,
      doctors,
      appointmentsToday,
      clinics,
      revenueToday: revenue._sum.fee ?? 0,
    },
    appointmentsByStatus,
  });
});

router.get('/clinics', async (_req, res) => {
  const clinics = await prisma.clinic.findMany({
    include: { branches: true, doctors: { include: { user: true, specialty: true } } },
  });
  res.json({ clinics });
});

router.post('/clinics', async (req, res) => {
  const clinic = await prisma.clinic.create({ data: req.body });
  res.status(201).json({ clinic });
});

router.post('/branches', async (req, res) => {
  const branch = await prisma.branch.create({ data: req.body });
  res.status(201).json({ branch });
});

router.get('/specialties', async (_req, res) => {
  const specialties = await prisma.specialty.findMany();
  res.json({ specialties });
});

router.post('/specialties', async (req, res) => {
  const specialty = await prisma.specialty.create({ data: req.body });
  res.status(201).json({ specialty });
});

router.get('/users', async (req, res) => {
  const { role } = req.query;
  const users = await prisma.user.findMany({
    where: role ? { role: role as UserRole } : {},
    include: { patient: true, doctor: true, staff: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ users });
});

router.get('/reports/appointments', async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from ? new Date(String(from)) : new Date(Date.now() - 30 * 86400000);
  const toDate = to ? new Date(String(to)) : new Date();

  const appointments = await prisma.appointment.groupBy({
    by: ['status'],
    where: { date: { gte: fromDate, lte: toDate } },
    _count: true,
    _sum: { fee: true },
  });

  res.json({ from: fromDate, to: toDate, appointments });
});

router.get('/settings', async (_req, res) => {
  const settings = await prisma.systemSetting.findMany();
  res.json({ settings });
});

router.patch('/settings/:key', async (req, res) => {
  const setting = await prisma.systemSetting.upsert({
    where: { key: req.params.key },
    create: { key: req.params.key, value: req.body.value },
    update: { value: req.body.value },
  });
  res.json({ setting });
});

export default router;
