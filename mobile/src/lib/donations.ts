import { Linking } from 'react-native';

/**
 * Patreon donation configuration.
 * Set EXPO_PUBLIC_PATREON_URL in .env to your Patreon page (e.g. https://www.patreon.com/antimatter)
 */
export const PATREON_URL =
  process.env.EXPO_PUBLIC_PATREON_URL ?? 'https://www.patreon.com/antimatter';

/** Patreon join page - includes "Make a custom pledge" option for custom amounts */
export function getPatreonJoinUrl(): string {
  const match = PATREON_URL.match(/^(https:\/\/[^/]+)\/([^/]+)\/?$/);
  if (match) return `${match[1]}/join/${match[2]}`;
  return PATREON_URL;
}

/** Open Patreon in browser - use for Support Anti-Matter and donation tiers */
export function openPatreon(path?: string): void {
  Linking.openURL(path ?? PATREON_URL);
}
