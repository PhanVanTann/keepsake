import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { LeaderRow, MonoLabel, Receipt } from '@/components/receipt';
import { calcAverageDailySpend, calcDailyBudgetUntil, calcRunwayDays, formatVnd, sumAmounts } from '@/lib/money';
import { breakdownByCategory } from '@/lib/reportStats';
import { colors } from '@/theme/tokens';
import type { ExpenseTransaction, FinancialCycle, Income } from '@/types';

type TopUpDashboardProps = {
  cycle: FinancialCycle;
  transactions: ExpenseTransaction[];
  incomes: Income[];
};

export function TopUpDashboard({ cycle, transactions, incomes }: TopUpDashboardProps) {
  const today = dayjs();
  const cycleStart = dayjs(cycle.startDate);
  const daysElapsed = Math.max(1, today.diff(cycleStart, 'day') + 1);

  const incomeReceived = sumAmounts(incomes.filter((i) => i.status === 'RECEIVED').map((i) => i.amount));
  const totalIncome = cycle.carriedOverAmount + incomeReceived;
  const totalExpense = sumAmounts(transactions.map((t) => t.amount));
  const remaining = totalIncome - totalExpense;

  const avgDailySpend = calcAverageDailySpend(totalExpense, daysElapsed);
  const runwayDays = calcRunwayDays(remaining, avgDailySpend);
  const runOutDate = Number.isFinite(runwayDays) ? today.add(runwayDays, 'day') : undefined;

  const expectedIncome = incomes.find((i) => i.status === 'EXPECTED' && i.expectedDate);
  const expectedDate = expectedIncome ? dayjs(expectedIncome.expectedDate) : undefined;
  const daysUntilExpected = expectedDate ? Math.max(0, expectedDate.diff(today, 'day')) : undefined;
  const dailyBudget = daysUntilExpected !== undefined ? calcDailyBudgetUntil(remaining, daysUntilExpected) : undefined;

  const topCategories = breakdownByCategory(transactions).slice(0, 2);

  return (
    <View className="gap-3">
      {expectedDate && runOutDate && (
        <View role="status" className="rounded-card border-2 border-red bg-red-bg px-3 py-2.5">
          <Text className="text-[13px] font-display-semibold leading-[18px] text-red-dark">
            Tốc độ này thì {runOutDate.format('dddd DD.MM')} là cạn ví, mà {expectedDate.format('DD.MM')} tiền mới về
            👀
          </Text>
        </View>
      )}

      <View className="bg-paper p-4">
        <View className="flex-row items-center justify-between">
          <MonoLabel tone="muted">CÒN TRONG VÍ</MonoLabel>
          {Number.isFinite(runwayDays) && (
            <View className="h-[26px] items-center justify-center rounded-md bg-red px-2.5">
              <Text className="font-mono-extrabold text-[12px] text-white">ĐỦ ~{runwayDays} NGÀY</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 font-mono-extrabold text-[38px] text-ink">{formatVnd(remaining)}</Text>

        <View className="my-3 border-t-2 border-dotted border-line" />

        <View className="gap-2">
          {cycle.carriedOverAmount > 0 && (
            <LeaderRow label="Dư đợt trước mang sang" value={formatVnd(cycle.carriedOverAmount)} valueClassName="text-green" />
          )}
          {expectedIncome ? (
            <Pressable onPress={() => router.push('/expenses/income')}>
              <LeaderRow label="Tiền vào đợt này" value={formatVnd(incomeReceived)} valueClassName="text-green underline" />
            </Pressable>
          ) : (
            <LeaderRow label="Tiền vào đợt này" value={formatVnd(incomeReceived)} valueClassName="text-green" />
          )}
          <Pressable onPress={() => router.push('/expenses/transactions')}>
            <LeaderRow label="Đã chi" value={formatVnd(totalExpense)} valueClassName="underline" />
          </Pressable>
          <LeaderRow label="Trung bình/ngày" value={formatVnd(Math.round(avgDailySpend))} />
        </View>

        {dailyBudget !== undefined && (
          <View className="mt-3 rounded-card bg-ink p-3">
            <Text className="text-[13px] text-white">Muốn cầm cự tới {expectedDate?.format('DD.MM')}, mỗi ngày tiêu dưới</Text>
            <Text className="mt-0.5 font-mono-extrabold text-[22px] text-yellow">{formatVnd(dailyBudget)}</Text>
          </View>
        )}
      </View>

      {topCategories.length > 0 && (
        <Receipt zigzagTop={false} zigzagBottom={false} contentClassName="p-4">
          <MonoLabel tone="muted">TIỀN ĐI ĐÂU NHIỀU NHẤT</MonoLabel>
          <View className="mt-2.5 gap-2.5">
            {topCategories.map((c) => (
              <View key={c.category.id} className="flex-row items-center gap-2.5">
                <Text className="w-[70px] font-display-bold text-[13px] text-ink">{c.category.name}</Text>
                <View className="h-2 flex-1 overflow-hidden rounded-[3px] bg-chip">
                  <View
                    style={{ width: `${Math.round((c.total / topCategories[0].total) * 100)}%` }}
                    className="h-2 rounded-[3px] bg-ink"
                  />
                </View>
                <Text className="w-[90px] text-right font-mono-extrabold text-[13px] text-ink">
                  {formatVnd(c.total)}
                </Text>
              </View>
            ))}
          </View>
        </Receipt>
      )}
    </View>
  );
}
