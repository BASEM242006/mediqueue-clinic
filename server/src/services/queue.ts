import { AppointmentStatus, QueueStatus } from '@prisma/client';
import type { Server as SocketServer } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import { notifyQueueAlert, notifyUser } from './notifications.js';

export function queueRoom(doctorId: string, branchId: string) {
  return `queue:${doctorId}:${branchId}`;
}

export async function getQueueState(doctorId: string, branchId: string, date?: Date) {
  const day = date ?? new Date();
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const entries = await prisma.queueEntry.findMany({
    where: {
      doctorId,
      branchId,
      appointment: {
        date: { gte: day, lt: nextDay },
        status: {
          in: [
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.CONFIRMED,
          ],
        },
      },
    },
    include: {
      appointment: {
        include: {
          patient: { include: { user: { select: { id: true, name: true, phone: true } } } },
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  const avgMin = doctor?.avgDurationMin ?? 15;

  const current = entries.find(
    (e) => e.status === QueueStatus.IN_PROGRESS || e.status === QueueStatus.CALLED
  );
  const waiting = entries.filter((e) => e.status === QueueStatus.WAITING);

  return {
    doctorId,
    branchId,
    currentPatient: current
      ? {
          queueNumber: current.appointment.queueNumber,
          position: current.position,
          patientName: current.appointment.patient.user.name,
          status: current.status,
        }
      : null,
    waitingCount: waiting.length,
    entries: entries.map((e) => ({
      id: e.id,
      position: e.position,
      queueNumber: e.appointment.queueNumber,
      status: e.status,
      estimatedWaitMin: e.estimatedWaitMin,
      patientName: e.appointment.patient.user.name,
      appointmentId: e.appointmentId,
    })),
    avgDurationMin: avgMin,
  };
}

export async function recalculateWaitTimes(doctorId: string, branchId: string) {
  const state = await getQueueState(doctorId, branchId);
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  const avg = doctor?.avgDurationMin ?? 15;

  let positionOffset = 0;
  const currentIdx = state.entries.findIndex(
    (e) => e.status === QueueStatus.IN_PROGRESS || e.status === QueueStatus.CALLED
  );
  if (currentIdx >= 0) positionOffset = currentIdx + 1;

  for (let i = 0; i < state.entries.length; i++) {
    const entry = state.entries[i];
    if (entry.status === QueueStatus.COMPLETED || entry.status === QueueStatus.SKIPPED) continue;

    const ahead = Math.max(0, i - positionOffset);
    const estimatedWaitMin = ahead * avg;

    await prisma.queueEntry.update({
      where: { id: entry.id },
      data: { estimatedWaitMin },
    });

    const appointment = await prisma.appointment.findUnique({
      where: { id: entry.appointmentId },
      include: { patient: { include: { user: true } } },
    });

    if (appointment && ahead <= 2 && ahead > 0) {
      await notifyQueueAlert(
        appointment.patient.user.id,
        appointment.id,
        ahead,
        appointment.patient.user.locale
      );
    }
  }

  return getQueueState(doctorId, branchId);
}

export async function broadcastQueue(io: SocketServer, doctorId: string, branchId: string) {
  const state = await recalculateWaitTimes(doctorId, branchId);
  io.to(queueRoom(doctorId, branchId)).emit('queue:update', state);
  return state;
}

export async function assignQueueNumber(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { queueEntry: true },
  });
  if (!appointment) throw new Error('Appointment not found');
  if (appointment.queueEntry) return appointment.queueEntry;

  const day = new Date(appointment.date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const maxQueue = await prisma.appointment.aggregate({
    where: {
      doctorId: appointment.doctorId,
      branchId: appointment.branchId,
      date: { gte: day, lt: nextDay },
      queueNumber: { not: null },
    },
    _max: { queueNumber: true },
  });

  const queueNumber = (maxQueue._max.queueNumber ?? 0) + 1;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      queueNumber,
      status: AppointmentStatus.CHECKED_IN,
    },
  });

  const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
  const avg = doctor?.avgDurationMin ?? 15;

  const waitingCount = await prisma.queueEntry.count({
    where: {
      doctorId: appointment.doctorId,
      branchId: appointment.branchId,
      status: QueueStatus.WAITING,
      appointment: { date: { gte: day, lt: nextDay } },
    },
  });

  const entry = await prisma.queueEntry.create({
    data: {
      appointmentId,
      doctorId: appointment.doctorId,
      branchId: appointment.branchId,
      position: queueNumber,
      status: QueueStatus.WAITING,
      estimatedWaitMin: waitingCount * avg,
    },
  });

  return { appointment: updated, queueEntry: entry };
}

export async function callNextPatient(
  io: SocketServer,
  doctorId: string,
  branchId: string
) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  await prisma.queueEntry.updateMany({
    where: {
      doctorId,
      branchId,
      status: QueueStatus.CALLED,
      appointment: { date: { gte: day, lt: nextDay } },
    },
    data: { status: QueueStatus.WAITING },
  });

  const next = await prisma.queueEntry.findFirst({
    where: {
      doctorId,
      branchId,
      status: QueueStatus.WAITING,
      appointment: { date: { gte: day, lt: nextDay } },
    },
    orderBy: { position: 'asc' },
    include: {
      appointment: { include: { patient: { include: { user: true } } } },
    },
  });

  if (!next) return null;

  await prisma.queueEntry.update({
    where: { id: next.id },
    data: { status: QueueStatus.CALLED, calledAt: new Date() },
  });

  await prisma.appointment.update({
    where: { id: next.appointmentId },
    data: { status: AppointmentStatus.IN_PROGRESS },
  });

  await notifyUser({
    userId: next.appointment.patient.user.id,
    appointmentId: next.appointmentId,
    title: 'Your turn is now!',
    titleAr: 'حان دورك الآن!',
    body: `Queue #${next.appointment.queueNumber} — please proceed to the doctor's room.`,
    bodyAr: `رقم الطابور ${next.appointment.queueNumber} — يرجى التوجه لغرفة الطبيب.`,
  });

  await broadcastQueue(io, doctorId, branchId);
  return next;
}

export async function completeCurrentAppointment(
  io: SocketServer,
  doctorId: string,
  branchId: string,
  appointmentId: string
) {
  await prisma.queueEntry.updateMany({
    where: { appointmentId },
    data: { status: QueueStatus.COMPLETED, completedAt: new Date() },
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.COMPLETED },
  });

  return broadcastQueue(io, doctorId, branchId);
}
