type TicketSummaryResult = { summary: string; recommendation: string; model: string };

export async function summarizeTicket(input: { subject: string; timeline: string; status: string; contractor?: string | null; }) : Promise<TicketSummaryResult> {
  const model = process.env.OPENAI_MODEL || 'gpt-5.4';
  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: `Fallback summary: ${input.subject} (${input.status}).`,
      recommendation: 'Configure OPENAI_API_KEY to enable live GPT summaries.',
      model,
    };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: `Summarize this CE ticket and recommend next action.
Subject: ${input.subject}
Status: ${input.status}
Contractor: ${input.contractor || 'unassigned'}
Timeline:
${input.timeline}`,
      text: { format: { type: 'json_schema', name: 'ticket_summary', schema: {
        type: 'object', additionalProperties: false,
        properties: {
          summary: { type: 'string' },
          recommendation: { type: 'string' }
        },
        required: ['summary', 'recommendation']
      } } }
    }),
  });

  if (!response.ok) {
    return {
      summary: `Fallback summary: ${input.subject} (${input.status}).`,
      recommendation: `OpenAI call failed (${response.status}). Review manually.`,
      model,
    };
  }

  const data = await response.json();
  const text = data.output?.[0]?.content?.[0]?.text || '{}';
  const parsed = JSON.parse(text);
  return { summary: parsed.summary, recommendation: parsed.recommendation, model };
}
