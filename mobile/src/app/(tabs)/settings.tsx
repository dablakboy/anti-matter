import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useTheme } from '@/lib/ThemeContext';
import { DonationModal } from '@/components/DonationModal';
import { clearAppCache } from '@/lib/clearCache';
import {
  getNotificationsEnabled,
  setNotificationsEnabled as persistNotificationsEnabled,
  registerForPushNotifications,
  registerPushTokenWithBackend,
  unregisterPushToken,
  getStoredPushToken,
  setStoredPushToken,
} from '@/lib/notifications';
import {
  Info,
  Shield,
  Bell,
  Sun,
  Moon,
  Monitor,
  Heart,
  Star,
  ChevronRight,
  ExternalLink,
  Trash2,
  Download,
  Atom,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Application from 'expo-application';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDeviceId } from '@/lib/deviceId';
import { fetchDeveloperUsage, verifyDeveloperSubscription } from '@/lib/app-submission';
import { DEVELOPER_SUBSCRIPTION_LINK } from '@/lib/support';
import * as WebBrowser from 'expo-web-browser';

interface SettingsItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
  danger = false,
}: SettingsItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 ${isDark ? 'active:bg-white/5' : 'active:bg-black/5'}`}
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center ${
          danger ? 'bg-red-500/20' : 'bg-purple-500/20'
        }`}
      >
        <Icon size={20} color={danger ? '#EF4444' : '#8B5CF6'} />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className={`font-medium ${
            danger ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
      {showChevron && !rightElement ? (
        <ChevronRight size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planVerifyEmail, setPlanVerifyEmail] = useState('');

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const { data: usage, refetch: refetchUsage } = useQuery({
    queryKey: ['developerUsage', deviceId],
    queryFn: () => fetchDeveloperUsage(deviceId!),
    enabled: Boolean(deviceId),
  });

  const planVerifyMutation = useMutation({
    mutationFn: () => verifyDeveloperSubscription(deviceId!, planVerifyEmail.trim()),
    onSuccess: () => {
      setPlanModalVisible(false);
      setPlanVerifyEmail('');
      refetchUsage();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your subscription is verified. You now have unlimited uploads.');
    },
    onError: (err: Error) => Alert.alert('Verification failed', err.message),
  });

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    WebBrowser.openBrowserAsync(DEVELOPER_SUBSCRIPTION_LINK);
  };

  useEffect(() => {
    getNotificationsEnabled().then(setNotificationsEnabledState);
  }, []);

  // Ensure token is registered when notifications were previously enabled (e.g. after app restart)
  useEffect(() => {
    if (!notificationsEnabled) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotifications();
      if (cancelled || !token) return;
      try {
        await registerPushTokenWithBackend(token);
        await setStoredPushToken(token);
      } catch {
        // Silent - user may have denied
      }
    })();
    return () => { cancelled = true; };
  }, [notificationsEnabled]);

  const handleNotificationsToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabledState(value);
    await persistNotificationsEnabled(value);

    if (value) {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await registerPushTokenWithBackend(token);
          await setStoredPushToken(token);
        } else {
          Alert.alert(
            'Permission denied',
            'Enable notifications in Settings to get alerts for new apps.'
          );
        }
      } catch {
        Alert.alert('Error', 'Failed to enable notifications');
      }
    } else {
      const token = await getStoredPushToken();
      if (token) {
        await unregisterPushToken(token);
        await setStoredPushToken(null);
      }
    }
  };

  const handleDonate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDonationModalVisible(true);
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Rate Anti-Matter', 'Thank you for your support!');
  };

  const handleClearCache = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear Cache',
      'This will clear cached files (downloaded IPAs, images, etc.) and free up storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              const { freedBytes } = await clearAppCache();
              const freedMB = (freedBytes / (1024 * 1024)).toFixed(2);
              Alert.alert('Cache Cleared', `Freed ${freedMB} MB of storage.`);
            } catch {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const appVersion = Application.nativeApplicationVersion ?? '1.0.0';
  const buildNumber = Application.nativeBuildVersion ?? '1';

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <Modal visible={planModalVisible} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}
          onPress={() => setPlanModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className={`rounded-2xl p-5 ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
            >
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Developer plan
              </Text>
              <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {usage?.isSubscribed
                  ? 'You have unlimited uploads. Need to re-verify? Enter your subscription email below.'
                  : '$10/month unlocks unlimited app uploads on this device.'}
              </Text>
              {!usage?.isSubscribed && (
                <Pressable onPress={handleSubscribe} className="mt-4">
                  <View className="rounded-xl py-3 items-center bg-emerald-600">
                    <Text className="text-white font-bold">Subscribe $10/month</Text>
                  </View>
                </Pressable>
              )}
              <Text className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Already subscribed? Enter the email you used:
              </Text>
              <TextInput
                value={planVerifyEmail}
                onChangeText={setPlanVerifyEmail}
                placeholder="email@example.com"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className={`mt-2 rounded-xl px-4 py-3 ${
                  isDark ? 'bg-[#2D2D3D] text-white' : 'bg-gray-100 text-gray-900'
                }`}
              />
              <View className="flex-row gap-3 mt-4">
                <Pressable
                  onPress={() => setPlanModalVisible(false)}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    isDark ? 'bg-[#2D2D3D]' : 'bg-gray-200'
                  }`}
                >
                  <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={() => planVerifyMutation.mutate()}
                  disabled={!planVerifyEmail.trim() || planVerifyMutation.isPending}
                  className="flex-1 py-3 rounded-xl items-center bg-purple-600"
                >
                  {planVerifyMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Verify</Text>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
      <DonationModal
        visible={donationModalVisible}
        onClose={() => setDonationModalVisible(false)}
      />
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-6">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Settings
            </Text>
          </View>

          {/* General Section */}
          <View className="mb-6">
            <Text
              className={`px-5 text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              GENERAL
            </Text>
            <View
              className={`mx-5 rounded-2xl overflow-hidden ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlanModalVisible(true);
                }}
                className={`flex-row items-center px-4 py-4 ${isDark ? 'active:bg-white/5' : 'active:bg-black/5'}`}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center bg-purple-500/20">
                  <Crown size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Developer plan
                  </Text>
                  <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {usage?.isSubscribed
                      ? 'Unlimited uploads'
                      : `${usage?.uploadCount ?? 0}/${usage?.freeLimit ?? 5} free uploads used`}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    usage?.isSubscribed ? 'bg-emerald-500/20' : 'bg-gray-500/20'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      usage?.isSubscribed ? 'text-emerald-500' : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {usage?.isSubscribed ? 'Unlimited' : 'Free'}
                  </Text>
                </View>
                <ChevronRight size={20} color={isDark ? '#6B7280' : '#9CA3AF'} style={{ marginLeft: 8 }} />
              </Pressable>
              <View className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
              <SettingsItem
                icon={Bell}
                title="Notifications"
                subtitle="Get notified about new apps"
                showChevron={false}
                rightElement={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationsToggle}
                    trackColor={{ false: '#3D3D4D', true: '#8B5CF6' }}
                    thumbColor="white"
                  />
                }
              />
              <View className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
              <SettingsItem
                icon={preference === 'dark' ? Moon : preference === 'light' ? Sun : Monitor}
                title="Appearance"
                subtitle={
                  preference === 'light'
                    ? 'Light mode'
                    : preference === 'dark'
                    ? 'Dark mode'
                    : 'System'
                }
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const options: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
                  const next =
                    options[(options.indexOf(preference) + 1) % options.length];
                  setPreference(next);
                }}
              />
            </View>
            </View>

          {/* Support Section */}
          <View className="mb-6">
            <Text
              className={`px-5 text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              SUPPORT
            </Text>
            <View
              className={`mx-5 rounded-2xl overflow-hidden ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <SettingsItem
                icon={Heart}
                title="Support Anti-Matter"
                subtitle="Donate via Stripe"
                onPress={handleDonate}
              />
              <View className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
              <SettingsItem
                icon={Star}
                title="Rate App"
                subtitle="Help us improve"
                onPress={handleRateApp}
              />
            </View>
          </View>

          {/* Data Section */}
          <View className="mb-6">
            <Text
              className={`px-5 text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              DATA
            </Text>
            <View
              className={`mx-5 rounded-2xl overflow-hidden ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <SettingsItem
                icon={Download}
                title="Downloaded Apps"
                subtitle="Re-download previous IPAs"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/downloaded-apps');
                }}
              />
              <View className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
              <SettingsItem
                icon={Trash2}
                title="Clear Cache"
                subtitle={clearingCache ? 'Clearing...' : 'Free up storage space'}
                onPress={handleClearCache}
                danger
              />
            </View>
          </View>

          {/* About Section */}
          <View className="mb-6">
            <Text
              className={`px-5 text-sm font-semibold mb-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              ABOUT
            </Text>
            <View
              className={`mx-5 rounded-2xl overflow-hidden ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <SettingsItem
                icon={Info}
                title="Version"
                subtitle={`${appVersion} (${buildNumber})`}
                showChevron={false}
              />
              <View className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
              <SettingsItem
                icon={Shield}
                title="Privacy Policy"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/privacy');
                }}
              />
              <View className={`h-px mx-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
              <SettingsItem
                icon={ExternalLink}
                title="Terms of Service"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/terms');
                }}
              />
            </View>
          </View>

          {/* Footer */}
          <View className="items-center py-6">
            <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Anti-Matter IPA Store
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
              Made with love for the sideloading community
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
