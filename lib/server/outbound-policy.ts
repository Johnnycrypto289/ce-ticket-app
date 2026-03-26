export const SANITIZED_TEST_EVENT = 'sanitized_test_send';

export function getProtectedDomains() {
  return (process.env.PROTECTED_CLIENT_DOMAINS || 'tccmobile.com,pccwireless.com,pccwrs.com,pccphones.com,jmwireless.com,jmmwireless.com')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function recipientMatchesProtectedClient(recipients: string) {
  const text = recipients.toLowerCase();
  return getProtectedDomains().some((domain) => text.includes(domain));
}

export function sanitizeOutboundPayload(input: {
  toRecipients: string;
  ccRecipients?: string | null;
  subject: string;
  body: string;
  threadId?: string | null;
  attachments?: Array<{ filename: string }>;
}) {
  const testMode = process.env.TEST_MODE === 'true';
  const outboundPolicy = process.env.OUTBOUND_POLICY || 'safe-template';
  const safeTemplate = process.env.SAFE_TEMPLATE_TEXT || "We'll update shortly.";
  const protectedRecipient = recipientMatchesProtectedClient([input.toRecipients, input.ccRecipients || ''].join(','));

  if (testMode && outboundPolicy === 'safe-template' && protectedRecipient) {
    return {
      subject: input.subject,
      body: safeTemplate,
      toRecipients: input.toRecipients,
      ccRecipients: '',
      bccRecipients: '',
      attachments: [],
      threadId: input.threadId || undefined,
      sanitized: true,
      auditTag: SANITIZED_TEST_EVENT,
    };
  }

  return {
    subject: input.subject,
    body: input.body,
    toRecipients: input.toRecipients,
    ccRecipients: input.ccRecipients || '',
    bccRecipients: '',
    attachments: input.attachments || [],
    threadId: input.threadId || undefined,
    sanitized: false,
    auditTag: 'normal_send',
  };
}
