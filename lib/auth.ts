import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/server/prisma';

export type AppRole = 'owner' | 'dispatch' | 'ledger' | 'admin' | 'read_only';

const COOKIE_NAME = 'ce_ticket_session';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const email = cookieStore.get(COOKIE_NAME)?.value;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: AppRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as AppRole)) {
    redirect('/unauthorized');
  }
  return user;
}

export async function setSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function hashSecret(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
