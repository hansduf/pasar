import path from 'path';
import fs from 'fs';

// Read .env.local manually if running in standalone Node.js script environment
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  directUrl: string;
}

/**
 * Uploads a file buffer directly to Google Drive via Google Apps Script Web App Bridge.
 * Bypasses Service Account 0GB quota limitations safely with Secret Key protection.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  const scriptUrl =
    process.env.GOOGLE_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbz-jyHMK0iI-AV2WaYGdsyDTUZT9LHhZPAlWU-IeCXpgu5OZvRNNnIxFRnIl3guDQg/exec';
  const secretKey = process.env.GOOGLE_SCRIPT_SECRET_KEY || 'PASAR_POS_SECRET_KEY_987654321_SECURE';

  const base64 = fileBuffer.toString('base64');

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64,
      fileName,
      mimeType,
      secretKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Google Apps Script Error: ${data.error || 'Gagal mengunggah file'}`);
  }

  return {
    fileId: data.fileId,
    fileName,
    webViewLink: data.webViewLink,
    directUrl: data.url,
  };
}
