import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@antimatter_notifications_enabled';
const PUSH_TOKEN_KEY = '@antimatter_push_token';

/** Configure notification handler (foreground behavior) - native only */
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Check if notifications are enabled (persisted preference) */
export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return v === 'true';
  } catch {
    return false;
  }
}

/** Persist notification preference */
export async function setNotificationsEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, value.toString());
}

/** Request permissions and get Expo push token. Returns null if denied or error. */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }

  if (status !== 'granted') return null;

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  });
  return tokenData?.data ?? null;
}

/** Store push token locally (for unregister) */
export async function setStoredPushToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  else await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

/** Get stored push token */
export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

/** Register the push token with the backend (call when notifications enabled) */
export async function registerPushTokenWithBackend(token: string): Promise<void> {
  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!baseUrl) return;

  const response = await fetch(`${baseUrl}/api/push/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, enabled: true }),
  });
  if (!response.ok) {
    throw new Error('Failed to register for push notifications');
  }
}

/** Unregister from push (call when notifications disabled) */
export async function unregisterPushToken(token: string): Promise<void> {
  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!baseUrl) return;

  await fetch(`${baseUrl}/api/push/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, enabled: false }),
  });
}
