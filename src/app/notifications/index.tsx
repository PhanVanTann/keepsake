import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  ArrowUp,
  Bell,
  ChevronLeft,
  Heart,
  MessageCircle,
  TriangleAlert,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDelayedLoading, useMarkNotificationRead, useNotifications } from '@/hooks';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import type { AppNotification, NotificationKind } from '@/types';

const META: Record<NotificationKind, { icon: LucideIcon; bg: string; fg: string; warning?: boolean }> = {
  BUDGET_80_PERCENT: { icon: TriangleAlert, bg: colors.red, fg: colors.paper, warning: true },
  BUDGET_100_PERCENT: { icon: TriangleAlert, bg: colors.red, fg: colors.paper, warning: true },
  BUDGET_EXCEEDED: { icon: TriangleAlert, bg: colors.red, fg: colors.paper, warning: true },
  GOAL_AT_RISK: { icon: TriangleAlert, bg: colors.red, fg: colors.paper, warning: true },
  NEW_MESSAGE: { icon: MessageCircle, bg: colors.chip, fg: colors.muted },
  POST_REPLY: { icon: MessageCircle, bg: colors.chip, fg: colors.muted },
  REACTION: { icon: Heart, bg: '#F6D9D2', fg: '#8A2E1F' },
  FRIEND_REQUEST: { icon: UserPlus, bg: '#E3DAF0', fg: '#4A2F73' },
  FRIEND_REQUEST_ACCEPTED: { icon: UserPlus, bg: colors.greenBg, fg: colors.green },
  INCOME_RECEIVED: { icon: ArrowUp, bg: colors.greenBg, fg: colors.green },
};

export default function NotificationsScreen() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();

  const groups = useMemo(() => {
    const today: AppNotification[] = [];
    const earlier: AppNotification[] = [];
    for (const n of notifications.data ?? []) {
      (dayjs(n.createdAt).isSame(dayjs(), 'day') ? today : earlier).push(n);
    }
    return { today, earlier };
  }, [notifications.data]);

  const showLoading = useDelayedLoading(notifications.isLoading);

  function handleMarkAllRead() {
    for (const n of notifications.data ?? []) {
      if (!n.readAt) markRead.mutate(n.id);
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="flex-1 font-display-extrabold text-[20px] text-ink">Thông báo</Text>
          <Pressable onPress={handleMarkAllRead} className="h-10 items-center justify-center rounded-input px-3">
            <Text className="font-display-bold text-[13px] text-muted">Đọc hết</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {showLoading && <Text className="mt-16 text-center text-[13px] text-muted">Đang tải…</Text>}
          {!notifications.isLoading && (
            <>
              {groups.today.length > 0 && (
                <Group title="HÔM NAY" items={groups.today} onPress={(id) => markRead.mutate(id)} />
              )}
              {groups.earlier.length > 0 && (
                <Group title="TRƯỚC ĐÓ" items={groups.earlier} onPress={(id) => markRead.mutate(id)} />
              )}
              {groups.today.length === 0 && groups.earlier.length === 0 && (
                <View className="mt-16 items-center gap-2 px-10">
                  <Bell size={32} color={colors.muted} />
                  <Text className="text-center text-[14px] text-muted">Chưa có thông báo nào</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Group({
  title,
  items,
  onPress,
}: {
  title: string;
  items: AppNotification[];
  onPress: (id: string) => void;
}) {
  return (
    <View>
      <Text className="mx-4 mb-1.5 mt-4 font-mono-bold text-[11px] tracking-[1px] text-muted">{title}</Text>
      <View className="mx-4 bg-paper">
        {items.map((n, i) => {
          const meta = META[n.kind];
          const unread = !n.readAt;
          return (
            <Pressable
              key={n.id}
              onPress={() => onPress(n.id)}
              className={cn(
                'flex-row gap-3 p-3.5',
                i < items.length - 1 && 'border-b border-dashed border-line',
                unread && meta.warning && 'bg-red-bg'
              )}>
              <View className="h-10 w-10 items-center justify-center rounded-receipt" style={{ backgroundColor: meta.bg }}>
                <meta.icon size={20} color={meta.fg} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-display-semibold text-ink">{n.title}</Text>
                <Text className="mt-0.5 text-[13px] text-muted" numberOfLines={1}>
                  {n.body} · {dayjs(n.createdAt).format('HH:mm')}
                </Text>
              </View>
              {unread && !meta.warning && <View className="mt-1.5 h-2 w-2 rounded-full bg-red" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
