import { router } from 'expo-router';
import { Camera, ChevronDown, Ellipsis, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadPrint } from '@/components/loading';
import { PostCard } from '@/components/post/PostCard';
import { ReactionBar } from '@/components/post/ReactionBar';
import { ReplyInput } from '@/components/post/ReplyInput';
import { ReportSheet } from '@/components/post/ReportSheet';
import {
  useBlockUser,
  useDelayedLoading,
  useFeed,
  useKeyboardVisible,
  useMarkPostViewed,
  useReactToPost,
  useReplyToPost,
  useReportPost,
} from '@/hooks';
import { usePostPager } from '@/hooks/usePostPager';
import { colors } from '@/theme/tokens';

export default function FeedScreen() {
  const feed = useFeed();
  const posts = feed.data ?? [];
  const { index, panGesture, stackStyle, pageHeight, onContainerLayout, setIndex } = usePostPager({
    length: posts.length,
    onExitTop: () => router.back(),
  });
  const post = posts[index];
  const [reportOpen, setReportOpen] = useState(false);
  const keyboardVisible = useKeyboardVisible();

  const reactToPost = useReactToPost();
  const replyToPost = useReplyToPost();
  const markViewed = useMarkPostViewed();
  const reportPost = useReportPost();
  const blockUser = useBlockUser();

  useEffect(() => {
    if (post) markViewed.mutate(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const showLoading = useDelayedLoading(feed.isLoading);
  if (showLoading) return <LoadPrint />;
  if (feed.isLoading) return null;

  if (posts.length === 0) {
    return <EmptyFeed />;
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
          <View className="h-11 flex-row items-center gap-1.5 rounded-input bg-paper px-4">
            <Text className="font-display-bold text-[14px] text-ink">Tất cả bạn bè</Text>
            <ChevronDown size={16} color={colors.ink} />
          </View>
          <Pressable
            onPress={() => setReportOpen(true)}
            accessibilityLabel="Tuỳ chọn bài đăng"
            className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <Ellipsis size={20} color={colors.ink} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <GestureDetector gesture={panGesture}>
            <View
              className="flex-1 px-4 pt-3"
              style={{ overflow: 'hidden' }}
              onLayout={(e) => onContainerLayout(e.nativeEvent.layout.height)}>
              <Animated.View style={stackStyle}>
                {posts.map((p) => (
                  <View key={p.id} style={{ height: pageHeight }}>
                    <PostCard post={p} />
                  </View>
                ))}
              </Animated.View>
            </View>
          </GestureDetector>

          <View
            className={
              keyboardVisible ? 'gap-2 px-4 pb-[12px] pt-3' : 'gap-2 px-4 pb-[46px] pt-3'
            }>
            <ReactionBar myReaction={post.myReaction} onReact={(emoji) => reactToPost.mutate({ postId: post.id, emoji })} />
            <ReplyInput
              friendName={post.author.displayName}
              sending={replyToPost.isPending}
              onSend={(text) => replyToPost.mutate({ friendId: post.author.id, content: text, referencedPostId: post.id })}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ReportSheet
        visible={reportOpen}
        authorName={post.author.displayName}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, alsoBlock) => {
          await reportPost.mutateAsync({ postId: post.id, reason });
          if (alsoBlock) {
            await blockUser.mutateAsync(post.author.id);
            setIndex(0);
          }
          setReportOpen(false);
          Alert.alert(alsoBlock ? 'Đã báo cáo và chặn' : 'Đã gửi báo cáo', 'Cảm ơn bạn đã cho chúng tôi biết.');
        }}
      />
    </View>
  );
}

function EmptyFeed() {
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
          <Text className="font-display-extrabold text-[17px] text-ink">Bảng tin</Text>
          <View className="w-11" />
        </View>

        <View className="mt-10 items-center px-10">
          <Text className="text-center font-display-extrabold text-[22px] text-ink">Bảng tin còn trống</Text>
          <Text className="mt-2 text-center text-[15px] leading-[22.5px] text-muted">
            Thêm bạn bè để xem họ tiêu gì mỗi ngày. Bài của bạn cũng sẽ hiện cho họ.
          </Text>
        </View>

        <View className="mt-auto gap-2.5 px-4 pb-8">
          <View className="h-[54px] flex-row items-center justify-center gap-2 rounded-input bg-red">
            <UserPlus size={18} color={colors.paper} />
            <Text className="font-display-bold text-[16px] text-white">Thêm bạn bè</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
