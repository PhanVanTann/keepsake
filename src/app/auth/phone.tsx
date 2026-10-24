import { router } from 'expo-router';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export default function AuthPhoneScreen() {
  const [phone, setPhone] = useState('');
  const canSubmit = phone.replace(/\s/g, '').length >= 9;

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 px-3 justify-center">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View className="px-4 pt-6">
          <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">BƯỚC 1 · XÁC MINH</Text>
          <Text className="mt-1.5 font-display-extrabold text-[28px] leading-[33.6px] text-ink">
            Số điện thoại{'\n'}của bạn là gì?
          </Text>
          <Text className="mt-2.5 text-[15px] leading-[22.5px] text-muted">
            Bạn bè có thể tìm bạn bằng số này. Mình sẽ gửi mã 6 số qua SMS.
          </Text>

          <View className="mt-7 h-16 flex-row items-center bg-paper">
            <View className="h-16 flex-row items-center gap-1.5 border-r-2 border-dotted border-line px-3.5">
              <Text className="font-mono-extrabold text-[18px] text-ink">+84</Text>
              <ChevronDown size={14} color={colors.ink} />
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="912 345 678"
              placeholderTextColor={colors.placeholder}
              className="flex-1 px-3.5 font-mono-extrabold text-[22px] text-ink"
            />
          </View>
        </View>

        <View className="mt-auto gap-2.5 px-4 pb-12">
          <Pressable
            onPress={() => router.push('/auth/otp')}
            disabled={!canSubmit}
            className="h-14 items-center justify-center rounded-input bg-red"
            style={{ opacity: canSubmit ? 1 : 0.5 }}>
            <Text className="font-display-extrabold text-[16px] text-white">Gửi mã</Text>
          </Pressable>
          <Text className="text-center text-[12px] text-muted">Có thể mất phí SMS theo nhà mạng</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
