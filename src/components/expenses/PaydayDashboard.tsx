import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Target, TriangleAlert } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { LeaderRow, MonoLabel, ProgressBar, Receipt } from '@/components/receipt';
import {
  calcAverageDailySpend,
  calcAvailableToSpend,
  calcProjectedEndBalance,
  calcSpendableBudget,
  clampPercent,
  formatVnd,
  sumAmounts,
} from '@/lib/money';
import { breakdownByCategory } from '@/lib/reportStats';
import { colors } from '@/theme/tokens';
import type { ExpenseTransaction, FinancialCycle, Income, SavingGoal } from '@/types';

type PaydayDashboardProps = {
  cycle: FinancialCycle;
  transactions: ExpenseTransaction[];
  incomes: Income[];
  savingGoal?: SavingGoal | null;
};

export function PaydayDashboard({ cycle, transactions, incomes, savingGoal }: PaydayDashboardProps) {
  const today = dayjs();
  const cycleStart = dayjs(cycle.startDate);
  const cycleEnd = dayjs(cycle.endDate ?? cycle.startDate);
  const totalCycleDays = Math.max(1, cycleEnd.diff(cycleStart, 'day') + 1);
  const daysElapsed = Math.min(totalCycleDays, Math.max(1, today.diff(cycleStart, 'day') + 1));

  const totalIncome = sumAmounts(incomes.filter((i) => i.status === 'RECEIVED').map((i) => i.amount));
  const totalExpense = sumAmounts(transactions.map((t) => t.amount));
  const targetRemaining = savingGoal?.targetRemainingAmount ?? 0;

  const spendable = calcSpendableBudget(totalIncome, targetRemaining);
  const available = calcAvailableToSpend(spendable, totalExpense);
  const usedPercent = clampPercent(spendable > 0 ? totalExpense / spendable : 0);
  const dayProgressPercent = clampPercent(daysElapsed / totalCycleDays);

  const avgDailySpend = calcAverageDailySpend(totalExpense, daysElapsed);
  const projectedEnd = calcProjectedEndBalance(totalIncome, avgDailySpend, totalCycleDays);
  const remainingMoney = totalIncome - totalExpense;
  const shortfall = targetRemaining - projectedEnd;
  const goalProgressPercent = clampPercent(targetRemaining > 0 ? projectedEnd / targetRemaining : 0);

  const topCategories = breakdownByCategory(transactions).slice(0, 3);

  return (
    <View className="gap-3">
      {shortfall > 0 && (
        <View
          role="status"
          className="flex-row items-center gap-2.5 rounded-card border-2 border-red bg-red-bg px-3 py-2.5">
          <TriangleAlert size={20} color={colors.redDark} />
          <Text className="flex-1 text-[13px] font-display-semibold leading-[17.5px] text-red-dark">
            Đã dùng {usedPercent}% ngân sách. Giữ nhịp này, cuối kỳ sẽ thiếu {formatVnd(shortfall)} so với mục tiêu.
          </Text>
        </View>
      )}

      <View className="bg-paper p-4">
        <MonoLabel tone="muted">CÒN ĐƯỢC CHI</MonoLabel>
        <Text className="mt-0.5 font-mono-extrabold text-[38px] text-ink">{formatVnd(available)}</Text>

        <View className="mt-3">
          <ProgressBar percent={usedPercent} markerPercent={dayProgressPercent} />
        </View>
        <View className="mt-1.5 flex-row justify-between">
          <Pressable onPress={() => router.push('/expenses/transactions')}>
            <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted underline">
              ĐÃ CHI {formatVnd(totalExpense)}
            </Text>
          </Pressable>
          <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">NGÂN SÁCH {formatVnd(spendable)}</Text>
        </View>

        <View className="my-3 border-t-2 border-dotted border-line" />

        <View className="gap-2">
          <Pressable onPress={() => router.push('/expenses/income')}>
            <LeaderRow label="Tổng thu nhập" value={formatVnd(totalIncome)} valueClassName="text-green underline" />
          </Pressable>
          <LeaderRow label="Tổng chi" value={formatVnd(totalExpense)} />
          <LeaderRow label="Tiền còn lại" value={formatVnd(remainingMoney)} />
          <LeaderRow
            label="Dự kiến cuối kỳ"
            value={formatVnd(projectedEnd)}
            valueClassName={shortfall > 0 ? 'text-red-dark' : 'text-green'}
          />
        </View>

        {targetRemaining > 0 && (
          <View className="mt-3.5 flex-row items-center gap-2.5">
            <Target size={20} color={colors.ink} />
            <View className="flex-1">
              <View className="flex-row justify-between">
                <Text className="font-display-bold text-[13px] text-ink">
                  Mục tiêu giữ lại {formatVnd(targetRemaining)}
                </Text>
                <Text className="font-mono-bold text-[13px] text-ink">{goalProgressPercent}%</Text>
              </View>
              <View className="mt-1.5">
                <ProgressBar percent={goalProgressPercent} height={8} fillColor={colors.green} />
              </View>
            </View>
          </View>
        )}
      </View>

      {topCategories.length > 0 && (
        <Receipt zigzagTop={false} zigzagBottom={false} contentClassName="p-4">
          <View className="flex-row items-baseline justify-between">
            <MonoLabel tone="muted">TOP DANH MỤC</MonoLabel>
          </View>
          <View className="mt-2.5 gap-2.5">
            {topCategories.map((c) => (
              <View key={c.category.id} className="flex-row items-center gap-2.5">
                <Text className="w-[72px] font-display-bold text-[13px] text-ink">{c.category.name}</Text>
                <View className="flex-1">
                  <ProgressBar percent={clampPercent(c.total / topCategories[0].total)} height={8} />
                </View>
                <Text className="w-[92px] text-right font-mono-extrabold text-[13px] text-ink">
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
