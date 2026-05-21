import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, getPatientId, UserRole } from '@/lib/clinic/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { doctorId, branchId, date, startTime, endTime, notes } = body;

  let patientId: string;
  if (auth.role === UserRole.PATIENT) {
    const pid = await getPatientId(auth.userId);
    if (!pid) return NextResponse.json({ error: 'Patient profile required' }, { status: 404 });
    patientId = pid;
  } else {
    patientId = body.patientId;
    if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 });
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      branchId: branchId ?? doctor.branchId,
      date: new Date(date),
      startTime,
      endTime,
      fee: doctor.consultationFee,
      notes,
      status: AppointmentStatus.CONFIRMED,
      type: auth.role === UserRole.PATIENT ? AppointmentType.ONLINE : AppointmentType.MANUAL,
    },
    include: {
      doctor: { include: { user: true, specialty: true } },
      branch: true,
      patient: { include: { user: true } },
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
