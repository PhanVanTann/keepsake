import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, type BottomNavKey } from '@/components/receipt';
import { PaydayDashboard } from '@/components/expenses/PaydayDashboard';
import { TopUpDashboard } from '@/components/expenses/TopUpDashboard';
import { LoadCount } from '@/components/loading';
import { useCurrentCycle, useDelayedLoading, useIncomes, useSavingGoal, useTransactions } from '@/hooks';
import { colors } from '@/theme/tokens';

export default function ExpensesScreen() {
  const cycle = useCurrentCycle();
  const transactions = useTransactions(cycle.data?.id);
  const incomes = useIncomes(cycle.data?.id);
  const savingGoal = useSavingGoal(cycle.data?.id);

  function handleNavTab(key: BottomNavKey) {
    if (key === 'camera') router.push('/');
    else if (key === 'messages') router.push('/messages');
    else if (key === 'me') router.push('/me');
  }

  const showLoading = useDelayedLoading(cycle.isLoading);
  if (showLoading) return <LoadCount />;
  if (cycle.isLoading || !cycle.data) return null;

  const isPayday = cycle.data.moneyMode === 'PAYDAY';
  const periodLabel = isPayday
    ? `${dayjs(cycle.data.startDate).format('DD.MM')} – ${dayjs(cycle.data.endDate).format('DD.MM')} · NGÀY ${Math.max(1, dayjs().diff(dayjs(cycle.data.startDate), 'day') + 1)}/${dayjs(cycle.data.endDate).diff(dayjs(cycle.data.startDate), 'day') + 1}`
    : `ĐỢT TỪ ${dayjs(cycle.data.startDate).format('DD.MM')} · NGÀY ${Math.max(1, dayjs().diff(dayjs(cycle.data.startDate), 'day') + 1)}`;

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-4">
          <View>
            <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">{periodLabel}</Text>
            <Text className="font-display-extrabold text-[24px] text-ink">Chi tiêu</Text>
          </View>
          <Pressable
            onPress={() => router.push('/expenses/report')}
            className="h-10 flex-row items-center gap-1.5 rounded-input bg-paper px-3.5">
            <Text className="font-display-bold text-[13px] text-ink">Báo cáo</Text>
            <ChevronRight size={16} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 pt-3.5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {isPayday ? (
            <PaydayDashboard
              cycle={cycle.data}
              transactions={transactions.data ?? []}
              incomes={incomes.data ?? []}
              savingGoal={savingGoal.data}
            />
          ) : (
            <TopUpDashboard cycle={cycle.data} transactions={transactions.data ?? []} incomes={incomes.data ?? []} />
          )}
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="expenses" onChange={handleNavTab} />
    </View>
  );
}
