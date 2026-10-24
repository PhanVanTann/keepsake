import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

const LENGTH = 6;

export default function AuthOtpScreen() {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const code = digits.join('');
  const canSubmit = code.length === LENGTH;

  function handleChange(text: string, index: number) {
    const value = text.replace(/[^\d]/g, '').slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyPress(e: { nativeEvent: { key: string } }, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 justify-center px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View className="px-4 pt-6">
          <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">BƯỚC 2 · XÁC MINH</Text>
          <Text className="mt-1.5 font-display-extrabold text-[28px] text-ink">Nhập mã 6 số</Text>
          <Text className="mt-2.5 text-[15px] leading-[22.5px] text-muted">
            Đã gửi tới <Text className="font-mono-extrabold text-ink">+84 912 *** 678</Text>.{' '}
            <Text onPress={() => router.back()} className="font-display-bold text-ink underline">
              Đổi số
            </Text>
          </Text>

          <View className="mt-7 flex-row gap-2">
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                className="h-16 flex-1 border-b-[3px] bg-paper text-center font-mono-extrabold text-[28px] text-ink"
                style={{ borderBottomColor: d ? colors.ink : colors.dot }}
              />
            ))}
          </View>

          <Text className="mt-[18px] text-[14px] text-muted">
            Chưa nhận được? Gửi lại sau <Text className="font-mono-extrabold text-ink">00:42</Text>
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/auth/profile-setup')}
          disabled={!canSubmit}
          className="mx-4 mb-12 mt-auto h-14 items-center justify-center rounded-input bg-red"
          style={{ opacity: canSubmit ? 1 : 0.5 }}>
          <Text className="font-display-extrabold text-[16px] text-white">Xác nhận</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
