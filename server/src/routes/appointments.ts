import { Router } from 'express';
import { AppointmentStatus, AppointmentType, UserRole } from '@prisma/client';
import { z } from 'zod';
import type { Server as SocketServer } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import {
  authenticate,
  attachDoctor,
  attachPatient,
  requireRoles,
  type AuthRequest,
} from '../middleware/auth.js';
import { assignQueueNumber, broadcastQueue } from '../services/queue.js';
import { notifyUser } from '../services/notifications.js';

export function createAppointmentRoutes(io: SocketServer) {
  const router = Router();

  const bookSchema = z.object({
    doctorId: z.string(),
    branchId: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    notes: z.string().optional(),
  });

  router.post(
    '/',
    authenticate,
    requireRoles(UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    async (req: AuthRequest, res) => {
      const parsed = bookSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      let patientId: string;
      if (req.user!.role === UserRole.PATIENT) {
        const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
        if (!patient) return res.status(404).json({ error: 'Patient profile required' });
        patientId = patient.id;
      } else {
        patientId = req.body.patientId;
        if (!patientId) return res.status(400).json({ error: 'patientId required for staff booking' });
      }

      const doctor = await prisma.doctor.findUnique({ where: { id: parsed.data.doctorId } });
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

      const type =
        req.user!.role === UserRole.PATIENT
          ? AppointmentType.ONLINE
          : req.body.type === 'WALK_IN'
            ? AppointmentType.WALK_IN
            : AppointmentType.MANUAL;

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: parsed.data.doctorId,
          branchId: parsed.data.branchId,
          date: new Date(parsed.data.date),
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          fee: doctor.consultationFee,
          notes: parsed.data.notes,
          status: AppointmentStatus.CONFIRMED,
          type,
        },
        include: {
          doctor: { include: { user: true, specialty: true } },
          branch: true,
          patient: { include: { user: true } },
        },
      });

      const patientUser = appointment.patient.user;
      await notifyUser({
        userId: patientUser.id,
        appointmentId: appointment.id,
        title: 'Appointment Confirmed',
        titleAr: 'تم تأكيد الموعد',
        body: `Your appointment with ${appointment.doctor.user.name} on ${parsed.data.date} at ${parsed.data.startTime} is confirmed.`,
        bodyAr: `تم تأكيد موعدك مع ${appointment.doctor.user.nameAr ?? appointment.doctor.user.name}`,
      });

      res.status(201).json({ appointment });
    }
  );

  router.get('/my', authenticate, attachPatient, async (req: AuthRequest & { patientId: string }, res) => {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.patientId },
      include: {
        doctor: { include: { user: true, specialty: true } },
        branch: { include: { clinic: true } },
        queueEntry: true,
        prescription: true,
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
    res.json({ appointments });
  });

  router.get(
    '/doctor/today',
    authenticate,
    requireRoles(UserRole.DOCTOR),
    attachDoctor,
    async (req: AuthRequest & { doctorId: string }, res) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: req.doctorId,
          date: { gte: today, lt: tomorrow },
        },
        include: {
          patient: { include: { user: true } },
          queueEntry: true,
          prescription: true,
        },
        orderBy: [{ queueNumber: 'asc' }, { startTime: 'asc' }],
      });

      const stats = {
        total: appointments.length,
        completed: appointments.filter((a) => a.status === 'COMPLETED').length,
        waiting: appointments.filter((a) => ['CHECKED_IN', 'CONFIRMED'].includes(a.status)).length,
        cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
      };

      res.json({ appointments, stats });
    }
  );

  router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: { include: { user: true, specialty: true, clinic: true, branch: true } },
        patient: { include: { user: true, medicalFiles: true } },
        branch: { include: { clinic: true } },
        queueEntry: true,
        prescription: true,
      },
    });
    if (!appointment) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
      if (patient?.id !== appointment.patientId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json({ appointment });
  });

  router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true },
    });
    if (!appointment) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
      if (patient?.id !== appointment.patientId) return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: req.body.reason,
      },
    });

    if (appointment.queueEntry) {
      await broadcastQueue(io, appointment.doctorId, appointment.branchId);
    }

    res.json({ appointment: updated });
  });

  router.patch('/:id/reschedule', authenticate, async (req: AuthRequest, res) => {
    const { date, startTime, endTime } = req.body;
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: { include: { user: true } } },
    });
    if (!appointment) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
      if (patient?.id !== appointment.patientId) return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        status: AppointmentStatus.RESCHEDULED,
      },
    });

    await notifyUser({
      userId: appointment.patient.user.id,
      appointmentId: updated.id,
      title: 'Appointment Rescheduled',
      titleAr: 'تم إعادة جدولة الموعد',
      body: `New time: ${date} ${startTime}`,
      bodyAr: `الوقت الجديد: ${date} ${startTime}`,
    });

    res.json({ appointment: updated });
  });

  router.post(
    '/:id/check-in',
    authenticate,
    requireRoles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PATIENT),
    async (req, res) => {
      const result = await assignQueueNumber(req.params.id);
      const state = await broadcastQueue(
        io,
        result.appointment.doctorId,
        result.appointment.branchId
      );
      res.json({ ...result, queueState: state });
    }
  );

  router.post(
    '/:id/prescription',
    authenticate,
    requireRoles(UserRole.DOCTOR),
    attachDoctor,
    async (req: AuthRequest & { doctorId: string }, res) => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: req.params.id },
      });
      if (!appointment || appointment.doctorId !== req.doctorId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const prescription = await prisma.prescription.upsert({
        where: { appointmentId: req.params.id },
        create: {
          appointmentId: req.params.id,
          doctorId: req.doctorId,
          patientId: appointment.patientId,
          diagnosis: req.body.diagnosis,
          medications: req.body.medications,
          notes: req.body.notes,
        },
        update: {
          diagnosis: req.body.diagnosis,
          medications: req.body.medications,
          notes: req.body.notes,
        },
      });

      res.json({ prescription });
    }
  );

  return router;
}
