import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeaderRow, ZigzagEdge } from '@/components/receipt';
import { useDeletePost, usePost, useTransaction } from '@/hooks';
import { formatVnd } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = useTransaction(id);
  const post = usePost(transaction.data?.postId ?? '');
  const deletePost = useDeletePost();

  function handleDelete() {
    if (!transaction.data?.postId) return;
    Alert.alert('Xoá bài này?', 'Khoản chi đi kèm cũng sẽ bị xoá. Không thể hoàn tác.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await deletePost.mutateAsync(transaction.data!.postId!);
          router.back();
        },
      },
    ]);
  }

  if (transaction.isLoading || !transaction.data) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[13px] text-muted">Đang tải…</Text>
      </View>
    );
  }

  const t = transaction.data;
  const reactionSummary = post.data
    ? Array.from(new Set(post.data.reactions.map((r) => r.emoji))).join('')
    : '';

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[17px] text-ink">Chi tiết</Text>
          <View className="w-11" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-4 mt-3">
            <View className="gap-3 bg-paper p-4">
              <View className="flex-row justify-between">
                <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">
                  BIÊN LAI #{t.id.slice(-4).toUpperCase()}
                </Text>
                <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">
                  {dayjs(t.transactionDate).format('DD.MM.YYYY · HH:mm')}
                </Text>
              </View>

              {post.data && (
                <View className="h-[220px] overflow-hidden rounded-receipt bg-ink">
                  <Image source={{ uri: post.data.imageUrl }} style={{ flex: 1 }} contentFit="cover" />
                </View>
              )}

              <Text className="font-mono-extrabold text-[36px] text-ink">{formatVnd(t.amount)}</Text>

              <View className="border-t-2 border-dotted border-line pt-3">
                <View className="gap-2.5">
                  <LeaderRow label="Danh mục" value={t.category.name} />
                  {post.data?.locationName && <LeaderRow label="Nơi" value={post.data.locationName} />}
                  {post.data?.content && <LeaderRow label="Ghi chú" value={post.data.content} />}
                </View>
              </View>

              {post.data && (
                <Pressable
                  onPress={() => router.push('/feed/mine')}
                  className="h-12 flex-row items-center gap-2.5 rounded-input bg-chip px-3">
                  <Text className="flex-1 text-[13px] font-display-semibold text-ink">
                    Đã đăng · {post.data.views.length} người xem
                    {reactionSummary ? ` · ${reactionSummary} ${post.data.reactions.length}` : ''}
                  </Text>
                  <ChevronRight size={16} color={colors.ink} />
                </Pressable>
              )}
            </View>
            <ZigzagEdge width={358} edge="bottom" />
          </View>
        </ScrollView>

        {t.postId && (
          <View className="flex-row gap-2 px-4 pb-[46px] pt-2">
            <Pressable
              onPress={() => router.push(`/post/${t.postId}/edit`)}
              className="h-[54px] flex-1 items-center justify-center rounded-input border-[1.5px] border-ink">
              <Text className="font-display-bold text-[15px] text-ink">Sửa</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              className="h-[54px] flex-1 items-center justify-center rounded-input border-[1.5px] border-red">
              <Text className="font-display-bold text-[15px] text-red-dark">Xoá</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
