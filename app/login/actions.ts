'use server';
import { setSession } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email) throw new Error('Email required');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found in seed data');
  await setSession(email);
  redirect('/');
}
