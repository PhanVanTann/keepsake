import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZigzagEdge } from '@/components/receipt';
import { useCreatePost } from '@/hooks';
import { formatVnd } from '@/lib/money';
import { usePostDraftStore } from '@/store/postDraftStore';
import { colors } from '@/theme/tokens';

export default function PostFailedScreen() {
  const draft = usePostDraftStore();
  const createPost = useCreatePost();
  const isMoment = draft.postType === 'MOMENT';

  async function handleRetry() {
    if (!draft.photoUri) return;
    try {
      await createPost.mutateAsync({
        postType: draft.postType,
        imageUrl: draft.photoUri,
        amount: draft.amount,
        content: draft.content || undefined,
        categoryId: isMoment ? undefined : draft.categoryId,
        locationName: draft.locationName,
        showLocation: draft.showLocation,
        privacy: draft.privacy,
        selectedFriendIds: draft.privacy === 'SELECTED_FRIENDS' ? draft.selectedFriendIds : undefined,
      });
      draft.reset();
      router.dismissTo('/');
      router.push('/feed/mine');
    } catch {
      // vẫn ở màn này, ảnh/số tiền không mất, bấm thử lại tiếp
    }
  }

  function handleQueue() {
    draft.reset();
    router.dismissTo('/');
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[17px] text-ink">Ghi khoản chi</Text>
          <View className="w-11" />
        </View>

        <View className="relative mx-8 mt-8">
          <View className="gap-3.5 bg-paper p-4">
            <View className="h-[170px] overflow-hidden rounded-receipt bg-ink" style={{ opacity: 0.85 }}>
              {draft.photoUri && <Image source={{ uri: draft.photoUri }} style={{ flex: 1 }} contentFit="cover" />}
            </View>
            {!isMoment && (
              <View className="gap-2">
                <Row label="Số tiền" value={formatVnd(draft.amount)} />
                <Row label="Trạng thái" value="Chưa đăng" danger />
              </View>
            )}
          </View>
          <ZigzagEdge width={326} edge="bottom" />
          <View
            style={{ position: 'absolute', left: '50%', top: 70, transform: [{ translateX: -78 }, { rotate: '-10deg' }] }}
            className="rounded-[10px] border-[3px] border-red bg-white/90 px-4 py-2">
            <Text className="font-mono-extrabold text-[20px] tracking-[2px] text-red">CHƯA GỬI ĐƯỢC</Text>
          </View>
        </View>

        <View className="mx-8 mt-7 items-center">
          <Text className="text-center font-display-extrabold text-[22px] text-ink">Đăng bài chưa thành công</Text>
          <Text className="mt-2 text-center text-[15px] leading-[22.5px] text-muted">
            Ảnh và số tiền vẫn được giữ nguyên. Thử lại hoặc để app tự gửi khi mạng ổn hơn.
          </Text>
          <Text className="mt-2.5 font-mono text-[11px] text-placeholder">Mã lỗi: UPLOAD_TIMEOUT</Text>
        </View>

        <View className="mt-auto gap-2.5 px-4 pb-12">
          <Pressable
            onPress={handleRetry}
            disabled={createPost.isPending}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-input bg-red"
            style={{ opacity: createPost.isPending ? 0.6 : 1 }}>
            <RotateCcw size={18} color={colors.paper} />
            <Text className="font-display-bold text-[16px] text-white">
              {createPost.isPending ? 'Đang thử lại…' : 'Thử đăng lại'}
            </Text>
          </Pressable>
          <Pressable onPress={handleQueue} className="h-[54px] items-center justify-center rounded-input border-[1.5px] border-ink">
            <Text className="font-display-bold text-[16px] text-ink">Để vào hàng chờ, tự gửi sau</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text className="font-mono text-[13px] text-ink">{label}</Text>
      <View className="mb-[3px] flex-1 border-b-2 border-dotted border-dot" />
      <Text className={`font-mono-bold text-[13px] ${danger ? 'text-red-dark' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}
