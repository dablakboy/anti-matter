import * as FileSystem from 'expo-file-system';

/**
 * Clears the app cache directory to free up storage space.
 * Deletes all files and subdirectories in the cache.
 */
export async function clearAppCache(): Promise<{ freedBytes: number }> {
  let freedBytes = 0;

  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return { freedBytes: 0 };

    const contents = await FileSystem.readDirectoryAsync(cacheDir);

    for (const item of contents) {
      const path = `${cacheDir}${item}`;
      const info = await FileSystem.getInfoAsync(path, { size: true });
      if (info.exists) {
        if (!info.isDirectory && typeof info.size === 'number') {
          freedBytes += info.size;
        }
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
    }

    return { freedBytes };
  } catch {
    return { freedBytes: 0 };
  }
}
