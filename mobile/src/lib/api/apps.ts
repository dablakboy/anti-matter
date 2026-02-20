import { fetch } from 'expo/fetch';
import type { IPAApp } from '@/types/app';

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

export async function fetchApps(status?: string): Promise<IPAApp[]> {
  const url = status
    ? `${baseUrl}/api/apps?status=${encodeURIComponent(status)}&limit=100`
    : `${baseUrl}/api/apps?limit=100`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? 'Failed to fetch apps');
  return (json.data ?? []) as IPAApp[];
}

export async function fetchUploadedApps(deviceId: string): Promise<IPAApp[]> {
  const url = `${baseUrl}/api/apps?deviceId=${encodeURIComponent(deviceId)}&limit=100`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? 'Failed to fetch uploaded apps');
  return (json.data ?? []) as IPAApp[];
}

export async function fetchApp(
  id: string,
  deviceId?: string
): Promise<(IPAApp & { canDelete?: boolean }) | null> {
  const url = deviceId
    ? `${baseUrl}/api/apps/${encodeURIComponent(id)}?deviceId=${encodeURIComponent(deviceId)}`
    : `${baseUrl}/api/apps/${encodeURIComponent(id)}`;
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok) return null;
  return (json.data ?? null) as (IPAApp & { canDelete?: boolean }) | null;
}

export async function deleteApp(id: string, deviceId: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/apps/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? 'Failed to delete app');
}
