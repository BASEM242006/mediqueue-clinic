import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { schedules: true, vacations: true },
  });
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

  const targetDate = new Date(date);
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = dayNames[targetDate.getDay()];

  const onVacation = doctor.vacations.some(
    (v) => targetDate >= v.startDate && targetDate <= v.endDate
  );
  if (onVacation) return NextResponse.json({ slots: [], message: 'Doctor on vacation' });

  const schedule = doctor.schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);
  if (!schedule) return NextResponse.json({ slots: [] });

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
    select: { startTime: true },
  });

  const slots: { startTime: string; endTime: string; available: boolean }[] = [];
  let current = toMinutes(schedule.startTime);
  const endMin = toMinutes(schedule.endTime);
  const duration = schedule.slotDuration;

  while (current + duration <= endMin) {
    const slotStart = fromMinutes(current);
    const slotEnd = fromMinutes(current + duration);
    slots.push({ startTime: slotStart, endTime: slotEnd, available: !booked.some((b) => b.startTime === slotStart) });
    current += duration;
  }

  return NextResponse.json({ slots, fee: doctor.consultationFee, slotDuration: schedule.slotDuration });
}
