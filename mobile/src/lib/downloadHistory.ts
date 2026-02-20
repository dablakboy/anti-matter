import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_HISTORY_KEY = '@antimatter_download_history';
const MAX_ENTRIES = 100;

export interface DownloadHistoryEntry {
  appId: string;
  appName: string;
  ipaUrl: string;
  ipaPath?: string;
  downloadedAt: string;
}

export async function getDownloadHistory(): Promise<DownloadHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOAD_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DownloadHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addDownloadToHistory(entry: Omit<DownloadHistoryEntry, 'downloadedAt'>): Promise<void> {
  const history = await getDownloadHistory();
  const newEntry: DownloadHistoryEntry = { ...entry, downloadedAt: new Date().toISOString() };
  const filtered = history.filter((e) => e.appId !== entry.appId);
  const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(updated));
}
