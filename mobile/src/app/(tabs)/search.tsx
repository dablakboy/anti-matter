import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApps } from '@/hooks/useApps';
import { IPAApp, AppCategory } from '@/types/app';
import {
  Search,
  X,
  Download,
  Star,
  Gamepad2,
  Tv,
  Heart,
  Cloud,
  DollarSign,
  Home,
  Music,
  Trophy,
  GraduationCap,
  Plane,
  Wrench,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Category data with colors
const BENTO_CATEGORIES: {
  id: AppCategory;
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
}[] = [
  {
    id: 'games',
    name: 'Games',
    icon: Gamepad2,
    bgColor: '#FEF3C7',
    iconBgColor: '#FDE68A',
    iconColor: '#D97706',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: Tv,
    bgColor: '#DBEAFE',
    iconBgColor: '#BFDBFE',
    iconColor: '#2563EB',
  },
  {
    id: 'health',
    name: 'Health',
    icon: Heart,
    bgColor: '#FCE7F3',
    iconBgColor: '#FBCFE8',
    iconColor: '#DB2777',
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: Cloud,
    bgColor: '#E0E7FF',
    iconBgColor: '#C7D2FE',
    iconColor: '#4F46E5',
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: DollarSign,
    bgColor: '#D1FAE5',
    iconBgColor: '#A7F3D0',
    iconColor: '#059669',
  },
  {
    id: 'home',
    name: 'Home',
    icon: Home,
    bgColor: '#EDE9FE',
    iconBgColor: '#DDD6FE',
    iconColor: '#7C3AED',
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    bgColor: '#FFEDD5',
    iconBgColor: '#FED7AA',
    iconColor: '#EA580C',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: Trophy,
    bgColor: '#FEE2E2',
    iconBgColor: '#FECACA',
    iconColor: '#DC2626',
  },
  {
    id: 'education',
    name: 'Education',
    icon: GraduationCap,
    bgColor: '#CFFAFE',
    iconBgColor: '#A5F3FC',
    iconColor: '#0891B2',
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: Plane,
    bgColor: '#F3E8FF',
    iconBgColor: '#E9D5FF',
    iconColor: '#9333EA',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: Wrench,
    bgColor: '#E5E7EB',
    iconBgColor: '#D1D5DB',
    iconColor: '#4B5563',
  },
  {
    id: 'social',
    name: 'Social',
    icon: Users,
    bgColor: '#FDF2F8',
    iconBgColor: '#FCE7F3',
    iconColor: '#BE185D',
  },
];

// Dark mode colors
const DARK_BENTO_CATEGORIES: {
  id: AppCategory;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
}[] = [
  { id: 'games', bgColor: '#422006', iconBgColor: '#78350F', iconColor: '#FBBF24' },
  { id: 'entertainment', bgColor: '#1E3A5F', iconBgColor: '#1E40AF', iconColor: '#60A5FA' },
  { id: 'health', bgColor: '#4C1D3D', iconBgColor: '#831843', iconColor: '#F472B6' },
  { id: 'weather', bgColor: '#312E81', iconBgColor: '#3730A3', iconColor: '#A5B4FC' },
  { id: 'finance', bgColor: '#064E3B', iconBgColor: '#065F46', iconColor: '#34D399' },
  { id: 'home', bgColor: '#4C1D95', iconBgColor: '#5B21B6', iconColor: '#A78BFA' },
  { id: 'music', bgColor: '#7C2D12', iconBgColor: '#9A3412', iconColor: '#FB923C' },
  { id: 'sports', bgColor: '#7F1D1D', iconBgColor: '#991B1B', iconColor: '#F87171' },
  { id: 'education', bgColor: '#164E63', iconBgColor: '#155E75', iconColor: '#22D3EE' },
  { id: 'travel', bgColor: '#581C87', iconBgColor: '#6B21A8', iconColor: '#C084FC' },
  { id: 'utilities', bgColor: '#1F2937', iconBgColor: '#374151', iconColor: '#9CA3AF' },
  { id: 'social', bgColor: '#831843', iconBgColor: '#9D174D', iconColor: '#F9A8D4' },
];

function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { searchApps, isLoading } = useApps();

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    return searchApps(searchQuery);
  }, [searchQuery, searchApps]);

  const handleAppPress = (appId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/app/${appId}` as const);
  };

  const handleCategoryPress = (category: AppCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/category/[id]', params: { id: category } });
  };

  const getCategoryColors = (id: AppCategory) => {
    if (isDark) {
      const darkCat = DARK_BENTO_CATEGORIES.find((c) => c.id === id);
      const lightCat = BENTO_CATEGORIES.find((c) => c.id === id);
      return {
        bgColor: darkCat?.bgColor ?? '#1F1F2E',
        iconBgColor: darkCat?.iconBgColor ?? '#2D2D3D',
        iconColor: darkCat?.iconColor ?? '#8B5CF6',
        icon: lightCat?.icon ?? Gamepad2,
        name: lightCat?.name ?? '',
      };
    }
    const cat = BENTO_CATEGORIES.find((c) => c.id === id);
    return {
      bgColor: cat?.bgColor ?? '#F3F4F6',
      iconBgColor: cat?.iconBgColor ?? '#E5E7EB',
      iconColor: cat?.iconColor ?? '#6B7280',
      icon: cat?.icon ?? Gamepad2,
      name: cat?.name ?? '',
    };
  };

  const renderSearchResult = ({ item }: { item: IPAApp }) => (
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
            <View className="flex-row items-center">
              <Download size={12} color="#8B5CF6" />
              <Text className="text-purple-500 text-xs ml-1">
                {formatDownloads(item.downloads)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderCategoryCard = (category: AppCategory) => {
    const { bgColor, iconBgColor, iconColor, icon: IconComponent, name } = getCategoryColors(category);

    return (
      <Pressable
        key={category}
        onPress={() => handleCategoryPress(category)}
        className="flex-1"
        style={{
          backgroundColor: bgColor,
          minHeight: 120,
        }}
      >
        <View className="flex-1 p-4 items-center justify-center">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
            style={{ backgroundColor: iconBgColor }}
          >
            <IconComponent size={28} color={iconColor} />
          </View>
          <Text
            className="font-semibold text-center"
            style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}
          >
            {name}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Search
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View
            className={`flex-row items-center rounded-full px-4 py-3 ${
              isDark ? 'bg-[#16161F]' : 'bg-white'
            }`}
            style={{
              borderWidth: 1,
              borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
            }}
          >
            <Search size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search apps, developers..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              className={`flex-1 ml-3 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </Pressable>
            )}
          </View>
        </View>

        {searchQuery.length > 0 ? (
          // Search Results
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchResult}
            contentContainerStyle={{ paddingVertical: 10 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Search size={48} color={isDark ? '#374151' : '#D1D5DB'} />
                <Text className={`mt-4 text-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No apps found
                </Text>
              </View>
            }
          />
        ) : (
          // Bento Grid Categories - Edge to Edge
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            <View className="flex-row">
              {renderCategoryCard('games')}
              {renderCategoryCard('entertainment')}
            </View>
            <View className="flex-row">
              {renderCategoryCard('health')}
              {renderCategoryCard('weather')}
            </View>
            <View className="flex-row">
              {renderCategoryCard('finance')}
              {renderCategoryCard('home')}
            </View>
            <View className="flex-row">
              {renderCategoryCard('music')}
              {renderCategoryCard('sports')}
            </View>
            <View className="flex-row">
              {renderCategoryCard('education')}
              {renderCategoryCard('travel')}
            </View>
            <View className="flex-row">
              {renderCategoryCard('utilities')}
              {renderCategoryCard('social')}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
