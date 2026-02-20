import React from 'react';
import { View } from 'react-native';
import { Smartphone, Tablet } from 'lucide-react-native';
import type { DeviceCompatibility } from '@/types/app';

interface DeviceIconsProps {
  device?: DeviceCompatibility;
  size?: number;
  color?: string;
}

/** Renders iPhone, iPad, or both icons based on device compatibility */
export function DeviceIcons({ device = 'both', size = 16, color = '#8B5CF6' }: DeviceIconsProps) {
  if (device === 'iphone') {
    return <Smartphone size={size} color={color} />;
  }
  if (device === 'ipad') {
    return <Tablet size={size} color={color} />;
  }
  return (
    <View className="flex-row items-center" style={{ gap: 4 }}>
      <Smartphone size={size} color={color} />
      <Tablet size={size} color={color} />
    </View>
  );
}
