import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ZigzagEdge } from '@/components/receipt';
import { friendRepo } from '@/data';
import { usePendingInviteStore } from '@/store/pendingInviteStore';

export default function InviteOpenScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const setPendingInvite = usePendingInviteStore((s) => s.setCode);
  const preview = useQuery({
    queryKey: ['invitePreview', code],
    queryFn: async () => (await friendRepo.getInvitePreview(code)) ?? null,
    enabled: !!code,
  });

  function continueWith(path: '/auth/login' | '/auth/phone') {
    if (code) setPendingInvite(code);
    router.push(path);
  }

  if (preview.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[13px] text-muted">Đang tải…</Text>
      </View>
    );
  }

  if (!preview.data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-bg px-10">
        <Text className="text-center font-display-extrabold text-[18px] text-ink">Link mời không hợp lệ</Text>
        <Text className="text-center text-[14px] text-muted">Link đã hết hạn hoặc không tồn tại.</Text>
      </View>
    );
  }

  const { inviter, expiresAt } = preview.data;
  const daysLeft = Math.max(0, dayjs(expiresAt).diff(dayjs(), 'day'));

  return (
    <View className="flex-1 bg-bg pt-20">
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <View className="mx-8" style={{ transform: [{ rotate: '-2deg' }] }}>
          <View className="items-center gap-3.5 bg-paper p-5">
            <Text className="self-start font-mono-bold text-[11px] tracking-[1px] text-muted">THIỆP MỜI</Text>
            <Avatar name={inviter.displayName} avatarUrl={inviter.avatarUrl} size={84} />
            <View className="items-center">
              <Text className="font-display-extrabold text-[22px] text-ink">{inviter.displayName}</Text>
              <Text className="font-mono text-[13px] text-muted">@{inviter.username}</Text>
            </View>
            <Text className="text-center text-[15px] leading-[22.5px] text-ink">
              mời bạn vào xem nhau tiêu gì mỗi ngày 😄
            </Text>

            <View className="w-full gap-2 border-t-2 border-dotted border-line pt-3">
              <Row label="Hiệu lực" value={daysLeft > 0 ? `còn ${daysLeft} ngày` : 'sắp hết hạn'} />
            </View>
          </View>
          <ZigzagEdge width={326} edge="bottom" />
        </View>

        <View className="mt-auto gap-2 px-4 pb-10">
          <Pressable onPress={() => continueWith('/auth/phone')} className="h-14 items-center justify-center rounded-input bg-red">
            <Text className="font-display-extrabold text-[16px] text-white">Tạo tài khoản & kết bạn</Text>
          </Pressable>
          <Pressable onPress={() => continueWith('/auth/login')} className="h-[50px] items-center justify-center rounded-input border-[1.5px] border-ink">
            <Text className="font-display-bold text-[15px] text-ink">Đã có tài khoản? Đăng nhập</Text>
          </Pressable>
          <Text className="mt-1 text-center text-[12px] leading-[18px] text-muted">
            Đăng nhập xong là thành bạn luôn, không cần chờ đồng ý.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text className="font-mono text-[13px] text-ink">{label}</Text>
      <View className="mb-[3px] flex-1 border-b-2 border-dotted border-dot" />
      <Text className="font-mono-bold text-[13px] text-ink">{value}</Text>
    </View>
  );
}
