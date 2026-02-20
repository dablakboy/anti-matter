import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColorScheme } from '@/lib/useColorScheme';
import { CATEGORIES, AppCategory, type DeviceCompatibility } from '@/types/app';
import { uploadIpaFile, getDownloadUrl, type IpaUploadResult } from '@/lib/ipa-storage';
import {
  uploadAppIcon,
  submitApp,
  fetchDeveloperUsage,
  verifyDeveloperSubscription,
} from '@/lib/app-submission';
import { getDeviceId } from '@/lib/deviceId';
import { DEVELOPER_SUBSCRIPTION_LINK } from '@/lib/support';
import { SubmitProgressModal } from '@/components/SubmitProgressModal';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  User,
  Tag,
  Link,
  Globe,
  Twitter,
  ChevronDown,
  CheckCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  FolderOpen,
  ChevronRight,
  Smartphone,
  Tablet,
  TabletSmartphone,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { addUploadedAppToCache } from '@/lib/uploadedAppsStorage';

interface UploadedIpa {
  path: string;
  signedUrl?: string;
  filename: string;
}

export default function DeveloperScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const queryClient = useQueryClient();

  const [appIcon, setAppIcon] = useState<string | null>(null);
  const [uploadedIconPath, setUploadedIconPath] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [version, setVersion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('games');
  const [uploadedIpa, setUploadedIpa] = useState<UploadedIpa | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceCompatibility>('both');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');
  const [appStoreLink, setAppStoreLink] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const { data: usage, refetch: refetchUsage } = useQuery({
    queryKey: ['developerUsage', deviceId],
    queryFn: () => fetchDeveloperUsage(deviceId!),
    enabled: Boolean(deviceId),
  });

  const canUpload = usage?.canUpload ?? true;
  const verifyMutation = useMutation({
    mutationFn: () => verifyDeveloperSubscription(deviceId!, verifyEmail.trim()),
    onSuccess: () => {
      setShowVerifyModal(false);
      setVerifyEmail('');
      refetchUsage();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your subscription is verified. You now have unlimited uploads.');
    },
    onError: (err: Error) => Alert.alert('Verification failed', err.message),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ uri, filename }: { uri: string; filename: string }) =>
      uploadIpaFile(uri, filename),
    onSuccess: (data: IpaUploadResult, variables) => {
      setUploadedIpa({
        path: data.path,
        signedUrl: data.signedUrl,
        filename: variables.filename,
      });
    },
    onError: (err: Error) => {
      Alert.alert('Upload Failed', err.message);
    },
  });

  const refreshLinkMutation = useMutation({
    mutationFn: (path: string) => getDownloadUrl(path),
    onSuccess: (data, path) => {
      setUploadedIpa((prev) =>
        prev ? { ...prev, signedUrl: data.signedUrl } : null
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      Alert.alert('Failed to get link', err.message);
    },
  });

  const uploadIconMutation = useMutation({
    mutationFn: ({
      uri,
      filename,
      mimeType,
    }: {
      uri: string;
      filename: string;
      mimeType: string;
    }) => uploadAppIcon(uri, filename, mimeType),
    onSuccess: (data) => {
      setUploadedIconPath(data.path);
    },
    onError: (err: Error) => {
      Alert.alert('Icon upload failed', err.message);
    },
  });

  const resetForm = () => {
    setAppIcon(null);
    setUploadedIconPath(null);
    setAppName('');
    setDescription('');
    setDeveloperName('');
    setVersion('');
    setUploadedIpa(null);
    setSelectedDevice('both');
    setSocialTwitter('');
    setSocialWebsite('');
    setAppStoreLink('');
  };

  const submitAppMutation = useMutation({
    mutationFn: () =>
      submitApp({
        name: appName.trim(),
        description: description.trim(),
        developerName: developerName.trim(),
        version: version.trim(),
        category: selectedCategory,
        ipaPath: uploadedIpa!.path,
        device: selectedDevice,
        iconPath: uploadedIconPath ?? undefined,
        socialTwitter: socialTwitter.trim() || undefined,
        socialWebsite: socialWebsite.trim() || undefined,
        appStoreLink: appStoreLink.trim() || undefined,
        deviceId: deviceId ?? undefined,
      }),
    onMutate: () => {
      setProgressVisible(true);
      setProgress(0);
      setProgressStatus('uploading');
      if (progressInterval.current) clearInterval(progressInterval.current);
      progressInterval.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 70) {
            if (progressInterval.current) clearInterval(progressInterval.current);
            return 70;
          }
          return p + 14;
        });
      }, 300);
    },
    onSuccess: (data) => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress(100);
      setProgressStatus('success');
      refetchUsage();
      addUploadedAppToCache({
        id: data.id,
        name: data.name,
        developerName: developerName.trim(),
        version: version.trim(),
        status: data.status,
        createdAt: data.created_at,
      }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['uploadedApps'] });
      setTimeout(() => {
        setProgressVisible(false);
        resetForm();
      }, 1500);
    },
    onError: (err: Error & { code?: string }) => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress(100);
      setProgressStatus('error');
      setTimeout(() => {
        setProgressVisible(false);
        if (err.code === 'SUBSCRIPTION_REQUIRED') {
          // Paywall - don't show generic alert, user sees paywall UI
          return;
        }
        Alert.alert('Submit failed', err.message);
      }, 1500);
    },
  });

  const pickIcon = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAppIcon(asset.uri);
      const filename = asset.fileName ?? `icon-${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      uploadIconMutation.mutate({ uri: asset.uri, filename, mimeType });
    }
  };

  const pickIpaFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const filename = asset.name ?? 'app.ipa';
        if (!filename.toLowerCase().endsWith('.ipa')) {
          Alert.alert('Invalid file', 'Please select an .ipa file');
          return;
        }
        uploadMutation.mutate({ uri: asset.uri, filename });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleCopyLink = async () => {
    if (!uploadedIpa) return;
    let url = uploadedIpa.signedUrl;
    if (!url) {
      try {
        const data = await getDownloadUrl(uploadedIpa.path);
        url = data.signedUrl;
        setUploadedIpa((prev) => (prev ? { ...prev, signedUrl: url } : null));
      } catch {
        Alert.alert('Error', 'Failed to get download link');
        return;
      }
    }
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareLink = async () => {
    if (!uploadedIpa) return;
    let url = uploadedIpa.signedUrl;
    if (!url) {
      try {
        const data = await getDownloadUrl(uploadedIpa.path);
        url = data.signedUrl;
        setUploadedIpa((prev) => (prev ? { ...prev, signedUrl: url } : null));
      } catch {
        Alert.alert('Error', 'Failed to get download link');
        return;
      }
    }
    if (url) {
      await Share.share({
        message: `Download ${uploadedIpa.filename}: ${url}`,
        url,
        title: 'IPA download link',
      });
    }
  };

  const clearIpa = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUploadedIpa(null);
  };

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    WebBrowser.openBrowserAsync(DEVELOPER_SUBSCRIPTION_LINK);
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!canUpload) return;

    if (!appName.trim()) {
      Alert.alert('Error', 'Please enter an app name');
      return;
    }
    if (!developerName.trim()) {
      Alert.alert('Error', 'Please enter developer name');
      return;
    }
    if (!version.trim()) {
      Alert.alert('Error', 'Please enter app version');
      return;
    }
    if (!uploadedIpa) {
      Alert.alert('Error', 'Please upload an IPA file');
      return;
    }

    Alert.alert(
      'Submit App',
      'Your app will be submitted to Supabase and reviewed before being published. This usually takes 24-48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => submitAppMutation.mutate(),
        },
      ]
    );
  };

  const InputField = ({
    icon: Icon,
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
  }) => (
    <View className="mb-4">
      <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </Text>
      <View
        className={`flex-row items-start rounded-2xl px-4 py-3 ${
          isDark ? 'bg-[#16161F]' : 'bg-white'
        }`}
        style={{
          borderWidth: 1,
          borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
        }}
      >
        <Icon size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-900'} ${
            multiline ? 'min-h-[80px]' : ''
          }`}
        />
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50'}`}>
      <SubmitProgressModal
        visible={progressVisible}
        progress={progress}
        status={progressStatus}
      />
      <Modal visible={showVerifyModal} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}
          onPress={() => setShowVerifyModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={`rounded-2xl p-5 ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
          >
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Verify subscription
            </Text>
            <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter the email you used to subscribe
            </Text>
            <TextInput
              value={verifyEmail}
              onChangeText={setVerifyEmail}
              placeholder="email@example.com"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className={`mt-4 rounded-xl px-4 py-3 ${
                isDark ? 'bg-[#2D2D3D] text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowVerifyModal(false)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  isDark ? 'bg-[#2D2D3D]' : 'bg-gray-200'
                }`}
              >
                <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => verifyMutation.mutate()}
                disabled={!verifyEmail.trim() || verifyMutation.isPending}
                className="flex-1 py-3 rounded-xl items-center bg-purple-600"
              >
                {verifyMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">Verify</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <SafeAreaView edges={['top']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Header */}
            <View className="px-5 pt-4 pb-6">
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Developer Portal
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Upload your apps to Anti-Matter
              </Text>
            </View>

            {/* Uploaded Apps */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/uploaded-apps');
              }}
              className={`mx-5 mb-4 flex-row items-center rounded-2xl p-4 ${
                isDark ? 'bg-[#16161F]' : 'bg-white'
              }`}
              style={{
                borderWidth: 1,
                borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
              }}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center bg-purple-500/20">
                <FolderOpen size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1 ml-3">
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Uploaded apps
                </Text>
                <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  View and manage apps you&apos;ve submitted
                </Text>
              </View>
              <ChevronRight size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </Pressable>

            {/* Developer Guidelines */}
            <View
              className={`mx-5 mb-6 rounded-2xl p-4 ${isDark ? 'bg-[#16161F]' : 'bg-white'}`}
              style={{
                borderWidth: 2,
                borderColor: '#8B5CF6',
              }}
            >
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Developer Guidelines
              </Text>
              <Text className={`text-sm mt-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {`• Apps are reviewed within 24-48 hours\n• Ensure your IPA is properly signed\n• Include accurate app information\n• 5 free uploads, then $10/month for unlimited`}
              </Text>
            </View>

            {/* App Icon Picker */}
            <View className="px-5 mb-6">
              <Text
                className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                App Icon
              </Text>
              <Pressable
                onPress={pickIcon}
                className={`w-24 h-24 rounded-2xl items-center justify-center overflow-hidden ${
                  isDark ? 'bg-[#16161F]' : 'bg-white'
                }`}
                style={{
                  borderWidth: 2,
                  borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                  borderStyle: 'dashed',
                }}
              >
                {appIcon ? (
                  <Image
                    source={{ uri: appIcon }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="items-center">
                    <ImageIcon size={28} color={isDark ? '#6B7280' : '#9CA3AF'} />
                    <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Upload
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View className="px-5">
              <InputField
                icon={Tag}
                label="App Name"
                value={appName}
                onChangeText={setAppName}
                placeholder="Enter app name"
              />

              <InputField
                icon={FileText}
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your app..."
                multiline
              />

              <InputField
                icon={User}
                label="Developer Name"
                value={developerName}
                onChangeText={setDeveloperName}
                placeholder="Your name or company"
              />

              <InputField
                icon={Tag}
                label="Version"
                value={version}
                onChangeText={setVersion}
                placeholder="1.0.0"
              />

              {/* Category Picker */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Category
                </Text>
                <Pressable
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  className={`flex-row items-center justify-between rounded-2xl px-4 py-4 ${
                    isDark ? 'bg-[#16161F]' : 'bg-white'
                  }`}
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                  }}
                >
                  <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.name ?? 'Select category'}
                  </Text>
                  <ChevronDown size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </Pressable>
                {showCategoryPicker ? (
                  <View
                    className={`mt-2 rounded-2xl overflow-hidden ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          setSelectedCategory(cat.id);
                          setShowCategoryPicker(false);
                        }}
                        className={`flex-row items-center justify-between px-4 py-3 ${
                          cat.id === selectedCategory
                            ? isDark
                              ? 'bg-purple-500/20'
                              : 'bg-purple-50'
                            : ''
                        }`}
                      >
                        <Text className={isDark ? 'text-white' : 'text-gray-900'}>{cat.name}</Text>
                        {cat.id === selectedCategory ? <CheckCircle size={18} color="#8B5CF6" /> : null}
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* IPA File - Supabase Storage */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  IPA File
                </Text>

                {uploadMutation.isPending ? (
                  <View
                    className={`flex-row items-center rounded-2xl px-4 py-4 ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 2,
                      borderColor: '#8B5CF6',
                      borderStyle: 'solid',
                    }}
                  >
                    <ActivityIndicator size="small" color="#8B5CF6" />
                    <Text className="ml-3 text-purple-500">Uploading to storage...</Text>
                  </View>
                ) : uploadedIpa ? (
                  <View
                    className={`rounded-2xl overflow-hidden ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 2,
                      borderColor: '#10B981',
                      borderStyle: 'solid',
                    }}
                  >
                    <View className="flex-row items-center px-4 py-3">
                      <CheckCircle size={20} color="#10B981" />
                      <Text
                        className="ml-3 flex-1 text-emerald-600 dark:text-emerald-400"
                        numberOfLines={1}
                      >
                        {uploadedIpa.filename} • Stored
                      </Text>
                      <Pressable
                        onPress={clearIpa}
                        hitSlop={8}
                        className="p-1 rounded-full"
                      >
                        <X size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-2 px-4 pb-3 flex-wrap">
                      <Pressable
                        onPress={handleCopyLink}
                        className={`flex-row items-center px-3 py-2 rounded-xl ${
                          isDark ? 'bg-[#2D2D3D]' : 'bg-gray-100'
                        }`}
                      >
                        <Copy size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text
                          className={`ml-2 text-sm font-medium ${
                            linkCopied
                              ? 'text-emerald-500'
                              : isDark
                              ? 'text-gray-300'
                              : 'text-gray-700'
                          }`}
                        >
                          {linkCopied ? 'Copied!' : 'Copy link'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleShareLink}
                        className={`flex-row items-center px-3 py-2 rounded-xl ${
                          isDark ? 'bg-[#2D2D3D]' : 'bg-gray-100'
                        }`}
                      >
                        <ExternalLink size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text
                          className={`ml-2 text-sm font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          Share
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => refreshLinkMutation.mutate(uploadedIpa.path)}
                        disabled={refreshLinkMutation.isPending}
                        className={`flex-row items-center px-3 py-2 rounded-xl ${
                          isDark ? 'bg-[#2D2D3D]' : 'bg-gray-100'
                        }`}
                      >
                        {refreshLinkMutation.isPending ? (
                          <ActivityIndicator size="small" color="#8B5CF6" />
                        ) : (
                          <RefreshCw size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        )}
                        <Text
                          className={`ml-2 text-sm font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          New link
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickIpaFile}
                    disabled={uploadMutation.isPending}
                    className={`flex-row items-center rounded-2xl px-4 py-4 ${
                      isDark ? 'bg-[#16161F]' : 'bg-white'
                    }`}
                    style={{
                      borderWidth: 2,
                      borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                      borderStyle: 'dashed',
                    }}
                  >
                    <Upload size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                    <Text
                      className={`ml-3 flex-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      Select IPA file to upload
                    </Text>
                  </Pressable>
                )}

                {uploadMutation.isError ? (
                  <Text className="text-red-500 text-sm mt-2">
                    {uploadMutation.error?.message}
                  </Text>
                ) : null}
              </View>

              {/* Device compatibility */}
              <View className="mb-4">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Device
                </Text>
                <View className="flex-row gap-3">
                  {(
                    [
                      { id: 'iphone' as const, label: 'iPhone', Icon: Smartphone },
                      { id: 'ipad' as const, label: 'iPad', Icon: Tablet },
                      { id: 'both' as const, label: 'Both', Icon: TabletSmartphone },
                    ] as const
                  ).map(({ id, label, Icon }) => (
                    <Pressable
                      key={id}
                      onPress={() => setSelectedDevice(id)}
                      className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 gap-2 ${
                        selectedDevice === id
                          ? 'bg-purple-500/20'
                          : isDark
                          ? 'bg-[#16161F]'
                          : 'bg-white'
                      }`}
                      style={{
                        borderWidth: 1,
                        borderColor:
                          selectedDevice === id ? '#8B5CF6' : isDark ? '#2D2D3D' : '#E5E7EB',
                      }}
                    >
                      <Icon size={18} color={selectedDevice === id ? '#8B5CF6' : isDark ? '#6B7280' : '#9CA3AF'} />
                      <Text
                        className={`font-medium ${
                          selectedDevice === id
                            ? 'text-purple-500'
                            : isDark
                            ? 'text-gray-400'
                            : 'text-gray-600'
                        }`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Social Links */}
              <Text
                className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                Social Links (Optional)
              </Text>

              <InputField
                icon={Twitter}
                label="Twitter"
                value={socialTwitter}
                onChangeText={setSocialTwitter}
                placeholder="@username"
              />

              <InputField
                icon={Globe}
                label="Website"
                value={socialWebsite}
                onChangeText={setSocialWebsite}
                placeholder="https://yourwebsite.com"
              />

              <InputField
                icon={Link}
                label="App Store Link"
                value={appStoreLink}
                onChangeText={setAppStoreLink}
                placeholder="Original App Store link (if applicable)"
              />

              {/* Upload count */}
              <View
                className={`mt-2 rounded-xl px-4 py-2 flex-row items-center justify-between ${
                  isDark ? 'bg-[#16161F]' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {usage?.isSubscribed
                    ? 'Unlimited uploads (subscribed)'
                    : `${usage?.uploadCount ?? 0}/${usage?.freeLimit ?? 5} free uploads used`}
                </Text>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={submitAppMutation.isPending || !canUpload}
                className="mt-4"
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    opacity: submitAppMutation.isPending || !canUpload ? 0.6 : 1,
                  }}
                >
                  <View className="flex-row items-center justify-center">
                    {submitAppMutation.isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Upload size={20} color="white" />
                    )}
                    <Text className="text-white font-bold text-lg ml-2">
                      {!canUpload
                        ? 'Subscribe to upload'
                        : submitAppMutation.isPending
                        ? 'Submitting...'
                        : 'Submit App'}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Paywall when limit reached */}
              {!canUpload && (
                <View
                  className={`mt-4 rounded-2xl p-4 ${
                    isDark ? 'bg-[#16161F]' : 'bg-white'
                  }`}
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? '#2D2D3D' : '#E5E7EB',
                  }}
                >
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Subscribe for unlimited uploads
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    $10/month unlocks unlimited app uploads on this device.
                  </Text>
                  <Pressable onPress={handleSubscribe} className="mt-4">
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 12, padding: 14, alignItems: 'center' }}
                    >
                      <Text className="text-white font-bold">Subscribe $10/month</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowVerifyModal(true)}
                    className={`mt-3 py-2 items-center ${isDark ? 'bg-[#2D2D3D]' : 'bg-gray-100'} rounded-xl`}
                  >
                    <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      I've subscribed — verify my account
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
