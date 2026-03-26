import fs from 'fs/promises';
import path from 'path';

export function getStorageRoot() {
  return path.resolve(process.cwd(), process.env.FILE_STORAGE_ROOT || './storage');
}

export async function ensureStorageDir(subdir: string) {
  const dir = path.join(getStorageRoot(), subdir);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeBufferFile(subdir: string, filename: string, content: Buffer) {
  const dir = await ensureStorageDir(subdir);
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, content);
  return fullPath;
}
