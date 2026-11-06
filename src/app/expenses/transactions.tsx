import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ArrowUp, ChevronLeft, Repeat } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadCount } from '@/components/loading';
import { useCurrentCycle, useDelayedLoading, useIncomes, useTransactions } from '@/hooks';
import { categoryIcons } from '@/lib/categoryIcons';
import { cn } from '@/lib/cn';
import { formatVnd, sumAmounts } from '@/lib/money';
import { colors } from '@/theme/tokens';

type Row = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  kind: 'expense' | 'income' | 'recurring';
  date: string;
  icon: string;
};

type Filter = 'all' | 'expense' | 'income' | 'recurring';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi' },
  { key: 'income', label: 'Thu' },
  { key: 'recurring', label: 'Định kỳ' },
];

export default function TransactionsScreen() {
  const cycle = useCurrentCycle();
  const transactions = useTransactions(cycle.data?.id);
  const incomes = useIncomes(cycle.data?.id);
  const [filter, setFilter] = useState<Filter>('all');

  const totalIncome = sumAmounts((incomes.data ?? []).filter((i) => i.status === 'RECEIVED').map((i) => i.amount));
  const totalExpense = sumAmounts((transactions.data ?? []).map((t) => t.amount));

  const rows: Row[] = useMemo(() => {
    const expenseRows: Row[] = (transactions.data ?? []).map((t) => ({
      id: t.id,
      title: t.category.name,
      subtitle:
        t.transactionType === 'RECURRING_EXPENSE'
          ? `${t.category.name} · định kỳ, tự ghi`
          : `${t.category.name} · ${dayjs(t.transactionDate).format('HH:mm')}`,
      amount: -t.amount,
      kind: t.transactionType === 'RECURRING_EXPENSE' ? 'recurring' : 'expense',
      date: t.transactionDate,
      icon: t.category.icon,
    }));

    const incomeRows: Row[] = (incomes.data ?? [])
      .filter((i) => i.status === 'RECEIVED')
      .map((i) => ({
        id: i.id,
        title: i.name,
        subtitle: 'Thu nhập',
        amount: i.amount,
        kind: 'income' as const,
        date: i.createdAt,
        icon: 'arrow-up',
      }));

    return [...expenseRows, ...incomeRows].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions.data, incomes.data]);

  const filteredRows = filter === 'all' ? rows : rows.filter((r) => r.kind === filter);

  const isLoading = cycle.isLoading || transactions.isLoading || incomes.isLoading;
  const showLoading = useDelayedLoading(isLoading);

  const groups = useMemo(() => {
    const byDate = new Map<string, Row[]>();
    for (const row of filteredRows) {
      const key = dayjs(row.date).format('YYYY-MM-DD');
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(row);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, dayRows]) => ({
        date,
        rows: [...dayRows].sort((a, b) => (a.date < b.date ? -1 : 1)),
        net: sumAmounts(dayRows.map((r) => r.amount)),
      }));
  }, [filteredRows]);

  if (showLoading) return <LoadCount />;
  if (isLoading) return null;

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <View>
            {cycle.data && (
              <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">
                {dayjs(cycle.data.startDate).format('DD.MM')} – {dayjs(cycle.data.endDate ?? cycle.data.startDate).format('DD.MM')}
              </Text>
            )}
            <Text className="font-display-extrabold text-[20px] text-ink">Giao dịch</Text>
          </View>
        </View>

        <View className="mt-3.5 flex-row gap-1.5 px-4">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={cn('h-9 items-center justify-center rounded-input px-3.5', active ? 'bg-ink' : 'bg-paper')}>
                <Text className={cn('text-[13px]', active ? 'font-display-bold text-white' : 'font-display-semibold text-ink')}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-3 flex-row gap-2 px-4">
          <View className="flex-1 bg-paper px-3 py-2.5">
            <MonoText>THU</MonoText>
            <Text className="font-mono-extrabold text-[17px] text-green">+{formatVnd(totalIncome)}</Text>
          </View>
          <View className="flex-1 bg-paper px-3 py-2.5">
            <MonoText>CHI</MonoText>
            <Text className="font-mono-extrabold text-[17px] text-ink">-{formatVnd(totalExpense)}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <View key={group.date}>
              <View className="mx-4 mb-1.5 mt-4 flex-row justify-between">
                <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">
                  {dayjs(group.date).isSame(dayjs(), 'day')
                    ? `HÔM NAY · ${dayjs(group.date).format('DD.MM')}`
                    : dayjs(group.date).format('DD.MM')}
                </Text>
                <Text className={cn('font-mono-bold text-[11px]', group.net >= 0 ? 'text-green' : 'text-ink')}>
                  {group.net >= 0 ? '+' : ''}
                  {formatVnd(group.net)}
                </Text>
              </View>
              <View className="mx-4 bg-paper">
                {group.rows.map((row, i) => {
                  const Icon = row.kind === 'income' ? ArrowUp : row.kind === 'recurring' ? Repeat : categoryIcons[row.icon];
                  return (
                    <Pressable
                      key={row.id}
                      onPress={() => row.kind !== 'income' && router.push(`/expenses/transactions/${row.id}`)}
                      className={cn(
                        'flex-row items-center gap-3 px-3 py-2.5',
                        i < group.rows.length - 1 && 'border-b border-dashed border-line'
                      )}>
                      <View
                        className="h-11 w-11 items-center justify-center rounded-receipt"
                        style={{ backgroundColor: row.kind === 'income' ? colors.greenBg : colors.chip }}>
                        {Icon && <Icon size={18} color={row.kind === 'income' ? colors.green : colors.muted} />}
                      </View>
                      <View className="flex-1">
                        <Text className="font-display-bold text-[14px] text-ink">{row.title}</Text>
                        <Text className="text-[12px] text-muted">{row.subtitle}</Text>
                      </View>
                      <Text
                        className={cn(
                          'font-mono-extrabold text-[14px]',
                          row.amount >= 0 ? 'text-green' : 'text-ink'
                        )}>
                        {row.amount >= 0 ? '+' : ''}
                        {formatVnd(row.amount)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {groups.length === 0 && (
            <Text className="mt-10 text-center text-[13px] text-muted">Chưa có giao dịch nào</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MonoText({ children }: { children: string }) {
  return <Text className="font-mono-bold text-[11px] text-muted">{children}</Text>;
}
