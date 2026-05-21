import { Router } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { UserRole } from '@prisma/client';
import { authenticate, attachDoctor, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import {
  broadcastQueue,
  callNextPatient,
  completeCurrentAppointment,
  getQueueState,
  queueRoom,
} from '../services/queue.js';

export function createQueueRoutes(io: SocketServer) {
  const router = Router();

  router.get('/:doctorId/:branchId', async (req, res) => {
    const state = await getQueueState(req.params.doctorId, req.params.branchId);
    res.json(state);
  });

  router.get('/appointment/:appointmentId/track', async (req, res) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.appointmentId },
      include: {
        queueEntry: true,
        doctor: { include: { user: true, specialty: true } },
        branch: { include: { clinic: true } },
      },
    });
    if (!appointment) return res.status(404).json({ error: 'Not found' });

    const state = await getQueueState(appointment.doctorId, appointment.branchId);
    const myEntry = state.entries.find((e) => e.appointmentId === appointment.id);
    const currentNum = state.currentPatient?.queueNumber ?? 0;
    const myNum = appointment.queueNumber ?? 0;
    const patientsAhead = myEntry
      ? Math.max(0, state.entries.filter((e) => e.status === 'WAITING' && e.position < (myEntry?.position ?? 0)).length)
      : 0;

    res.json({
      appointment,
      queueEntry: appointment.queueEntry,
      currentPatientNumber: currentNum,
      yourNumber: myNum,
      patientsAhead,
      estimatedWaitMin: appointment.queueEntry?.estimatedWaitMin ?? 0,
      waitingCount: state.waitingCount,
      queue: state,
    });
  });

  router.post(
    '/:doctorId/:branchId/call-next',
    authenticate,
    requireRoles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    async (req, res) => {
      const next = await callNextPatient(io, req.params.doctorId, req.params.branchId);
      if (!next) return res.json({ message: 'No patients waiting' });
      res.json({ next });
    }
  );

  router.post(
    '/:doctorId/:branchId/complete/:appointmentId',
    authenticate,
    requireRoles(UserRole.DOCTOR, UserRole.RECEPTIONIST),
    async (req, res) => {
      const state = await completeCurrentAppointment(
        io,
        req.params.doctorId,
        req.params.branchId,
        req.params.appointmentId
      );
      res.json({ queueState: state });
    }
  );

  router.post(
    '/:doctorId/:branchId/refresh',
    authenticate,
    requireRoles(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    async (req, res) => {
      const state = await broadcastQueue(io, req.params.doctorId, req.params.branchId);
      res.json(state);
    }
  );

  router.get(
    '/doctor/me',
    authenticate,
    requireRoles(UserRole.DOCTOR),
    attachDoctor,
    async (req: AuthRequest & { doctorId: string }, res) => {
      const doctor = await prisma.doctor.findUnique({
        where: { id: req.doctorId },
      });
      const state = await getQueueState(req.doctorId, doctor!.branchId);
      res.json(state);
    }
  );

  return router;
}

export function registerQueueSockets(io: SocketServer) {
  io.on('connection', (socket) => {
    socket.on('queue:join', ({ doctorId, branchId, appointmentId }) => {
      if (doctorId && branchId) {
        socket.join(queueRoom(doctorId, branchId));
      }
      if (appointmentId) {
        socket.join(`appointment:${appointmentId}`);
      }
    });

    socket.on('queue:leave', ({ doctorId, branchId }) => {
      if (doctorId && branchId) {
        socket.leave(queueRoom(doctorId, branchId));
      }
    });
  });
}
