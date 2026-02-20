import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} className="flex-1">
        <View
          className={`flex-row items-center px-4 py-3 ${
            isDark ? 'border-b border-gray-800' : 'border-b border-gray-200'
          }`}
        >
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
          <Text className={`flex-1 text-lg font-semibold text-center mr-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Privacy Policy
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className={`text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {`Last updated: ${new Date().toLocaleDateString()}

Anti-Matter is an IPA sideloading store distributed outside the Apple App Store. By using this app, you acknowledge and agree to the following:

1. NO APP STORE DISTRIBUTION
This app is not distributed through the Apple App Store. It is intended for users who sideload applications onto their iOS devices. The developer bears sole responsibility for distribution outside Apple's official channels.

2. DATA COLLECTION
We collect minimal data necessary to operate the service. Download history is stored locally on your device. We do not sell your personal information.

3. IPA FILES
IPA files listed in this store are submitted by third-party developers. We do not host or control the content of these files. Downloading and installing IPAs is at your own risk.

4. LOCAL STORAGE
Download history and preferences are stored locally on your device. Clearing app data will remove this information.

5. COOKIES & ANALYTICS
We may use standard web technologies for basic functionality. We do not engage in intrusive tracking.

6. CHILDREN'S PRIVACY
This app is not directed at children under 13. We do not knowingly collect information from children.

7. CHANGES
We may update this policy. Continued use of the app constitutes acceptance of changes.

8. CONTACT
For privacy-related inquiries, contact us through the app's support channels.`}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
