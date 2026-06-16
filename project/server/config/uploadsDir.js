import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

function resolveUploadsDir() {
  const configured = String(process.env.UPLOAD_DIR || '').trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.resolve(PROJECT_ROOT, 'uploads');
}

export const UPLOADS_DIR = resolveUploadsDir();

export const CSV_TEMP_DIR = path.join(UPLOADS_DIR, 'csv-temp');

export function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(CSV_TEMP_DIR, { recursive: true });
  return UPLOADS_DIR;
}
