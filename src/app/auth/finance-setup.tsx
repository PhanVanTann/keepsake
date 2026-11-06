import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { expenseRepo, incomeRepo } from '@/data';
import { useUpdateProfile } from '@/hooks';
import { cn } from '@/lib/cn';
import { groupThousands } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { MoneyMode } from '@/types';

const MODES: Array<{ key: MoneyMode; icon: string; title: string; sub: string }> = [
  { key: 'PAYDAY', icon: '💼', title: 'Đều đặn', sub: 'Có lương mỗi tháng' },
  { key: 'TOP_UP', icon: '🎒', title: 'Lúc có lúc không', sub: 'Bố mẹ gửi, làm thêm…' },
];

export default function FinanceSetupScreen() {
  const updateProfile = useUpdateProfile();
  const [mode, setMode] = useState<MoneyMode>('TOP_UP');
  const [amountText, setAmountText] = useState('');
  const amount = parseInt(amountText || '0', 10);

  async function finish() {
    await updateProfile.mutateAsync({ moneyMode: mode, onboardingCompletedAt: new Date().toISOString() });
    if (amount > 0) {
      try {
        const cycle = await expenseRepo.getCurrentCycle();
        if (cycle) {
          await incomeRepo.addIncome({
            cycleId: cycle.id,
            name: mode === 'PAYDAY' ? 'Lương' : 'Số dư ban đầu',
            amount,
            source: mode === 'PAYDAY' ? 'PART_TIME' : 'OTHER',
            opensNewCycle: false,
          });
        }
      } catch {
        // Không chặn vào app nếu ghi tiền vào lỗi — ghi tay sau ở "Tiền vào" cũng được.
      }
    }
    router.replace('/');
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-6">
          <Text className="font-display-extrabold text-[26px] leading-[31.2px] text-ink">Tiền của bạn về thế nào?</Text>
          <Text className="mt-1.5 text-[14px] text-muted">Chọn để app tính đúng cách. Đổi lại trong Cài đặt được.</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mt-3.5 flex-row gap-2 px-4">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                className={cn(
                  'h-[104px] flex-1 justify-between rounded-card p-3',
                  active ? 'border-[2.5px] border-ink bg-paper' : 'border-[1.5px] border-line bg-chip'
                )}>
                <Text className="text-2xl" style={{ opacity: active ? 1 : 0.7 }}>
                  {m.icon}
                </Text>
                <View>
                  <Text className={cn('text-[15px] text-ink', active ? 'font-display-extrabold' : 'font-display-bold')}>
                    {m.title}
                  </Text>
                  <Text className="text-[12px] text-muted">{m.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mx-4 mt-3.5 gap-3 bg-paper p-4">
          {mode === 'TOP_UP' ? (
            <>
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">BẠN ĐANG CÓ</Text>
              <View className="flex-row items-baseline gap-1 border-b-2 border-ink">
                <TextInput
                  value={amountText ? groupThousands(amount) : ''}
                  onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  className="flex-1 font-mono-extrabold text-[30px] text-ink"
                />
                <Text className="font-mono-extrabold text-[20px] text-muted">đ</Text>
              </View>
            </>
          ) : (
            <>
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">LƯƠNG MỖI THÁNG</Text>
              <View className="flex-row items-baseline gap-1 border-b-2 border-ink">
                <TextInput
                  value={amountText ? groupThousands(amount) : ''}
                  onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  className="flex-1 font-mono-extrabold text-[30px] text-ink"
                />
                <Text className="font-mono-extrabold text-[20px] text-muted">đ</Text>
              </View>
            </>
          )}
        </View>

        <View className="mt-auto gap-1 px-4 pb-8">
          <Pressable
            onPress={finish}
            disabled={updateProfile.isPending}
            className="h-14 items-center justify-center rounded-input bg-red">
            <Text className="font-display-extrabold text-[16px] text-white">
              {updateProfile.isPending ? 'Đang lưu…' : 'Bắt đầu chụp'}
            </Text>
          </Pressable>
          <Pressable onPress={finish} className="h-10 items-center justify-center">
            <Text className="font-display-bold text-[14px] text-muted">Để sau</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
