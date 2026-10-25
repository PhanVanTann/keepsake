import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudienceSheet } from '@/components/post/AudienceSheet';
import { cn } from '@/lib/cn';
import { categoryIcons } from '@/lib/categoryIcons';
import { formatVnd, groupThousands } from '@/lib/money';
import { PRIVACY_LABEL } from '@/lib/privacy';
import { useCategories, useFriends, usePost, useUpdatePost } from '@/hooks';
import { colors } from '@/theme/tokens';
import type { PostPrivacy } from '@/types';

export default function PostEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const categories = useCategories();
  const friends = useFriends();
  const updatePost = useUpdatePost();

  const [amountText, setAmountText] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [privacy, setPrivacy] = useState<PostPrivacy>('FRIENDS');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);

  useEffect(() => {
    if (!post.data) return;
    setAmountText(String(post.data.amount));
    setContent(post.data.content ?? '');
    setCategoryId(post.data.category?.id);
    setPrivacy(post.data.privacy);
    setSelectedFriendIds(post.data.selectedFriendIds ?? []);
  }, [post.data]);

  const amount = parseInt(amountText || '0', 10);
  const category = categories.data?.find((c) => c.id === categoryId);
  const delta = post.data ? amount - post.data.amount : 0;

  async function handleSave() {
    if (!post.data) return;
    await updatePost.mutateAsync({
      postId: post.data.id,
      patch: { amount, content, privacy, selectedFriendIds, categoryId },
    });
    router.back();
  }

  if (!post.data) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[13px] text-muted">Đang tải…</Text>
      </View>
    );
  }

  const audienceLabel =
    privacy === 'SELECTED_FRIENDS' ? `${selectedFriendIds.length} người` : PRIVACY_LABEL[privacy];

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-3">
          <Pressable onPress={() => router.back()} className="h-11 items-center justify-center rounded-input bg-paper px-3.5">
            <Text className="font-display-bold text-[14px] text-ink">Huỷ</Text>
          </Pressable>
          <Text className="font-display-extrabold text-[17px] text-ink">Sửa bài</Text>
          <Pressable
            onPress={handleSave}
            disabled={updatePost.isPending}
            className="h-11 items-center justify-center rounded-input bg-ink px-[18px]"
            style={{ opacity: updatePost.isPending ? 0.5 : 1 }}>
            <Text className="font-display-extrabold text-[15px] text-white">{updatePost.isPending ? 'Đang lưu…' : 'Lưu'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-4 mt-3 flex-row gap-3">
            <View className="h-[120px] w-[120px] overflow-hidden rounded-receipt bg-ink">
              <Image source={{ uri: post.data.imageUrl }} style={{ flex: 1 }} contentFit="cover" />
            </View>
            <Text className="flex-1 self-center text-[12px] leading-[18px] text-muted">
              Muốn đổi ảnh thì xoá bài rồi chụp lại, để bạn bè không bị "lừa" ảnh cũ 😄
            </Text>
          </View>

          <View className="mx-4 mt-3.5 gap-1 bg-paper p-4">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">SỐ TIỀN</Text>
              <Text className="font-mono-bold text-[11px] text-muted">
                trước: <Text className="line-through">{formatVnd(post.data.amount)}</Text>
              </Text>
            </View>
            <View className="flex-row items-baseline gap-1 border-b-2 border-red">
              <TextInput
                value={amountText ? groupThousands(amount) : ''}
                onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                className="flex-1 font-mono-extrabold text-[36px] text-ink"
              />
              <Text className="font-mono-extrabold text-[24px] text-muted">đ</Text>
            </View>

            <View className="mt-1 border-t-2 border-dotted border-line pt-1">
              <Pressable
                onPress={() => setCategoryPickerOpen((v) => !v)}
                className="h-[50px] flex-row items-center gap-2.5 border-b border-dashed border-line">
                <Text className="flex-1 font-display-bold text-[15px] text-ink">Danh mục</Text>
                <Text className="text-[14px] text-muted">{category?.name}</Text>
                <ChevronRight size={16} color={colors.muted} style={{ transform: [{ rotate: categoryPickerOpen ? '90deg' : '0deg' }] }} />
              </Pressable>

              {categoryPickerOpen && (
                <View className="flex-row flex-wrap gap-2 py-3">
                  {(categories.data ?? []).map((c) => {
                    const Icon = categoryIcons[c.icon] ?? categoryIcons.ellipsis;
                    const active = categoryId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          setCategoryId(c.id);
                          setCategoryPickerOpen(false);
                        }}
                        style={{ width: '23%' }}
                        className={cn('h-[60px] items-center justify-center gap-1 rounded-card', active ? 'bg-ink' : 'bg-chip')}>
                        <Icon size={18} color={active ? colors.paper : colors.ink} />
                        <Text className={cn('text-[11px]', active ? 'font-display-bold text-white' : 'font-display-medium text-ink')}>
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Pressable onPress={() => setAudienceOpen(true)} className="h-[50px] flex-row items-center gap-2.5">
                <Text className="flex-1 font-display-bold text-[15px] text-ink">Ai được xem</Text>
                <Text className="text-[14px] text-muted">{audienceLabel}</Text>
                <ChevronRight size={16} color={colors.muted} />
              </Pressable>
            </View>

            <View className="mt-3">
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">NỘI DUNG</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                className="mt-1.5 h-[72px] rounded-input bg-chip px-3 py-2.5 font-display text-[15px] text-ink"
              />
            </View>
          </View>

          <View className="mx-4 mt-3 gap-1 rounded-input border-2 border-dashed border-dot p-3.5">
            {delta !== 0 && (
              <Text className="text-[13px] leading-[19.5px] text-muted">
                • Sổ chi tự cập nhật: {category?.name}{' '}
                <Text className="font-mono-bold text-ink">
                  {delta > 0 ? '+' : ''}
                  {formatVnd(delta)}
                </Text>
              </Text>
            )}
            <Text className="text-[13px] leading-[19.5px] text-muted">
              • Bạn bè sẽ thấy nhãn nhỏ <Text className="text-ink">"đã sửa"</Text> trên bài
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AudienceSheet
        visible={audienceOpen}
        friends={friends.data ?? []}
        privacy={privacy}
        selectedFriendIds={selectedFriendIds}
        onClose={() => setAudienceOpen(false)}
        onDone={(p, ids) => {
          setPrivacy(p);
          setSelectedFriendIds(ids);
          setAudienceOpen(false);
        }}
      />
    </View>
  );
}
