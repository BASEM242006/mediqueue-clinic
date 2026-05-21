import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getPatientId } from '@/lib/clinic/auth';

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patientId = await getPatientId(auth.userId);
  if (!patientId) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: {
      doctor: { include: { user: true, specialty: true } },
      branch: { include: { clinic: true } },
      queueEntry: true,
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });

  return NextResponse.json({ appointments });
}
