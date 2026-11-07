import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, Ellipsis, MessageCircle } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/receipt';
import { useBlockUser, useFeed, useFriends, useOpenConversationWithFriend } from '@/hooks';
import { formatVnd } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const friends = useFriends();
  const feed = useFeed();
  const openConversation = useOpenConversationWithFriend();
  const blockUser = useBlockUser();

  const friend = friends.data?.find((f) => f.id === id);
  const posts = (feed.data ?? []).filter((p) => p.author.id === id);

  async function handleMessage() {
    const conversation = await openConversation.mutateAsync(id);
    router.push(`/messages/${conversation.id}`);
  }

  function handleOptions() {
    if (!friend) return;
    Alert.alert(friend.displayName, undefined, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: `Chặn ${friend.displayName}`,
        style: 'destructive',
        onPress: () =>
          Alert.alert('Chặn người này?', 'Huỷ kết bạn, hai bên không thấy bài và không nhắn tin được.', [
            { text: 'Huỷ', style: 'cancel' },
            {
              text: 'Chặn',
              style: 'destructive',
              onPress: async () => {
                await blockUser.mutateAsync(friend.id);
                router.back();
              },
            },
          ]),
      },
    ]);
  }

  if (!friend) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[13px] text-muted">Đang tải…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={handleOptions}
            accessibilityLabel="Tuỳ chọn: chặn"
            className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <Ellipsis size={20} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-4 mt-2 gap-3.5 bg-paper p-4">
            <View className="flex-row items-center gap-3.5">
              <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size={64} />
              <View className="flex-1">
                <Text className="font-display-extrabold text-[20px] text-ink">{friend.displayName}</Text>
                <Text className="font-mono text-[13px] text-muted">
                  @{friend.username} · bạn từ {dayjs(friend.friendsSince).format('MM.YYYY')}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleMessage}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-input bg-ink">
                <MessageCircle size={18} color={colors.paper} />
                <Text className="font-display-bold text-[14px] text-white">Nhắn tin</Text>
              </Pressable>
              <View className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-input border-[1.5px] border-line">
                <Check size={18} color={colors.green} strokeWidth={2.4} />
                <Text className="font-display-bold text-[14px] text-muted">Bạn bè</Text>
              </View>
            </View>
          </View>

          <Text className="mx-4 mb-2 mt-[18px] font-mono-bold text-[11px] tracking-[1px] text-muted">
            BÀI ĐÃ CHIA SẺ VỚI BẠN · {posts.length}
          </Text>
          <View className="mx-4 flex-row flex-wrap gap-1.5">
            {posts.map((p) => (
              <Pressable key={p.id} style={{ width: '32%', aspectRatio: 1 }} className="overflow-hidden rounded-receipt bg-ink">
                <Image source={{ uri: p.imageUrl }} style={{ flex: 1 }} contentFit="cover" />
                {p.amount > 0 && (
                  <View className="absolute bottom-1.5 left-1.5 rounded-md bg-paper px-1.5 py-0.5">
                    <Text className="font-mono-extrabold text-[11px] text-ink">{formatVnd(p.amount)}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          {posts.length === 0 && (
            <Text className="mt-4 text-center text-[13px] text-muted">Chưa có bài nào chia sẻ với bạn</Text>
          )}

          <Text className="mx-6 mb-6 mt-3.5 text-center text-[12px] leading-[18px] text-muted">
            Chỉ hiện bài {friend.displayName} cho phép bạn xem. Tổng chi tiêu của bạn bè luôn được giữ kín.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
