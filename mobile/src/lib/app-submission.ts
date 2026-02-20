import { fetch } from 'expo/fetch';
import * as FileSystem from 'expo-file-system';

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

export interface UploadAppIconResult {
  path: string;
  fullPath: string;
}

export async function uploadAppIcon(
  uri: string,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<UploadAppIconResult> {
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    throw new Error(
      'Failed to read image. You may have low storage space or the file may be corrupted.'
    );
  }

  const response = await fetch(`${baseUrl}/api/app-assets/upload-base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      file: base64,
      filename: filename || `icon-${Date.now()}.jpg`,
      mimeType,
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error ?? json.details ?? 'Icon upload failed');
  }
  return json.data;
}

export interface SubmitAppPayload {
  name: string;
  description: string;
  developerName: string;
  version: string;
  category: string;
  ipaPath: string;
  device?: 'iphone' | 'ipad' | 'both';
  iconPath?: string;
  socialTwitter?: string;
  socialWebsite?: string;
  appStoreLink?: string;
  deviceId?: string;
}

export interface SubmitAppResult {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export async function submitApp(payload: SubmitAppPayload): Promise<SubmitAppResult> {
  const response = await fetch(`${baseUrl}/api/apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await response.json();
  if (!response.ok) {
    const msg = json.message ?? json.error ?? json.details ?? 'Submit failed';
    const err = new Error(msg) as Error & { code?: string };
    if (response.status === 402) err.code = 'SUBSCRIPTION_REQUIRED';
    throw err;
  }
  return json.data;
}

export interface DeveloperUsage {
  uploadCount: number;
  isSubscribed: boolean;
  freeLimit: number;
  canUpload: boolean;
}

export async function fetchDeveloperUsage(deviceId: string): Promise<DeveloperUsage> {
  const response = await fetch(
    `${baseUrl}/api/developer/usage?deviceId=${encodeURIComponent(deviceId)}`
  );
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? 'Failed to fetch usage');
  return json.data;
}

export async function verifyDeveloperSubscription(
  deviceId: string,
  email: string
): Promise<{ success: boolean; currentPeriodEnd: string }> {
  const response = await fetch(`${baseUrl}/api/developer/verify-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ deviceId, email }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? 'Verification failed');
  return json.data;
}
