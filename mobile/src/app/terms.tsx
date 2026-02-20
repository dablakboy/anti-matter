import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function TermsOfServiceScreen() {
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
            Terms of Service
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className={`text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {`Last updated: ${new Date().toLocaleDateString()}

By using Anti-Matter, you agree to these Terms of Service:

1. SIDELOADING DISCLAIMER
Anti-Matter is an IPA sideloading store. This app is NOT submitted to or distributed via the Apple App Store. The developer accepts sole responsibility for distribution outside Apple's official channels. Use of sideloading tools and techniques is at your own risk.

2. DEVELOPER RESPONSIBILITY
App listings are submitted by third-party developers. We do not verify, endorse, or assume responsibility for the safety, legality, or functionality of IPA files. Developers are solely responsible for their submissions. We reserve the right to remove listings that violate our guidelines.

3. USER RESPONSIBILITY
You are responsible for ensuring that downloading and installing IPA files complies with applicable laws and the terms of any software licenses. Jailbreaking, modification, or circumvention of device restrictions may void warranties or violate terms of service.

4. NO WARRANTIES
The service is provided "as is" without warranties of any kind. We do not guarantee availability, accuracy, or safety of listed apps. Download and install at your own risk.

5. LIMITATION OF LIABILITY
To the maximum extent permitted by law, we are not liable for any damages arising from your use of this app or any IPA files obtained through it, including but not limited to device damage, data loss, or legal consequences.

6. INTELLECTUAL PROPERTY
IPA files and their contents are the property of their respective owners. We do not claim ownership of third-party apps. Respect copyright and licensing terms.

7. ACCEPTABLE USE
You agree not to use the service for illegal purposes, to distribute malware, or to infringe on intellectual property rights. Violations may result in account or access termination.

8. MODIFICATIONS
We may modify these terms at any time. Continued use constitutes acceptance. We may discontinue the service without notice.

9. GOVERNING LAW
These terms are governed by applicable law. Disputes shall be resolved in accordance with local jurisdiction.

10. CONTACT
For questions about these terms, contact us through the app's support channels.`}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
