import { NextResponse } from 'next/server';
import { runSlaEscalationSweep } from '@/lib/server/ticket-service';

export async function POST() {
  const escalations = await runSlaEscalationSweep();
  return NextResponse.json({ ok: true, escalations });
}
