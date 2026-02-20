import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/lib/useColorScheme';
import { CloudUpload, CheckCircle } from 'lucide-react-native';

const REVIEW_PERIOD_MS = 48 * 60 * 60 * 1000;

interface SubmitProgressModalProps {
  visible: boolean;
  progress: number; // 0-100
  status: 'uploading' | 'success' | 'error';
}

export function SubmitProgressModal({
  visible,
  progress,
  status,
}: SubmitProgressModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const barWidth = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    barWidth.value = 0;
    barWidth.value = withTiming(progress, { duration: 400 });
  }, [visible, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const statusText =
    status === 'uploading'
      ? 'Submitting to Anti-Matter...'
      : status === 'success'
      ? 'Submitted for review!'
      : 'Something went wrong';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#16161F' : '#FFFFFF',
              borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
            },
          ]}
        >
          <View style={styles.header}>
            {status === 'success' ? (
              <CheckCircle size={28} color="#10B981" />
            ) : (
              <CloudUpload size={28} color="#8B5CF6" />
            )}
            <Text
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#111827' },
              ]}
            >
              {status === 'uploading' ? 'Uploading' : status === 'success' ? 'Success' : 'Error'}
            </Text>
          </View>
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? '#9CA3AF' : '#6B7280' },
            ]}
          >
            {statusText}
          </Text>
          <View
            style={[
              styles.track,
              { backgroundColor: isDark ? '#2D2D3D' : '#E5E7EB' },
            ]}
          >
            <Animated.View
              style={[
                styles.bar,
                barStyle,
                {
                  backgroundColor:
                    status === 'success'
                      ? '#10B981'
                      : status === 'error'
                      ? '#EF4444'
                      : '#8B5CF6',
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    marginHorizontal: 16,
    marginBottom: 100,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});
