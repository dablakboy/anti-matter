import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  useColorScheme,
  Linking,
} from 'react-native';
import {
  SUPPORT_AMOUNTS_ROW1,
  SUPPORT_AMOUNTS_ROW2,
  STRIPE_PAYMENT_LINKS,
} from '@/lib/support';
import { DollarSign, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface DonationModalProps {
  visible: boolean;
  onClose: () => void;
}

function DonationButtons({ isDark }: { isDark: boolean }) {
  const handleAmount = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = STRIPE_PAYMENT_LINKS[amount];
    if (url) Linking.openURL(url);
  };

  const AmountButton = ({ amount }: { amount: number }) => (
    <Pressable
      onPress={() => handleAmount(amount)}
      className={`flex-1 rounded-2xl p-4 items-center ${
        isDark ? 'bg-[#16161F]' : 'bg-white'
      }`}
      style={{
        borderWidth: 1,
        borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
      }}
    >
      <DollarSign size={20} color="#8B5CF6" />
      <Text className={`font-bold text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ${amount}
      </Text>
    </Pressable>
  );

  return (
    <>
      <View className="flex-row gap-3 mb-3">
        {SUPPORT_AMOUNTS_ROW1.map((amount) => (
          <AmountButton key={amount} amount={amount} />
        ))}
      </View>
      <View className="flex-row gap-3">
        {SUPPORT_AMOUNTS_ROW2.map((amount) => (
          <AmountButton key={amount} amount={amount} />
        ))}
      </View>
    </>
  );
}

export function DonationModal({ visible, onClose }: DonationModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className={`rounded-t-3xl ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}
          onPress={(e) => e.stopPropagation()}
          style={{ paddingBottom: 34 }}
        >
          <View className="items-center pt-2 pb-4">
            <View className="w-10 h-1 rounded-full bg-gray-400" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Support Anti-Matter
            </Text>
            <Pressable onPress={onClose} hitSlop={12} className="p-2">
              <X size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </Pressable>
          </View>
          <View className="px-5">
            <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Choose an amount to contribute via Stripe
            </Text>
            <DonationButtons isDark={isDark} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
