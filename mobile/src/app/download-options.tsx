import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApp } from '@/hooks/useApps';
import { getDeviceId } from '@/lib/deviceId';
import { deleteApp } from '@/lib/api/apps';
import { downloadIpaToDevice } from '@/lib/ipa-storage';
import { addDownloadToHistory } from '@/lib/downloadHistory';
import {
  SUPPORT_AMOUNTS_ROW1,
  SUPPORT_AMOUNTS_ROW2,
  STRIPE_PAYMENT_LINKS,
} from '@/lib/support';
import type { IPAApp } from '@/types/app';
import { canDownloadApp, getDownloadCountdown } from '@/lib/canDownload';
import { Download, DollarSign, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function DownloadOptionsScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const { app: appData, isLoading } = useApp(appId ?? undefined, deviceId ?? undefined);
  const app = appData as (IPAApp & { canDelete?: boolean }) | undefined;

  const deleteMutation = useMutation({
    mutationFn: () => deleteApp(app!.id, deviceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['app', appId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err: Error) => Alert.alert('Delete failed', err.message),
  });

  const handleDelete = () => {
    if (!app || !deviceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete App',
      `Remove "${app.name}" from the store? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const downloadMutation = useMutation({
    mutationFn: () =>
      downloadIpaToDevice({
        ipaUrl: app!.ipaUrl,
        ipaPath: app!.ipaPath,
        appName: app!.name,
      }),
    onSuccess: async () => {
      await addDownloadToHistory({
        appId: app!.id,
        appName: app!.name,
        ipaUrl: app!.ipaUrl,
        ipaPath: app!.ipaPath,
      });
      queryClient.invalidateQueries({ queryKey: ['downloadHistory'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Download Failed',
        err.message.includes('fetch') || err.message.includes('Failed')
          ? `${err.message}\n\nMake sure the backend is running and the app has a valid download link.`
          : err.message
      );
    },
  });

  const handleDownloadFree = () => {
    if (!app) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    downloadMutation.mutate();
  };

  const handleSupport = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = STRIPE_PAYMENT_LINKS[amount];
    if (url) Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }
  if (!app) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-white' : 'text-gray-900'}>App not found</Text>
      </View>
    );
  }

  const hasIpa = Boolean(app.ipaPath || (app.ipaUrl?.startsWith('http') ?? false));
  const canDownload = hasIpa && canDownloadApp(app);
  const countdown = getDownloadCountdown(app);

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <Stack.Screen options={{ title: `Download ${app.name}` }} />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Download Free */}
          <Pressable
            onPress={handleDownloadFree}
            disabled={!canDownload || downloadMutation.isPending}
            className="mb-6"
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 18,
                opacity: canDownload && !downloadMutation.isPending ? 1 : 0.6,
              }}
            >
              <View className="flex-row items-center justify-center">
                {downloadMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Download size={22} color="white" />
                )}
                <Text className="text-white font-bold text-lg ml-3">
                  {downloadMutation.isPending
                    ? 'Downloading…'
                    : canDownload
                    ? 'Download Free'
                    : countdown.label || 'Under review'}
                </Text>
              </View>
              <Text className="text-white/80 text-center text-sm mt-2">
                {canDownload
                  ? 'Get the IPA file at no cost'
                  : 'New apps are available for download after a 48-hour review period'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Delete (developer only) */}
          {app.canDelete ? (
            <Pressable
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              className={`mb-6 rounded-2xl p-4 flex-row items-center justify-center ${
                isDark ? 'bg-red-500/20' : 'bg-red-50'
              }`}
              style={{ borderWidth: 1, borderColor: '#EF4444' }}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Trash2 size={20} color="#EF4444" />
              )}
              <Text className="text-red-500 font-semibold ml-2">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete my app'}
              </Text>
            </Pressable>
          ) : null}

          {/* Support divider */}
          <View className="flex-row items-center mb-4">
            <View className={`flex-1 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
            <Text className={`px-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Or support Anti-Matter
            </Text>
            <View className={`flex-1 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
          </View>

          {/* Support amounts - row 1: $1, $5, $10 */}
          <View className="flex-row gap-3 mb-3">
            {SUPPORT_AMOUNTS_ROW1.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleSupport(amount)}
                className={`flex-1 rounded-2xl p-4 items-center ${
                  isDark ? 'bg-[#16161F]' : 'bg-white'
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                }}
              >
                <DollarSign size={20} color="#8B5CF6" />
                <Text className={`font-bold text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${amount}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Support amounts - row 2: $20, $50, $100 */}
          <View className="flex-row gap-3">
            {SUPPORT_AMOUNTS_ROW2.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleSupport(amount)}
                className={`flex-1 rounded-2xl p-4 items-center ${
                  isDark ? 'bg-[#16161F]' : 'bg-white'
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                }}
              >
                <DollarSign size={20} color="#8B5CF6" />
                <Text className={`font-bold text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${amount}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
