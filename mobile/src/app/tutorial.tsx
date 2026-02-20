import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import {
  ArrowLeft,
  Download,
  Shield,
  Smartphone,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const SIDELOAD_METHODS = [
  {
    name: 'AltStore',
    description: 'Free, requires a computer to install',
    url: 'https://altstore.io',
    steps: [
      'Download AltServer on your Mac or Windows PC',
      'Connect your iPhone via USB',
      'Install AltStore to your device',
      'Open AltStore and sign in with Apple ID',
      'Import IPA files to install apps',
    ],
  },
  {
    name: 'Sideloadly',
    description: 'Free, computer-based sideloading',
    url: 'https://sideloadly.io',
    steps: [
      'Download Sideloadly for Mac or Windows',
      'Connect your iPhone via USB',
      'Drag and drop IPA file into Sideloadly',
      'Enter your Apple ID credentials',
      'Click Start to install the app',
    ],
  },
  {
    name: 'TrollStore',
    description: 'Permanent install, requires specific iOS versions',
    url: 'https://github.com/opa334/TrollStore',
    steps: [
      'Check if your iOS version is compatible',
      'Install TrollHelper using the guide',
      'Open TrollHelper and install TrollStore',
      'Import IPA files directly in TrollStore',
      'Apps installed are permanently signed',
    ],
  },
];

export default function TutorialScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

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
            How to Sideload
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Warning Card */}
          <View className="px-5 mb-6">
            <View
              className={`rounded-2xl p-4 ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}
              style={{
                borderWidth: 1,
                borderColor: isDark ? '#78350F' : '#FDE68A',
              }}
            >
              <View className="flex-row items-start">
                <AlertTriangle size={20} color="#F59E0B" />
                <View className="flex-1 ml-3">
                  <Text className={`font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    Important Notice
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    Sideloading apps requires an Apple ID. Free accounts need to re-sign apps every
                    7 days. Use at your own risk.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* What is Sideloading */}
          <View className="px-5 mb-6">
            <Text className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              What is Sideloading?
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
                Sideloading is the process of installing apps on your iOS device without using the
                App Store. This allows you to install apps that aren't available on the App Store,
                such as emulators, modified apps, or beta versions.
              </Text>
            </View>
          </View>

          {/* Requirements */}
          <View className="px-5 mb-6">
            <Text className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Requirements
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
              {[
                { icon: Smartphone, text: 'iOS device (iPhone/iPad)' },
                { icon: Shield, text: 'Apple ID (free or developer)' },
                { icon: Download, text: 'IPA file of the app' },
              ].map((item, index) => (
                <View
                  key={index}
                  className={`flex-row items-center ${index !== 2 ? 'mb-4' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
                    <item.icon size={20} color="#8B5CF6" />
                  </View>
                  <Text className={`ml-3 flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.text}
                  </Text>
                  <CheckCircle size={20} color="#10B981" />
                </View>
              ))}
            </View>
          </View>

          {/* Sideloading Methods */}
          <View className="px-5 mb-6">
            <Text className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sideloading Methods
            </Text>
            {SIDELOAD_METHODS.map((method, methodIndex) => (
              <View
                key={methodIndex}
                className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {method.name}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {method.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(method.url)}
                    className="bg-purple-500/20 rounded-full p-2"
                  >
                    <ExternalLink size={18} color="#8B5CF6" />
                  </Pressable>
                </View>
                <View className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  {method.steps.map((step, stepIndex) => (
                    <View key={stepIndex} className="flex-row items-start mb-2">
                      <View className="w-6 h-6 rounded-full bg-purple-500 items-center justify-center mr-3 mt-0.5">
                        <Text className="text-white text-xs font-bold">{stepIndex + 1}</Text>
                      </View>
                      <Text
                        className={`flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      >
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View className="px-5">
            <Text className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tips
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
                {`• Free Apple IDs can only install 3 apps at a time\n• Apps need to be re-signed every 7 days with free accounts\n• Developer accounts ($99/year) allow unlimited apps and 1-year signing\n• TrollStore provides permanent installation on supported iOS versions\n• Always download IPA files from trusted sources`}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
