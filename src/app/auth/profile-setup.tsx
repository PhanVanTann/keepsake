import { router } from 'expo-router';
import { Camera as CameraIcon, Check, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export default function ProfileSetupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const canSubmit = displayName.trim().length > 0 && username.trim().length > 0;

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-4">
          <View className="h-1 flex-1 rounded-full bg-ink" />
          <View className="h-1 flex-1 rounded-full bg-line" />
          <Text className="ml-2 font-mono-bold text-[12px] text-muted">1/2</Text>
        </View>

        <View className="px-4 pt-5">
          <Text className="font-display-extrabold text-[28px] leading-[33.6px] text-ink">
            Bạn bè sẽ thấy{'\n'}bạn thế nào?
          </Text>

          <View className="mt-7 items-center">
            <View
              style={{ width: 120, height: 120, borderRadius: 32 }}
              className="items-center justify-center gap-1.5 border-2 border-dashed border-dot bg-paper">
              <CameraIcon size={28} color={colors.muted} />
              <Text className="font-display-bold text-[13px] text-muted">Thêm ảnh</Text>
            </View>
          </View>

          <View className="mt-7 gap-3.5">
            <View className="gap-1.5">
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">TÊN HIỂN THỊ</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Tên của bạn"
                placeholderTextColor={colors.placeholder}
                className="h-[54px] rounded-input bg-paper px-4 font-display-bold text-[17px] text-ink"
              />
            </View>
            <View className="gap-1.5">
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">TÊN NGƯỜI DÙNG</Text>
              <View className="h-[54px] flex-row items-center gap-0.5 rounded-input bg-paper px-4">
                <Text className="font-mono-extrabold text-[16px] text-muted">@</Text>
                <TextInput
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                  placeholder="ten_nguoi_dung"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  className="flex-1 font-mono-extrabold text-[16px] text-ink"
                />
                {username.trim().length > 0 && <Check size={20} color={colors.green} strokeWidth={2.6} />}
              </View>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/auth/finance-setup')}
          disabled={!canSubmit}
          className="mx-4 mb-12 mt-auto h-14 flex-row items-center justify-center gap-2 rounded-input bg-ink"
          style={{ opacity: canSubmit ? 1 : 0.5 }}>
          <Text className="font-display-extrabold text-[16px] text-white">Tiếp</Text>
          <ChevronRight size={18} color={colors.paper} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
