import { router } from 'expo-router';
import { Camera, Ellipsis } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadPrint } from '@/components/loading';
import { ActivityBar } from '@/components/post/ActivityBar';
import { ActivitySheet } from '@/components/post/ActivitySheet';
import { PostCard } from '@/components/post/PostCard';
import { useDelayedLoading, useDeletePost, useMyPosts } from '@/hooks';
import { usePostPager } from '@/hooks/usePostPager';
import { colors } from '@/theme/tokens';

export default function MyPostsScreen() {
  const myPosts = useMyPosts();
  const posts = myPosts.data ?? [];
  const { index, panGesture, stackStyle, pageHeight, onContainerLayout, setIndex } = usePostPager({
    length: posts.length,
    onExitTop: () => router.back(),
  });
  const post = posts[index];
  const [activityOpen, setActivityOpen] = useState(false);
  const deletePost = useDeletePost();

  function handleOpenMenu() {
    if (!post) return;
    Alert.alert('Bài đăng', undefined, [
      { text: 'Sửa bài', onPress: () => router.push(`/post/${post.id}/edit`) },
      {
        text: 'Xoá bài',
        style: 'destructive',
        onPress: () => {
          // Alert thứ nhất cần đóng hẳn (animation) trước khi mở Alert thứ 2,
          // không thì iOS có thể bỏ qua lệnh gọi Alert.alert tiếp theo.
          setTimeout(() => {
            Alert.alert('Xoá bài này?', 'Khoản chi đi kèm (nếu có) cũng sẽ bị xoá theo.', [
              { text: 'Huỷ', style: 'cancel' },
              {
                text: 'Xoá',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deletePost.mutateAsync(post.id);
                    setIndex(0);
                  } catch (e) {
                    Alert.alert('Không xoá được', e instanceof Error ? e.message : 'Thử lại sau nhé.');
                  }
                },
              },
            ]);
          }, 400);
        },
      },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  }

  const showLoading = useDelayedLoading(myPosts.isLoading);
  if (showLoading) return <LoadPrint />;
  if (myPosts.isLoading) return null;

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-bg px-10">
        <Text className="text-center font-display-extrabold text-[18px] text-ink">Bạn chưa có bài nào</Text>
        <Text className="text-center text-[14px] text-muted">Chụp một tấm để bắt đầu sổ chi của bạn.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-4">
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Về camera"
            className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <Camera size={20} color={colors.ink} />
          </Pressable>
          <View className="h-11 items-center justify-center rounded-input bg-paper px-4">
            <Text className="font-display-bold text-[14px] text-ink">Bài của tôi</Text>
          </View>
          <Pressable
            onPress={handleOpenMenu}
            accessibilityLabel="Tuỳ chọn bài đăng"
            className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <Ellipsis size={20} color={colors.ink} />
          </Pressable>
        </View>

        <GestureDetector gesture={panGesture}>
          <View
            className="flex-1 px-4 pt-3"
            style={{ overflow: 'hidden' }}
            onLayout={(e) => onContainerLayout(e.nativeEvent.layout.height)}>
            <Animated.View style={stackStyle}>
              {posts.map((p) => (
                <View key={p.id} style={{ height: pageHeight }}>
                  <PostCard post={p} isMine />
                </View>
              ))}
            </Animated.View>
          </View>
        </GestureDetector>

        <View className="px-4 pb-[46px] pt-3">
          <ActivityBar post={post} onPress={() => setActivityOpen(true)} />
        </View>
      </SafeAreaView>

      <ActivitySheet visible={activityOpen} post={post} onClose={() => setActivityOpen(false)} />
    </View>
  );
}
