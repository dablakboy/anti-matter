import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApps } from '@/hooks/useApps';
import { DonationModal } from '@/components/DonationModal';
import {
  Atom,
  ChevronRight,
  Download,
  Heart,
  BookOpen,
  Star,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { getTopApps, getLatestApps, isLoading } = useApps();
  const topApps = getTopApps();
  const latestApps = getLatestApps();
  const [donationModalVisible, setDonationModalVisible] = useState(false);

  const handleAppPress = (appId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/app/${appId}` as const);
  };

  const handleDonate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDonationModalVisible(true);
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <DonationModal
        visible={donationModalVisible}
        onClose={() => setDonationModalVisible(false)}
      />
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-6">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-purple-600 items-center justify-center mr-3">
                <Atom size={28} color="white" strokeWidth={2.5} />
              </View>
              <View>
                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Anti-Matter
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  IPA Sideloading Store
                </Text>
              </View>
            </View>
          </View>

          {/* How to Sideload Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/tutorial');
            }}
            className="mx-5 mb-6"
          >
            <LinearGradient
              colors={isDark ? ['#1E1B4B', '#312E81'] : ['#EDE9FE', '#DDD6FE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-purple-500/30 items-center justify-center mr-4">
                    <BookOpen size={24} color={isDark ? '#A78BFA' : '#7C3AED'} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${isDark ? 'text-white' : 'text-purple-900'}`}
                    >
                      How to Sideload
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'}`}
                    >
                      Learn to install apps on your device
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color={isDark ? '#A78BFA' : '#7C3AED'} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Latest Apps Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 mb-4">
              <View className="flex-row items-center">
                <Clock size={20} color={isDark ? '#A78BFA' : '#7C3AED'} />
                <Text
                  className={`text-lg font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  Latest Apps
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/all-apps', params: { type: 'latest' } })}
                className="flex-row items-center"
              >
                <Text className="text-purple-500 font-semibold text-sm">See All</Text>
                <ChevronRight size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {isLoading ? (
                <View className="w-36 mr-4 items-center justify-center py-8">
                  <ActivityIndicator size="small" color="#8B5CF6" />
                </View>
              ) : latestApps.length === 0 ? (
                <Text className={`py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No apps yet
                </Text>
              ) : (
                latestApps.map((app) => (
                <Pressable
                  key={app.id}
                  onPress={() => handleAppPress(app.id)}
                  className={`w-36 mr-4 rounded-2xl overflow-hidden ${
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
                  <View className="p-3">
                    <Image
                      source={{ uri: app.icon || 'https://via.placeholder.com/100?text=App' }}
                      style={{ width: 60, height: 60, borderRadius: 14 }}
                      contentFit="cover"
                    />
                    <Text
                      className={`mt-3 font-semibold text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                      numberOfLines={1}
                    >
                      {app.name}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                      numberOfLines={1}
                    >
                      {app.developerName}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Download size={12} color="#8B5CF6" />
                      <Text className="text-xs text-purple-500 ml-1">
                        {formatDownloads(app.downloads)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          {/* Top Apps Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 mb-4">
              <View className="flex-row items-center">
                <TrendingUp size={20} color={isDark ? '#A78BFA' : '#7C3AED'} />
                <Text
                  className={`text-lg font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  Top Apps
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/all-apps', params: { type: 'top' } })}
                className="flex-row items-center"
              >
                <Text className="text-purple-500 font-semibold text-sm">See All</Text>
                <ChevronRight size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <View className="px-5">
              <View className="flex-row flex-wrap justify-between">
                {isLoading ? (
                  <View className="flex-1 items-center justify-center py-12">
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  </View>
                ) : topApps.length === 0 ? (
                  <Text className={`w-full py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No apps yet
                  </Text>
                ) : (
                  topApps.slice(0, 6).map((app, index) => (
                  <Pressable
                    key={app.id}
                    onPress={() => handleAppPress(app.id)}
                    className={`w-[31%] mb-4 rounded-2xl overflow-hidden ${
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
                    <View className="p-3 items-center">
                      <View className="relative">
                        <Image
                          source={{ uri: app.icon || 'https://via.placeholder.com/100?text=App' }}
                          style={{ width: 52, height: 52, borderRadius: 12 }}
                          contentFit="cover"
                        />
                        {index < 3 && (
                          <View
                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center ${
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                ? 'bg-gray-400'
                                : 'bg-amber-700'
                            }`}
                          >
                            <Text className="text-white text-xs font-bold">{index + 1}</Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className={`mt-2 font-semibold text-xs text-center ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                        numberOfLines={1}
                      >
                        {app.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Star size={10} color="#FBBF24" fill="#FBBF24" />
                        <Text className="text-xs text-yellow-500 ml-1">
                          {app.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* Donate Section */}
          <Pressable onPress={handleDonate} className="mx-5 mb-4">
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                    <Heart size={24} color="white" fill="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-white">Support Anti-Matter</Text>
                    <Text className="text-sm text-white/80">
                      Help us keep the store running
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="white" />
              </View>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
