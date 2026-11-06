import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/loading';
import { MonoLabel, ProgressBar } from '@/components/receipt';
import { useCurrentCycle, useDelayedLoading, useTransactions } from '@/hooks';
import { cn } from '@/lib/cn';
import { formatVnd, groupThousands, sumAmounts } from '@/lib/money';
import { breakdownByCategory, breakdownByDay } from '@/lib/reportStats';
import { colors } from '@/theme/tokens';

const TABS = ['Danh mục', 'Ngày', 'Tuần', 'Lịch'] as const;
const VN_SHORT_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function ReportScreen() {
  const cycle = useCurrentCycle();
  const transactions = useTransactions(cycle.data?.id);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Danh mục');

  const categoryBreakdown = useMemo(() => breakdownByCategory(transactions.data ?? []), [transactions.data]);
  const totalExpense = sumAmounts((transactions.data ?? []).map((t) => t.amount));

  const last7Dates = useMemo(() => Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD')), []);
  const daily = useMemo(() => breakdownByDay(transactions.data ?? [], last7Dates), [transactions.data, last7Dates]);
  const maxDay = Math.max(1, ...daily.map((d) => d.total));
  const avgPerDay = Math.round(sumAmounts(daily.map((d) => d.total)) / 7);
  const peakIndex = daily.reduce((best, d, i) => (d.total > daily[best].total ? i : best), 0);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const showLoading = useDelayedLoading(cycle.isLoading || transactions.isLoading);

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
            <Text className="font-display-extrabold text-[20px] text-ink">Báo cáo</Text>
          </View>
        </View>

        <View className="mx-4 mt-3.5 flex-row rounded-card bg-chip2 p-[3px]">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={cn('h-[38px] flex-1 items-center justify-center rounded-[9px]', active && 'bg-paper')}>
                <Text className={cn('text-[13px]', active ? 'font-display-bold text-ink' : 'font-display-semibold text-muted')}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
          {showLoading ? (
            <View className="gap-3 bg-paper p-4">
              <Skeleton width={100} height={12} />
              <Skeleton width="100%" height={10} />
              <Skeleton width="100%" height={10} />
              <Skeleton width="100%" height={10} />
            </View>
          ) : tab === 'Danh mục' ? (
            <View className="bg-paper p-4">
              <View className="flex-row items-baseline justify-between">
                <MonoLabel tone="muted">DANH MỤC</MonoLabel>
                <Text className="font-mono-bold text-[12px] text-ink">Tổng {formatVnd(totalExpense)}</Text>
              </View>
              <View className="mt-3 gap-3">
                {categoryBreakdown.map((c) => (
                  <View key={c.category.id} className="gap-1">
                    <View className="flex-row justify-between">
                      <Text className="font-display-bold text-[13px] text-ink">{c.category.name}</Text>
                      <Text className="font-mono-bold text-[12px] text-muted">
                        {formatVnd(c.total)} · {c.percent}%
                      </Text>
                    </View>
                    <ProgressBar percent={c.percent} height={8} />
                  </View>
                ))}
                {categoryBreakdown.length === 0 && (
                  <Text className="py-4 text-center text-[13px] text-muted">Chưa có khoản chi nào trong chu kỳ này</Text>
                )}
              </View>
            </View>
          ) : (
            <View className="items-center bg-paper p-8">
              <Text className="text-[14px] text-muted">Báo cáo theo "{tab}" sắp có</Text>
            </View>
          )}

          {!showLoading && (
          <View className="mt-3 bg-paper p-4">
            <View className="flex-row items-baseline justify-between">
              <MonoLabel tone="muted">7 NGÀY GẦN NHẤT</MonoLabel>
              <Text className="font-mono-bold text-[12px] text-ink">TB {formatVnd(avgPerDay)}/ngày</Text>
            </View>
            <View className="mt-3 h-[140px] flex-row items-end gap-2.5 border-b-[1.5px] border-ink">
              {daily.map((d, i) => {
                const height = Math.max(4, Math.round((d.total / maxDay) * 120));
                const isPeak = i === peakIndex && d.total > 0;
                const isToday = d.date === todayStr;
                return (
                  <View key={d.date} className="flex-1 items-center">
                    {isPeak && (
                      <Text className="mb-1 font-mono-extrabold text-[10px] text-ink">{groupThousands(d.total)}đ</Text>
                    )}
                    <View
                      style={{ height, backgroundColor: isPeak ? colors.red : isToday ? colors.ink : colors.muted }}
                      className="w-full rounded-t-[3px]"
                    />
                  </View>
                );
              })}
            </View>
            <View className="mt-1.5 flex-row gap-2.5">
              {daily.map((d) => (
                <Text
                  key={d.date}
                  className={cn(
                    'flex-1 text-center font-mono-bold text-[11px]',
                    d.date === todayStr ? 'text-ink' : 'text-muted'
                  )}>
                  {VN_SHORT_WEEKDAYS[dayjs(d.date).day()]}
                </Text>
              ))}
            </View>
          </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
