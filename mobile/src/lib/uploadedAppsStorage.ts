import AsyncStorage from '@react-native-async-storage/async-storage';

const UPLOADED_APPS_KEY = '@antimatter_uploaded_apps';
const MAX_ENTRIES = 200;

export interface UploadedAppCacheEntry {
  id: string;
  name: string;
  developerName: string;
  icon?: string;
  version: string;
  status?: string;
  createdAt?: string;
  cachedAt: string;
}

export async function getCachedUploadedApps(): Promise<UploadedAppCacheEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(UPLOADED_APPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UploadedAppCacheEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setCachedUploadedApps(apps: UploadedAppCacheEntry[]): Promise<void> {
  const trimmed = apps.slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(UPLOADED_APPS_KEY, JSON.stringify(trimmed));
}

export async function addUploadedAppToCache(app: {
  id: string;
  name: string;
  developerName: string;
  icon?: string;
  version?: string;
  status?: string;
  createdAt?: string;
}): Promise<void> {
  const cached = await getCachedUploadedApps();
  const entry: UploadedAppCacheEntry = {
    id: app.id,
    name: app.name,
    developerName: app.developerName,
    icon: app.icon,
    version: app.version ?? '',
    status: app.status,
    createdAt: app.createdAt,
    cachedAt: new Date().toISOString(),
  };
  const filtered = cached.filter((e) => e.id !== app.id);
  await setCachedUploadedApps([entry, ...filtered]);
}
