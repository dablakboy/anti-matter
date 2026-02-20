import React from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useColorScheme } from '@/lib/useColorScheme';
import { getDownloadHistory, type DownloadHistoryEntry } from '@/lib/downloadHistory';
import { downloadIpaToDevice } from '@/lib/ipa-storage';
import { ArrowLeft, Download, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function DownloadedAppsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['downloadHistory'],
    queryFn: getDownloadHistory,
    staleTime: 0,
  });

  const downloadMutation = useMutation({
    mutationFn: (entry: DownloadHistoryEntry) =>
      downloadIpaToDevice({
        ipaUrl: entry.ipaUrl,
        ipaPath: entry.ipaPath,
        appName: entry.appName,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      Alert.alert('Download Failed', err.message);
    },
  });

  const handleRedownload = (entry: DownloadHistoryEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    downloadMutation.mutate(entry);
  };

  const renderItem = ({ item }: { item: DownloadHistoryEntry }) => (
    <Pressable
      onPress={() => handleRedownload(item)}
      disabled={downloadMutation.isPending}
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
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center ${
          isDark ? 'bg-purple-500/20' : 'bg-purple-100'
        }`}
      >
        <Package size={24} color="#8B5CF6" />
      </View>
      <View className="flex-1 ml-4">
        <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.appName}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Download size={18} color="#8B5CF6" />
        <Text className="text-purple-500 font-medium ml-2">Re-download</Text>
      </View>
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
            Downloaded Apps
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : history.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Package size={48} color={isDark ? '#4B5563' : '#9CA3AF'} />
            <Text className={`text-lg font-medium mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No downloads yet
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              IPA files you download will appear here for easy re-download
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => `${item.appId}-${item.downloadedAt}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
