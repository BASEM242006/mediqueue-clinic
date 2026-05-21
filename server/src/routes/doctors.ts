import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, attachDoctor, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', async (req, res) => {
  const { specialty, clinicId, branchId, search } = req.query;

  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(specialty ? { specialty: { slug: String(specialty) } } : {}),
      ...(clinicId ? { clinicId: String(clinicId) } : {}),
      ...(branchId ? { branchId: String(branchId) } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: String(search), mode: 'insensitive' } } },
              { user: { nameAr: { contains: String(search), mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, nameAr: true, phone: true, avatarUrl: true } },
      specialty: true,
      clinic: true,
      branch: true,
      schedules: { where: { isActive: true } },
    },
    orderBy: { rating: 'desc' },
  });

  res.json({ doctors });
});

router.get('/specialties', async (_req, res) => {
  const specialties = await prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ specialties });
});

router.get('/:id', async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, nameAr: true, phone: true, avatarUrl: true } },
      specialty: true,
      clinic: true,
      branch: true,
      schedules: { where: { isActive: true } },
      vacations: {
        where: { endDate: { gte: new Date() } },
      },
    },
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json({ doctor });
});

router.get('/:id/slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query required (YYYY-MM-DD)' });

  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: { schedules: true, vacations: true },
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const targetDate = new Date(String(date));
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[targetDate.getDay()] as typeof doctor.schedules[0]['dayOfWeek'];

  const onVacation = doctor.vacations.some(
    (v) => targetDate >= v.startDate && targetDate <= v.endDate
  );
  if (onVacation) return res.json({ slots: [], message: 'Doctor on vacation' });

  const schedule = doctor.schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);
  if (!schedule) return res.json({ slots: [] });

  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      date: { gte: dayStart, lt: dayEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { startTime: true, endTime: true },
  });

  const slots = generateSlots(schedule.startTime, schedule.endTime, schedule.slotDuration, booked);
  res.json({ slots, fee: doctor.consultationFee, slotDuration: schedule.slotDuration });
});

function generateSlots(
  start: string,
  end: string,
  duration: number,
  booked: { startTime: string; endTime: string }[]
) {
  const slots: { startTime: string; endTime: string; available: boolean }[] = [];
  let current = toMinutes(start);
  const endMin = toMinutes(end);

  while (current + duration <= endMin) {
    const slotStart = fromMinutes(current);
    const slotEnd = fromMinutes(current + duration);
    const taken = booked.some((b) => b.startTime === slotStart);
    slots.push({ startTime: slotStart, endTime: slotEnd, available: !taken });
    current += duration;
  }
  return slots;
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

router.patch(
  '/me/schedule',
  authenticate,
  requireRoles(UserRole.DOCTOR),
  attachDoctor,
  async (req: AuthRequest & { doctorId: string }, res) => {
    const { schedules, vacations } = req.body;

    if (schedules?.length) {
      for (const s of schedules) {
        await prisma.doctorSchedule.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId: req.doctorId,
              dayOfWeek: s.dayOfWeek,
            },
          },
          create: {
            doctorId: req.doctorId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration ?? 30,
          },
          update: {
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration,
            isActive: s.isActive ?? true,
          },
        });
      }
    }

    if (vacations?.length) {
      for (const v of vacations) {
        await prisma.doctorVacation.create({
          data: {
            doctorId: req.doctorId,
            startDate: new Date(v.startDate),
            endDate: new Date(v.endDate),
            reason: v.reason,
          },
        });
      }
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.doctorId },
      include: { schedules: true, vacations: true },
    });
    res.json({ doctor });
  }
);

export default router;
