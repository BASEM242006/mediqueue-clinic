import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus, QueueStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      queueEntry: true,
      doctor: { include: { user: true, specialty: true } },
      branch: { include: { clinic: true } },
    },
  });
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const day = new Date(appointment.date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const entries = await prisma.queueEntry.findMany({
    where: {
      doctorId: appointment.doctorId,
      branchId: appointment.branchId,
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
      appointment: { include: { patient: { include: { user: true } } } },
    },
    orderBy: { position: 'asc' },
  });

  const current = entries.find(
    (e) => e.status === QueueStatus.IN_PROGRESS || e.status === QueueStatus.CALLED
  );
  const waiting = entries.filter((e) => e.status === QueueStatus.WAITING);
  const myEntry = entries.find((e) => e.appointmentId === appointmentId);

  const patientsAhead = myEntry
    ? entries.filter((e) => e.status === QueueStatus.WAITING && e.position < myEntry.position).length
    : 0;

  return NextResponse.json({
    appointment,
    queueEntry: appointment.queueEntry,
    currentPatientNumber: current?.appointment.queueNumber ?? 0,
    yourNumber: appointment.queueNumber ?? 0,
    patientsAhead,
    estimatedWaitMin: appointment.queueEntry?.estimatedWaitMin ?? 0,
    waitingCount: waiting.length,
    queue: {
      doctorId: appointment.doctorId,
      branchId: appointment.branchId,
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
    },
  });
}
