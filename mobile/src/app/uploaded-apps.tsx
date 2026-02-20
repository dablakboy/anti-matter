import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from '@/lib/useColorScheme';
import { getDeviceId } from '@/lib/deviceId';
import { fetchUploadedApps } from '@/lib/api/apps';
import { getCachedUploadedApps, setCachedUploadedApps } from '@/lib/uploadedAppsStorage';
import type { IPAApp } from '@/types/app';
import { Image } from 'expo-image';
import { ArrowLeft, Package, Upload } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

function toCacheEntry(app: IPAApp) {
  return {
    id: app.id,
    name: app.name,
    developerName: app.developerName,
    icon: app.icon,
    version: app.version,
    status: app.status,
    createdAt: app.createdAt,
    cachedAt: new Date().toISOString(),
  };
}

export default function UploadedAppsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const [cachedApps, setCachedApps] = useState<IPAApp[]>([]);

  useEffect(() => {
    getCachedUploadedApps().then((cached) => {
      const asApps: IPAApp[] = cached.map((e) => ({
        id: e.id,
        name: e.name,
        developerName: e.developerName,
        icon: e.icon ?? '',
        description: '',
        version: e.version,
        size: '—',
        category: 'utilities',
        downloads: 0,
        rating: 0,
        ipaUrl: '',
        device: 'both',
        screenshots: [],
        iosVersionRequired: '14.0',
        lastUpdated: e.createdAt ?? '',
        status: (e.status as 'approved' | 'pending') ?? 'pending',
        createdAt: e.createdAt,
      }));
      setCachedApps(asApps);
    });
  }, []);

  const {
    data: apps = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['uploadedApps', deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const fetched = await fetchUploadedApps(deviceId);
      const entries = fetched.map(toCacheEntry);
      await setCachedUploadedApps(entries);
      return fetched;
    },
    enabled: Boolean(deviceId),
    staleTime: 60_000,
  });

  const displayApps = apps.length > 0 ? apps : cachedApps;
  const showingCached = apps.length === 0 && cachedApps.length > 0;

  const handleAppPress = (app: IPAApp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/app/${app.id}` as const);
  };

  const renderItem = ({ item }: { item: IPAApp }) => (
    <Pressable
      onPress={() => handleAppPress(item)}
      className={`mx-5 mb-3 rounded-2xl overflow-hidden flex-row items-center p-4 ${
        isDark ? 'bg-[#16161F]' : 'bg-white'
      }`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {item.icon ? (
        <Image
          source={{ uri: item.icon }}
          style={{ width: 48, height: 48, borderRadius: 12 }}
          contentFit="cover"
        />
      ) : (
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center ${
            isDark ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}
        >
          <Package size={24} color="#8B5CF6" />
        </View>
      )}
      <View className="flex-1 ml-4">
        <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.name}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {item.developerName} • v{item.version}
        </Text>
        {item.status === 'pending' && (
          <View className="mt-1 self-start rounded-full bg-amber-500/20 px-2 py-0.5">
            <Text className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</Text>
          </View>
        )}
      </View>
      <ArrowLeft size={18} color={isDark ? '#6B7280' : '#9CA3AF'} style={{ transform: [{ rotate: '180deg' }] }} />
    </Pressable>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
          >
            <ArrowLeft size={22} color={isDark ? 'white' : 'black'} />
          </Pressable>
          <Text
            className={`flex-1 text-lg font-semibold text-center mr-10 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Uploaded Apps
          </Text>
        </View>

        {showingCached && (
          <View className="mx-5 mb-2 rounded-xl bg-amber-500/10 px-3 py-2">
            <Text className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              Showing cached list. Pull to refresh for latest.
            </Text>
          </View>
        )}

        {isLoading && displayApps.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : displayApps.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Upload size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text className={`text-lg font-medium mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No uploaded apps yet
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Apps you submit from the Developer tab will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayApps}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching && !isLoading}
                onRefresh={refetch}
                tintColor="#8B5CF6"
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
