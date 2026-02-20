import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'antimatter_device_id';

/**
 * Returns a stable device identifier for paywall/upload tracking.
 * iOS: idForVendor (resets if all apps from vendor are uninstalled)
 * Android: androidId
 * Fallback: stored UUID in AsyncStorage
 */
export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      if (id) return `ios_${id}`;
    }
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId?.();
      if (id) return `android_${id}`;
    }
  } catch {
    // ignore
  }
  // Fallback: generate and persist a UUID for simulator/web
  let stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!stored) {
    stored = `fallback_${Crypto.randomUUID()}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, stored);
  }
  return stored;
}
