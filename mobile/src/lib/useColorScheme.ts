import { useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { ThemeContext } from './ThemeContext';

/** Returns the resolved color scheme (light/dark) - respects user preference when set via ThemeProvider */
export function useColorScheme(): 'light' | 'dark' | null | undefined {
  const ctx = useContext(ThemeContext);
  const system = useSystemColorScheme();
  if (ctx) return ctx.resolvedScheme;
  return system;
}
