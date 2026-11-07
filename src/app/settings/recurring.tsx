import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronLeft, Repeat } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/loading';
import { categoryIcons } from '@/lib/categoryIcons';
import { cn } from '@/lib/cn';
import {
  useCategories,
  useCreateRecurringTransaction,
  useDelayedLoading,
  useKeyboardVisible,
  useRecurringTransactions,
} from '@/hooks';
import { formatVnd, groupThousands, sumAmounts } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { RecurringKind } from '@/types';

export default function RecurringScreen() {
  const recurring = useRecurringTransactions();
  const categories = useCategories();
  const createRecurring = useCreateRecurringTransaction();
  const items = recurring.data ?? [];
  const total = sumAmounts(items.filter((r) => r.kind === 'EXPENSE').map((r) => r.amount));
  const showLoading = useDelayedLoading(recurring.isLoading);
  const keyboardVisible = useKeyboardVisible();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [kind, setKind] = useState<RecurringKind>('EXPENSE');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [dayText, setDayText] = useState('1');

  const amount = parseInt(amountText || '0', 10);
  const executionDay = Math.min(31, Math.max(1, parseInt(dayText || '1', 10)));
  const canSubmit = name.trim().length > 0 && amount > 0 && (kind === 'INCOME' || !!categoryId);

  function closeForm() {
    setFormOpen(false);
    setName('');
    setAmountText('');
    setKind('EXPENSE');
    setCategoryId(undefined);
    setDayText('1');
  }

  async function handleCreate() {
    if (!canSubmit) return;
    try {
      await createRecurring.mutateAsync({ name: name.trim(), amount, kind, categoryId, executionDay });
      closeForm();
    } catch {
      Alert.alert('Không tạo được khoản định kỳ', 'Thử lại sau nhé.');
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[20px] text-ink">Chi định kỳ</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="mx-4 mt-4 flex-row items-center gap-3 bg-paper px-4 py-3.5">
            <Repeat size={22} color={colors.muted} />
            <Text className="flex-1 text-[13px] leading-[19.5px] text-muted">
              Tự ghi vào sổ đúng ngày, <Text className="text-ink">không cần chụp ảnh</Text> và không hiện lên bảng
              tin.
            </Text>
          </View>

          <View className="mx-4 mb-1.5 mt-5 flex-row justify-between">
            <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">MỖI CHU KỲ</Text>
            <Text className="font-mono-bold text-[11px] text-ink">{formatVnd(total)}</Text>
          </View>
          <View className="mx-4 bg-paper">
            {showLoading && (
              <View className="gap-3 p-3.5">
                <Skeleton width="100%" height={44} />
                <Skeleton width="100%" height={44} />
              </View>
            )}
            {!showLoading && items.map((r, i) => (
              <View
                key={r.id}
                className={`flex-row items-center gap-3 p-3.5 ${i < items.length - 1 ? 'border-b border-dashed border-line' : ''}`}>
                <View className="h-11 w-11 items-center justify-center rounded-input bg-chip">
                  <Text className="font-mono-bold text-[9px] text-muted">NGÀY</Text>
                  <Text className="font-mono-extrabold text-[15px] leading-[15px] text-ink">
                    {String(r.executionDay).padStart(2, '0')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-display-bold text-[15px] text-ink">{r.name}</Text>
                  <Text className="text-[12px] text-muted">
                    {r.category?.name ?? 'Thu nhập'} · lần tới {dayjs(r.nextExecutionDate).format('DD.MM')}
                  </Text>
                </View>
                <Text className={`font-mono-extrabold text-[14px] ${r.kind === 'INCOME' ? 'text-green' : 'text-ink'}`}>
                  {r.kind === 'INCOME' ? '+' : ''}
                  {formatVnd(r.amount)}
                </Text>
              </View>
            ))}
            {!showLoading && items.length === 0 && (
              <Text className="p-4 text-center text-[13px] text-muted">Chưa có khoản định kỳ nào</Text>
            )}
          </View>
          <Text className="mx-4 mt-2.5 text-[12px] leading-[18px] text-muted">
            Sửa một khoản chỉ đổi các lần ghi sau, không đổi số đã ghi trước đó. Tháng không có ngày 31 sẽ ghi vào
            ngày cuối tháng.
          </Text>
        </ScrollView>

        <View className="px-4 pb-10">
          <Pressable onPress={() => setFormOpen(true)} className="h-[54px] items-center justify-center rounded-input bg-ink">
            <Text className="font-display-extrabold text-[15px] text-white">+ Thêm khoản định kỳ</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={closeForm}>
        <Pressable className="flex-1 bg-black/50" onPress={closeForm} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className={
            keyboardVisible
              ? 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[12px] pt-2.5'
              : 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[46px] pt-2.5'
          }>
          <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
          <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Khoản định kỳ mới</Text>

          <View className="mt-3 flex-row gap-1.5">
            {(['EXPENSE', 'INCOME'] as RecurringKind[]).map((k) => (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                className={cn('h-10 flex-1 items-center justify-center rounded-input', kind === k ? 'bg-ink' : 'bg-chip')}>
                <Text className={cn('font-display-bold text-[14px]', kind === k ? 'text-white' : 'text-ink')}>
                  {k === 'EXPENSE' ? 'Chi' : 'Thu'}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={kind === 'EXPENSE' ? 'Tên khoản chi, vd: Tiền nhà' : 'Tên khoản thu, vd: Lương cứng'}
            placeholderTextColor={colors.placeholder}
            className="mt-3 h-12 rounded-input bg-chip px-3.5 font-display text-[15px] text-ink"
          />

          <View className="mt-3 flex-row items-baseline gap-1 border-b-2 border-ink">
            <TextInput
              value={amountText ? groupThousands(amount) : ''}
              onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, ''))}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
              className="flex-1 font-mono-extrabold text-[28px] text-ink"
            />
            <Text className="font-mono-extrabold text-[18px] text-muted">đ</Text>
          </View>

          {kind === 'EXPENSE' && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(categories.data ?? []).map((c) => {
                const Icon = categoryIcons[c.icon] ?? categoryIcons.ellipsis;
                const active = categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    className={cn('h-11 flex-row items-center gap-1.5 rounded-input px-3', active ? 'bg-ink' : 'bg-chip')}>
                    <Icon size={16} color={active ? colors.paper : colors.ink} />
                    <Text className={cn('text-[13px]', active ? 'font-display-bold text-white' : 'font-display-medium text-ink')}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View className="mt-3 flex-row items-center gap-2.5">
            <Text className="flex-1 font-display-bold text-[15px] text-ink">Ngày trong tháng</Text>
            <TextInput
              value={dayText}
              onChangeText={(t) => setDayText(t.replace(/[^\d]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              className="h-10 w-16 rounded-input border-[1.5px] border-ink text-center font-mono-extrabold text-[15px] text-ink"
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!canSubmit || createRecurring.isPending}
            className="mt-4 h-[54px] items-center justify-center rounded-input bg-red"
            style={{ opacity: !canSubmit || createRecurring.isPending ? 0.5 : 1 }}>
            <Text className="font-display-extrabold text-[15px] text-white">
              {createRecurring.isPending ? 'Đang tạo…' : 'Tạo khoản định kỳ'}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
