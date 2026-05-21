import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/clinic/otp';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.phone) {
    return NextResponse.json({ error: 'phone required' }, { status: 400 });
  }
  const result = await sendOtp(body.phone);
  return NextResponse.json(result);
}
