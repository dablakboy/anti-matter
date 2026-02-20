import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApps } from '@/hooks/useApps';
import { DeviceIcons } from '@/components/DeviceIcons';
import { ArrowLeft, Download, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { IPAApp } from '@/types/app';

function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export default function AllAppsScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { apps, getAppsByCategory, isLoading } = useApps();

  const displayApps = type === 'top'
    ? [...apps].sort((a, b) => b.downloads - a.downloads).slice(0, 50)
    : type === 'latest'
    ? [...apps].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    : apps;

  const title = type === 'top' ? 'Top Apps' : type === 'latest' ? 'Latest Apps' : 'All Apps';

  const handleAppPress = (appId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/app/${appId}`);
  };

  const renderApp = ({ item, index }: { item: IPAApp; index: number }) => (
    <Pressable
      onPress={() => handleAppPress(item.id)}
      className={`mx-5 mb-3 rounded-2xl overflow-hidden ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center p-4">
        <Text className={`w-8 text-lg font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {index + 1}
        </Text>
        <Image
          source={{ uri: item.icon || 'https://via.placeholder.com/100?text=App' }}
          style={{ width: 56, height: 56, borderRadius: 14 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-4">
          <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.name}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.developerName}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="flex-row items-center mr-4">
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text className="text-yellow-500 text-xs ml-1">{item.rating.toFixed(1)}</Text>
            </View>
            <View className="flex-row items-center mr-3">
              <Download size={12} color="#8B5CF6" />
              <Text className="text-purple-500 text-xs ml-1">
                {formatDownloads(item.downloads)}
              </Text>
            </View>
            <DeviceIcons device={item.device} size={12} color="#8B5CF6" />
          </View>
        </View>
      </View>
    </Pressable>
  );

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
            {title}
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : displayApps.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No apps yet
            </Text>
          </View>
        ) : (
        <FlatList
          data={displayApps}
          keyExtractor={(item) => item.id}
          renderItem={renderApp}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
        />
        )}
      </SafeAreaView>
    </View>
  );
}
