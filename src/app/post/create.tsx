import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, MapPin, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadStamp } from '@/components/loading';
import { AudienceSheet } from '@/components/post/AudienceSheet';
import { MonoLabel, Switch, ZigzagEdge } from '@/components/receipt';
import { useCategories, useCreatePost, useCurrentCycle, useFriends, useTransactions, useUpdateProfile } from '@/hooks';
import { categoryIcons } from '@/lib/categoryIcons';
import { cn } from '@/lib/cn';
import { groupThousands } from '@/lib/money';
import { PRIVACY_LABEL } from '@/lib/privacy';
import { usePostDraftStore } from '@/store/postDraftStore';
import { colors } from '@/theme/tokens';

const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000];

export default function CreatePostScreen() {
  const draft = usePostDraftStore();
  const categories = useCategories();
  const friends = useFriends();
  const cycle = useCurrentCycle();
  const transactions = useTransactions(cycle.data?.id);
  const createPost = useCreatePost();
  const updateProfile = useUpdateProfile();
  const [audienceOpen, setAudienceOpen] = useState(false);
  const leftEarlyRef = useRef(false);

  useEffect(() => {
    if (draft.categoryId || draft.postType !== 'EXPENSE') return;
    // `transactions` vẫn là mock (đợt 4 mới nối thật) nên category.id của nó có thể không khớp
    // category thật từ Supabase — chỉ dùng "dùng gần nhất" khi id đó tồn tại trong danh sách thật.
    const realIds = new Set((categories.data ?? []).map((c) => c.id));
    const lastUsed = transactions.data?.[0]?.category.id;
    const fallback = categories.data?.[0]?.id;
    const next = lastUsed && realIds.has(lastUsed) ? lastUsed : fallback;
    if (next) draft.setCategoryId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.data, categories.data, draft.postType]);

  const isMoment = draft.postType === 'MOMENT';
  const canSubmit = isMoment ? !!draft.photoUri : !!draft.photoUri && draft.amount > 0 && !!draft.categoryId;

  async function handleSubmit() {
    if (!canSubmit || !draft.photoUri || createPost.isPending) return;
    leftEarlyRef.current = false;
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
      if (!leftEarlyRef.current) {
        // dismissTo thẳng tới /feed/mine không dọn được /post/preview bên dưới vì màn đó chưa
        // từng có trong stack — phải về root trước (dọn hết preview/create) rồi mới push lên,
        // để vuốt xuống ở Bài của tôi quay đúng về Camera thay vì lại hiện màn preview cũ.
        router.dismissTo('/');
        router.push('/feed/mine');
      }
    } catch {
      if (!leftEarlyRef.current) router.push('/post/failed');
    }
  }

  function handleGoToCameraWhilePosting() {
    leftEarlyRef.current = true;
    router.dismissTo('/');
  }

  const audienceLabel =
    draft.privacy === 'SELECTED_FRIENDS'
      ? `${draft.selectedFriendIds.length} người`
      : PRIVACY_LABEL[draft.privacy];

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center justify-between px-3">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[17px] text-ink">Đăng ảnh</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || createPost.isPending}
            accessibilityLabel="Gửi"
            className="h-11 w-11 items-center justify-center rounded-full bg-red"
            style={{ opacity: !canSubmit || createPost.isPending ? 0.5 : 1 }}>
            <Send size={20} color={colors.paper} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mx-4 mt-3 flex-row gap-3">
          <View className="h-[132px] w-[132px] overflow-hidden rounded-receipt bg-ink">
            {draft.photoUri && <Image source={{ uri: draft.photoUri }} style={{ flex: 1 }} contentFit="cover" />}
          </View>
          <TextInput
            value={draft.content}
            onChangeText={draft.setContent}
            placeholder="Viết gì đó… (không bắt buộc)"
            placeholderTextColor={colors.placeholder}
            multiline
            className="flex-1 rounded-input bg-paper p-3 font-display text-[15px] text-ink"
          />
        </View>

        <ScrollView className="mt-3 flex-1" showsVerticalScrollIndicator={false}>
          <ZigzagEdge width={358} edge="top" style={{ marginHorizontal: 16 }} />
          <View className="mx-4 gap-0 bg-paper px-0 pb-6">
            <View className="flex-row items-center gap-3 border-b-2 border-dotted border-line px-4 py-4">
              <Text className="text-[22px]">📸</Text>
              <View className="flex-1">
                <Text className="font-display-extrabold text-[15px] text-ink">Chỉ chia sẻ khoảnh khắc</Text>
                <Text className="text-[12px] text-muted">Không ghi tiền, không vào sổ chi</Text>
              </View>
              <Switch
                value={isMoment}
                onValueChange={(v) => {
                  draft.setPostType(v ? 'MOMENT' : 'EXPENSE');
                  updateProfile.mutate({ lastMomentToggle: v });
                }}
                tone="red"
              />
            </View>

            {!isMoment && (
              <View className="gap-3 px-4 pt-3">
                <View>
                  <MonoLabel tone="muted">SỐ TIỀN</MonoLabel>
                  <View className="mt-0.5 flex-row items-baseline gap-1">
                    <TextInput
                      value={draft.amount > 0 ? groupThousands(draft.amount) : ''}
                      onChangeText={(text) => {
                        const digits = text.replace(/[^\d]/g, '');
                        draft.setAmount(digits ? parseInt(digits, 10) : 0);
                      }}
                      placeholder="0"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="number-pad"
                      className="flex-1 font-mono-extrabold text-[40px] text-ink"
                    />
                    <Text className="font-mono-extrabold text-[28px] text-muted">đ</Text>
                  </View>
                </View>

                <View className="flex-row gap-1.5">
                  {QUICK_AMOUNTS.map((inc) => (
                    <Pressable
                      key={inc}
                      onPress={() => draft.setAmount(draft.amount + inc)}
                      className="h-[34px] items-center justify-center rounded-input bg-chip px-3">
                      <Text className="font-mono-bold text-[13px] text-ink">+{inc / 1000}k</Text>
                    </Pressable>
                  ))}
                </View>

                <View className="border-t-2 border-dotted border-line pt-3">
                  <MonoLabel tone="muted" className="mb-2">
                    DANH MỤC
                  </MonoLabel>
                  <View className="flex-row flex-wrap gap-2">
                    {(categories.data ?? []).map((cat) => {
                      const Icon = categoryIcons[cat.icon] ?? categoryIcons.ellipsis;
                      const active = draft.categoryId === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => draft.setCategoryId(cat.id)}
                          style={{ width: '23%' }}
                          className={cn(
                            'h-[60px] items-center justify-center gap-1 rounded-card border-2',
                            active ? 'border-ink bg-ink' : 'border-chip bg-chip'
                          )}>
                          <Icon size={20} color={active ? colors.paper : colors.ink} />
                          <Text
                            className={cn(
                              'text-[12px]',
                              active ? 'font-display-bold text-white' : 'font-display-medium text-ink'
                            )}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {isMoment && (
              <View className="mx-4 mt-3.5 flex-row gap-3 rounded-input bg-red-bg p-3.5">
                <Text className="text-[26px]">✨</Text>
                <Text className="flex-1 text-[13px] leading-[19px] text-red-dark">
                  Ảnh này chỉ để khoe với bạn bè thôi. Không có con dấu tiền, không tính vào chi tiêu.
                </Text>
              </View>
            )}

            <View className="mt-1 flex-row items-center gap-3 px-4 py-3.5">
              <MapPin size={20} color={colors.muted} />
              <View className="flex-1">
                <Text className="font-display-bold text-[15px] text-ink">Hiện vị trí</Text>
                {draft.showLocation && draft.locationName && (
                  <Text className="text-[12px] text-muted">{draft.locationName}</Text>
                )}
              </View>
              <Switch value={draft.showLocation} onValueChange={draft.setShowLocation} tone="ink" />
            </View>

            <Pressable
              onPress={() => setAudienceOpen(true)}
              className="flex-row items-center gap-3 px-4 py-3.5">
              <Text className="font-display-bold text-[15px] text-ink flex-1">Ai được xem</Text>
              <Text className="text-[14px] font-display-semibold text-muted">{audienceLabel}</Text>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AudienceSheet
        visible={audienceOpen}
        friends={friends.data ?? []}
        privacy={draft.privacy}
        selectedFriendIds={draft.selectedFriendIds}
        onClose={() => setAudienceOpen(false)}
        onDone={(privacy, ids) => {
          draft.setPrivacy(privacy);
          draft.setSelectedFriendIds(ids);
          setAudienceOpen(false);
        }}
      />

      <LoadStamp
        visible={createPost.isPending && !leftEarlyRef.current}
        photoUri={draft.photoUri}
        onGoToCamera={handleGoToCameraWhilePosting}
      />
    </View>
  );
}
