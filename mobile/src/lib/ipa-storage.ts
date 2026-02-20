import { fetch } from 'expo/fetch';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

/** Max IPA size: 2GB */
const MAX_IPA_BYTES = 2 * 1024 * 1024 * 1024;

/** Upload timeout: 25 min (large files on slow connections) */
const UPLOAD_TIMEOUT_MS = 25 * 60 * 1000;

export interface IpaUploadResult {
  path: string;
  fullPath: string;
  signedUrl?: string;
  expiresIn?: string;
}

export interface IpaDownloadResult {
  signedUrl: string;
  expiresIn: string;
}

export async function uploadIpaFile(
  uri: string,
  filename: string
): Promise<IpaUploadResult> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  const size = (info as { size?: number }).size;
  if (typeof size === 'number' && size > MAX_IPA_BYTES) {
    throw new Error('File too large. Maximum size is 2GB.');
  }

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    throw new Error(
      'Failed to read file. You may have low storage space or the file may be corrupted.'
    );
  }

  const name = filename.endsWith('.ipa') ? filename : `${filename}.ipa`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/ipa-storage/upload-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ file: base64, filename: name }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? json.details ?? 'Upload failed');
    }

    return json.data;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Upload timed out. Try again on a faster connection.');
      }
      if (err.message.includes('Network request failed') || err.message.includes('Failed to fetch')) {
        throw new Error('Network error. Check your connection and try again.');
      }
      throw err;
    }
    throw new Error('Upload failed. Please try again.');
  }
}

export async function getDownloadUrl(path: string): Promise<IpaDownloadResult> {
  const response = await fetch(`${baseUrl}/api/ipa-storage/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? json.details ?? 'Failed to get download link');
  }

  return json.data;
}

export interface DownloadIpaOptions {
  ipaUrl: string;
  ipaPath?: string;
  appName: string;
}

/**
 * Downloads an IPA file to the device and opens the share sheet
 * so the user can save to Files, AirDrop, etc.
 */
export async function downloadIpaToDevice(options: DownloadIpaOptions): Promise<void> {
  const { ipaUrl, ipaPath, appName } = options;

  let downloadUrl: string;

  if (ipaPath) {
    const { signedUrl } = await getDownloadUrl(ipaPath);
    downloadUrl = signedUrl;
  } else if (ipaUrl?.startsWith('https://') || ipaUrl?.startsWith('http://')) {
    downloadUrl = ipaUrl;
  } else {
    throw new Error('No valid download URL or storage path');
  }

  const safeName = appName.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);
  const filename = `${safeName}.ipa`;
  const destUri = `${FileSystem.cacheDirectory}${filename}`;

  const { uri } = await FileSystem.downloadAsync(downloadUrl, destUri);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: `Save ${appName}`,
  });
}
