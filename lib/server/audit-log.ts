import fs from 'fs/promises';
import path from 'path';

export async function appendAuditLog(event: Record<string, unknown>) {
  const dir = path.resolve(process.cwd(), 'logs');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'outbound-audit.jsonl');
  await fs.appendFile(file, JSON.stringify({ ts: new Date().toISOString(), ...event }) + '\\n');
}
