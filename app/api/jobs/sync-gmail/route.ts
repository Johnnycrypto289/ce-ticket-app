import { NextResponse } from 'next/server';
import { syncInbox } from '@/lib/server/gmail';

export async function POST() {
  const result = await syncInbox({ maxResults: 10 });
  return NextResponse.json({ ok: true, result });
}
