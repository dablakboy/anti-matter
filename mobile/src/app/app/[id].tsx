import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApp } from '@/hooks/useApps';
import { getDeviceId } from '@/lib/deviceId';
import { deleteApp } from '@/lib/api/apps';
import type { IPAApp } from '@/types/app';
import { DeviceIcons } from '@/components/DeviceIcons';
import { canDownloadApp, getDownloadCountdown } from '@/lib/canDownload';
import {
  ArrowLeft,
  Download,
  Star,
  Shield,
  Clock,
  HardDrive,
  Smartphone,
  ExternalLink,
  Twitter,
  Globe,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const { app: appData, isLoading } = useApp(id ?? undefined, deviceId ?? undefined);
  const app = appData as (IPAApp & { canDelete?: boolean }) | undefined;

  const deleteMutation = useMutation({
    mutationFn: () => deleteApp(app!.id, deviceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['app', id] });
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

  const downloadInfo = app ? getDownloadCountdown(app) : null;
  const canDownload = app ? canDownloadApp(app) : false;
  const hasIpa = Boolean(app?.ipaPath || (app?.ipaUrl && app.ipaUrl.startsWith('http')));

  const handleDownload = () => {
    if (!app) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!hasIpa) {
      Alert.alert(
        'No Download Available',
        'This app does not have a download link yet. Apps uploaded via the Developer portal will be available once approved.'
      );
      return;
    }
    if (!canDownload) return;
    router.push({ pathname: '/download-options', params: { appId: app.id } });
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

  const handleInstallCertificate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Install Certificate',
      'Certificate installation is required for some apps. This will open the certificate profile in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Install', onPress: () => {} },
      ]
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
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
            App Details
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* App Header */}
          <View className="px-5 py-6">
            <View className="flex-row items-start">
              <Image
                source={{ uri: app.icon || 'https://via.placeholder.com/100?text=App' }}
                style={{ width: 100, height: 100, borderRadius: 24 }}
                contentFit="cover"
              />
              <View className="flex-1 ml-4">
                <Text
                  className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {app.name}
                </Text>
                <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {app.developerName}
                </Text>
                <View className="flex-row items-center mt-3">
                  <View className="flex-row items-center mr-4">
                    <Star size={14} color="#FBBF24" fill="#FBBF24" />
                    <Text className="text-yellow-500 font-semibold ml-1">
                      {app.rating.toFixed(1)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Download size={14} color="#8B5CF6" />
                    <Text className="text-purple-500 font-semibold ml-1">
                      {formatDownloads(app.downloads)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-5 mb-6">
            <Pressable onPress={handleDownload} disabled={!hasIpa || !canDownload}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  opacity: hasIpa && canDownload ? 1 : 0.6,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Download size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    {canDownload ? 'Download IPA' : downloadInfo?.label ?? 'Under review'}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            {app.certificateUrl ? (
              <Pressable
                onPress={handleInstallCertificate}
                className={`mt-3 rounded-2xl p-4 flex-row items-center justify-center ${
                  isDark ? 'bg-[#16161F]' : 'bg-white'
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                }}
              >
                <Shield size={20} color="#8B5CF6" />
                <Text className="text-purple-500 font-semibold ml-2">Install Certificate</Text>
              </Pressable>
            ) : null}

            {app.canDelete ? (
              <Pressable
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                className={`mt-3 rounded-2xl p-4 flex-row items-center justify-center ${
                  isDark ? 'bg-red-500/20' : 'bg-red-50'
                }`}
                style={{
                  borderWidth: 1,
                  borderColor: '#EF4444',
                }}
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
          </View>

          {/* App Info */}
          <View className="px-5 mb-6">
            <View
              className={`rounded-2xl p-4 ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <HardDrive size={20} color={isDark ? '#A78BFA' : '#7C3AED'} />
                  <Text className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Size
                  </Text>
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {app.size}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Clock size={20} color={isDark ? '#A78BFA' : '#7C3AED'} />
                  <Text className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Version
                  </Text>
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {app.version}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Smartphone size={20} color={isDark ? '#A78BFA' : '#7C3AED'} />
                  <Text className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    iOS
                  </Text>
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {app.iosVersionRequired}+
                  </Text>
                  <View className="mt-1">
                    <DeviceIcons
                      device={app.device}
                      size={12}
                      color={isDark ? '#A78BFA' : '#7C3AED'}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="px-5 mb-6">
            <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Description
            </Text>
            <View
              className={`rounded-2xl p-4 ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className={`leading-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {app.description}
              </Text>
            </View>
          </View>

          {/* Social Links */}
          {Boolean(app.socialLinks) && (
            <View className="px-5 mb-6">
              <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Links
              </Text>
              <View className="flex-row flex-wrap">
                {Boolean(app.socialLinks?.twitter) && (
                  <Pressable
                    onPress={() => Linking.openURL(`https://twitter.com/${app.socialLinks?.twitter}`)}
                    className={`flex-row items-center rounded-full px-4 py-2 mr-3 mb-2 ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                    }}
                  >
                    <Twitter size={16} color="#1DA1F2" />
                    <Text className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {app.socialLinks?.twitter}
                    </Text>
                  </Pressable>
                )}
                {Boolean(app.socialLinks?.website) && (
                  <Pressable
                    onPress={() => Linking.openURL(app.socialLinks?.website ?? '')}
                    className={`flex-row items-center rounded-full px-4 py-2 mr-3 mb-2 ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                    }}
                  >
                    <Globe size={16} color="#8B5CF6" />
                    <Text className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Website
                    </Text>
                  </Pressable>
                )}
                {Boolean(app.appStoreLink) && (
                  <Pressable
                    onPress={() => Linking.openURL(app.appStoreLink ?? '')}
                    className={`flex-row items-center rounded-full px-4 py-2 mr-3 mb-2 ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                    }}
                  >
                    <ExternalLink size={16} color="#8B5CF6" />
                    <Text className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      App Store
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Last Updated */}
          <View className="px-5">
            <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Last updated: {new Date(app.lastUpdated).toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
