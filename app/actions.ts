'use server';
import { requireRole, requireUser } from '@/lib/auth';
import { addInternalNote, createInvoice, createQuote, refreshAiSummary, transitionTicketStatus } from '@/lib/server/ticket-service';
import { sendClientEmail, syncInbox } from '@/lib/server/gmail';
import { revalidatePath } from 'next/cache';

export async function addInternalNoteAction(formData: FormData) {
  const user = await requireUser();
  const ticketId = String(formData.get('ticketId'));
  const noteText = String(formData.get('noteText'));
  await addInternalNote(ticketId, user.id, noteText, 'ops');
  revalidatePath(`/tickets/${ticketId}`);
}

export async function transitionStatusAction(formData: FormData) {
  const user = await requireRole(['owner', 'dispatch', 'admin']);
  const ticketId = String(formData.get('ticketId'));
  const toStatus = String(formData.get('toStatus')) as any;
  const reason = String(formData.get('reason') || 'Manual transition');
  await transitionTicketStatus(ticketId, toStatus, user.id, reason);
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath('/');
}

export async function sendReplyAction(formData: FormData) {
  const user = await requireRole(['owner', 'dispatch', 'admin']);
  const ticketId = String(formData.get('ticketId'));
  const body = String(formData.get('body'));
  await sendClientEmail({ ticketId, body, userEmail: user.email });
  revalidatePath(`/tickets/${ticketId}`);
}

export async function createQuoteAction(formData: FormData) {
  const user = await requireRole(['owner', 'dispatch', 'admin']);
  const ticketId = String(formData.get('ticketId'));
  const scopeSummary = String(formData.get('scopeSummary'));
  const costAmount = Number(formData.get('costAmount'));
  const sellAmount = Number(formData.get('sellAmount'));
  await createQuote(ticketId, user.id, scopeSummary, costAmount, sellAmount);
  revalidatePath(`/tickets/${ticketId}`);
}

export async function createInvoiceAction(formData: FormData) {
  await requireRole(['owner', 'ledger', 'admin']);
  const ticketId = String(formData.get('ticketId'));
  const clientAmount = Number(formData.get('clientAmount'));
  const contractorCost = Number(formData.get('contractorCost'));
  await createInvoice(ticketId, clientAmount, contractorCost);
  revalidatePath(`/tickets/${ticketId}`);
}

export async function refreshAiSummaryAction(formData: FormData) {
  await requireRole(['owner', 'dispatch', 'admin', 'ledger']);
  const ticketId = String(formData.get('ticketId'));
  await refreshAiSummary(ticketId);
  revalidatePath(`/tickets/${ticketId}`);
}

export async function syncInboxAction() {
  await requireRole(['owner', 'dispatch', 'admin']);
  await syncInbox({ maxResults: 10 });
  revalidatePath('/');
}
