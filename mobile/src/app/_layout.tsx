import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as AppThemeProvider } from '@/lib/ThemeContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="download-options"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 0.75, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <RootLayoutContent />
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

function useNotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    function handleNotificationResponse(
      notification: Notifications.Notification
    ) {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (!data) return;
      const appId = data.appId as string | undefined;
      if (typeof appId === 'string' && appId) {
        router.push(`/app/${appId}` as const);
        return;
      }
      const url = data.url as string | undefined;
      if (typeof url === 'string' && url.startsWith('/')) {
        router.push(url as Parameters<typeof router.push>[0]);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        handleNotificationResponse(response.notification);
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener(
      (event) => handleNotificationResponse(event.notification)
    );
    return () => sub.remove();
  }, []);
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  useNotificationObserver();
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <RootLayoutNav colorScheme={colorScheme} />
    </>
  );
}