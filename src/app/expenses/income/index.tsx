import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmIncomeModal } from '@/components/expenses/ConfirmIncomeModal';
import { Skeleton } from '@/components/loading';
import { useConfirmIncome, useCurrentCycle, useDelayedLoading, useIncomes, useTransactions } from '@/hooks';
import { INCOME_SOURCE_META } from '@/lib/incomeSource';
import { formatVnd, sumAmounts } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function IncomeScreen() {
  const cycle = useCurrentCycle();
  const incomes = useIncomes(cycle.data?.id);
  const transactions = useTransactions(cycle.data?.id);
  const confirmIncome = useConfirmIncome();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const received = (incomes.data ?? []).filter((i) => i.status === 'RECEIVED');
  const totalReceived = sumAmounts(received.map((i) => i.amount));
  const totalExpense = sumAmounts((transactions.data ?? []).map((t) => t.amount));
  const walletRemaining = totalReceived - totalExpense;

  const dueExpected = (incomes.data ?? []).find(
    (i) =>
      i.status === 'EXPECTED' &&
      i.expectedDate &&
      !dayjs(i.expectedDate).isAfter(dayjs(), 'day') &&
      i.id !== dismissedId
  );

  const bySource = received.reduce<Record<string, number>>((acc, i) => {
    acc[i.source] = (acc[i.source] ?? 0) + i.amount;
    return acc;
  }, {});

  const showLoading = useDelayedLoading(cycle.isLoading || incomes.isLoading || transactions.isLoading);

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <View>
            <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">
              {cycle.data?.moneyMode === 'TOP_UP' ? 'KIỂU: LÚC CÓ LÚC KHÔNG' : 'KIỂU: ĐỀU ĐẶN'}
            </Text>
            <Text className="font-display-extrabold text-[20px] text-ink">Tiền vào</Text>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="mx-4 mt-3.5 bg-ink p-4">
            <Text className="font-mono-bold text-[11px] tracking-[1px] text-[#B7BCC4]">
              {cycle.data ? `CHU KỲ NÀY · TỪ ${dayjs(cycle.data.startDate).format('DD.MM')}` : 'CHU KỲ NÀY'}
            </Text>
            {showLoading ? (
              <Skeleton width={160} height={30} style={{ marginTop: 6 }} />
            ) : (
              <Text className="mt-1 font-mono-extrabold text-[34px] text-[#7FD3A6]">+{formatVnd(totalReceived)}</Text>
            )}

            {Object.keys(bySource).length > 0 && (
              <>
                <View className="mt-2.5 flex-row gap-1.5 overflow-hidden rounded-[3px]">
                  {Object.entries(bySource).map(([source, amount]) => (
                    <View
                      key={source}
                      style={{ width: `${Math.max(4, Math.round((amount / totalReceived) * 100))}%`, height: 8, backgroundColor: INCOME_SOURCE_META[source as keyof typeof INCOME_SOURCE_META].fg }}
                    />
                  ))}
                </View>
                <View className="mt-2 flex-row flex-wrap gap-x-3.5 gap-y-1">
                  {Object.entries(bySource).map(([source, amount]) => (
                    <View key={source} className="flex-row items-center gap-1.5">
                      <View
                        style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: INCOME_SOURCE_META[source as keyof typeof INCOME_SOURCE_META].fg }}
                      />
                      <Text className="text-[12px] text-[#E1E4E8]">
                        {INCOME_SOURCE_META[source as keyof typeof INCOME_SOURCE_META].label}{' '}
                        {Math.round((amount / totalReceived) * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <Text className="mx-4 mb-1.5 mt-4 font-mono-bold text-[11px] tracking-[1px] text-muted">ĐÃ NHẬN</Text>
          <View className="mx-4 bg-paper">
            {showLoading && (
              <View className="gap-3 p-3.5">
                <Skeleton width="100%" height={40} />
                <Skeleton width="100%" height={40} />
              </View>
            )}
            {!showLoading && received.length === 0 && (
              <Text className="px-3 py-4 text-center text-[13px] text-muted">Chưa ghi khoản tiền vào nào</Text>
            )}
            {!showLoading && received.map((income, i) => {
              const meta = INCOME_SOURCE_META[income.source];
              const Icon = meta.icon;
              return (
                <View
                  key={income.id}
                  className={`flex-row items-center gap-3 px-3.5 py-3 ${i < received.length - 1 ? 'border-b border-dashed border-line' : ''}`}>
                  <View className="h-10 w-10 items-center justify-center rounded-receipt" style={{ backgroundColor: meta.bg }}>
                    <Icon size={20} color={meta.fg} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display-bold text-[15px] text-ink">{income.name}</Text>
                    <Text className="text-[12px] text-muted">
                      {dayjs(income.createdAt).format('DD.MM')}
                      {income.opensNewCycle ? ' · mở đợt mới' : ''}
                    </Text>
                  </View>
                  <Text className="font-mono-extrabold text-[14px] text-green">+{formatVnd(income.amount)}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-4 pb-[46px] pt-2">
          <Pressable
            onPress={() => router.push('/expenses/income/new')}
            className="h-14 items-center justify-center rounded-input bg-ink">
            <Text className="font-display-extrabold text-[15px] text-white">Ting ting! Ghi tiền vào</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {dueExpected && (
        <ConfirmIncomeModal
          visible
          income={dueExpected}
          walletRemaining={walletRemaining}
          onReceived={(amount) => confirmIncome.mutate({ incomeId: dueExpected.id, status: 'RECEIVED', amount })}
          onAskLater={() => setDismissedId(dueExpected.id)}
          onSkip={() => confirmIncome.mutate({ incomeId: dueExpected.id, status: 'SKIPPED' })}
        />
      )}
    </View>
  );
}
