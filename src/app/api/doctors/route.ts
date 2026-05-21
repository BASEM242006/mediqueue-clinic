import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const specialty = searchParams.get('specialty');
  const search = searchParams.get('search');

  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(specialty ? { specialty: { slug: specialty } } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: search } } },
              { user: { nameAr: { contains: search } } },
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

  return NextResponse.json({ doctors });
}
