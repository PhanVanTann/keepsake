import dayjs from 'dayjs';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonoLabel, Switch } from '@/components/receipt';
import { useAddIncome, useCurrentCycle } from '@/hooks';
import { cn } from '@/lib/cn';
import { INCOME_SOURCE_META } from '@/lib/incomeSource';
import { groupThousands } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { IncomeSource } from '@/types';

const SOURCES: IncomeSource[] = ['FAMILY', 'PART_TIME', 'SCHOLARSHIP', 'OTHER'];

export default function AddIncomeScreen() {
  const cycle = useCurrentCycle();
  const addIncome = useAddIncome();
  const [amountText, setAmountText] = useState('');
  const [source, setSource] = useState<IncomeSource>('FAMILY');
  const [opensNewCycle, setOpensNewCycle] = useState(cycle.data?.moneyMode === 'TOP_UP');
  const [note, setNote] = useState('');

  const amount = parseInt(amountText || '0', 10);
  const canSubmit = amount > 0 && !!cycle.data;

  async function handleSubmit() {
    if (!canSubmit || !cycle.data) return;
    await addIncome.mutateAsync({
      cycleId: cycle.data.id,
      name: note.trim() || INCOME_SOURCE_META[source].label,
      amount,
      source,
      opensNewCycle,
    });
    router.back();
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <X size={20} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[17px] text-ink">Ghi tiền vào</Text>
          <View className="w-11" />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="mx-4 mt-4 gap-4 bg-paper p-4">
          <View>
            <MonoLabel tone="muted">SỐ TIỀN NHẬN</MonoLabel>
            <View className="flex-row items-baseline gap-1 border-b-2 border-green">
              <Text className="font-mono-extrabold text-[30px] text-green">+</Text>
              <TextInput
                value={amountText ? groupThousands(amount) : ''}
                onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                className="flex-1 font-mono-extrabold text-[38px] text-green"
              />
              <Text className="font-mono-extrabold text-[24px] text-muted">đ</Text>
            </View>
          </View>

          <View>
            <MonoLabel tone="muted" className="mb-1.5">
              TỪ ĐÂU
            </MonoLabel>
            <View className="flex-row gap-1.5">
              {SOURCES.map((s) => {
                const meta = INCOME_SOURCE_META[s];
                const Icon = meta.icon;
                const active = source === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSource(s)}
                    className={cn('h-16 flex-1 items-center justify-center gap-1 rounded-card', active ? 'bg-ink' : 'bg-chip')}>
                    <Icon size={20} color={active ? colors.paper : colors.ink} />
                    <Text className={cn('text-[12px]', active ? 'font-display-bold text-white' : 'font-display-medium text-ink')}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="border-t-2 border-dotted border-line pt-3">
            <View className="h-[52px] flex-row items-center gap-2.5">
              <Text className="flex-1 font-display-bold text-[15px] text-ink">Ngày nhận</Text>
              <View className="h-[38px] items-center justify-center rounded-input border-[1.5px] border-ink px-3">
                <Text className="font-mono-extrabold text-[13px] text-ink">Hôm nay · {dayjs().format('DD.MM')}</Text>
              </View>
            </View>

            <View className="h-[60px] flex-row items-center gap-2.5">
              <View className="flex-1">
                <Text className="font-display-bold text-[15px] text-ink">Mở đợt chi mới</Text>
                <Text className="text-[12px] text-muted">Tiền dư đợt cũ sẽ cộng sang đợt mới</Text>
              </View>
              <Switch value={opensNewCycle} onValueChange={setOpensNewCycle} tone="ink" />
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ghi chú, vd: tiền tháng 11"
              placeholderTextColor={colors.placeholder}
              className="mt-1 h-12 rounded-input bg-chip px-3.5 font-display text-[14px] text-ink"
            />
          </View>
        </View>

        <Text className="mx-6 mt-3.5 text-center text-[13px] text-muted">
          Tiền vào chỉ mình bạn thấy, không đăng lên bảng tin.
        </Text>
        </ScrollView>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || addIncome.isPending}
          className="mx-4 mb-6 mt-3 h-14 items-center justify-center rounded-input bg-green"
          style={{ opacity: !canSubmit || addIncome.isPending ? 0.5 : 1 }}>
          <Text className="font-display-extrabold text-[16px] text-white">
            {addIncome.isPending ? 'Đang ghi…' : 'Ting ting! Ghi vào sổ 💸'}
          </Text>
        </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
