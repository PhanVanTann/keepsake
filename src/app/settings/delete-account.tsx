import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeaderRow, MonoLabel, Receipt } from '@/components/receipt';
import { useFriends, useMyPosts, useRequestAccountDeletion } from '@/hooks';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

export default function DeleteAccountScreen() {
  const myPosts = useMyPosts();
  const friends = useFriends();
  const requestDeletion = useRequestAccountDeletion();
  const [confirmText, setConfirmText] = useState('');

  const deleteDate = dayjs().add(30, 'day').format('DD.MM');
  const canConfirm = confirmText.trim().toUpperCase() === 'XOÁ';

  async function handleDelete() {
    await requestDeletion.mutateAsync();
    Alert.alert(
      'Đã ghi nhận yêu cầu xoá',
      `Tài khoản sẽ xoá vĩnh viễn vào ${deleteDate} nếu bạn không đăng nhập lại trước đó.`,
      [{ text: 'Đã hiểu', onPress: () => router.back() }]
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text className="font-display-extrabold text-[20px] text-ink">Xoá tài khoản</Text>
        </View>

        <View className="mx-4 mt-4">
          <Receipt zigzagTop={false} contentClassName="gap-2.5 p-4">
            <MonoLabel tone="red">XOÁ SAU 30 NGÀY · KHÔI PHỤC ĐƯỢC</MonoLabel>
            <View className="gap-2">
              <LeaderRow label="Bài đăng & ảnh" value={String(myPosts.data?.length ?? 0)} />
              <LeaderRow label="Bạn bè" value={String(friends.data?.length ?? 0)} />
              <LeaderRow label="Sổ chi" value="tất cả chu kỳ" />
              <LeaderRow label="Tin nhắn" value="tất cả" />
            </View>

            <View className="gap-2.5 border-t-2 border-dotted border-line pt-3">
              <View className="flex-row gap-2.5">
                <Text className="w-[58px] font-mono-extrabold text-[12px] text-ink">HÔM NAY</Text>
                <Text className="flex-1 text-[13px] leading-[19px] text-muted">
                  Tài khoản ẩn đi, bạn bè không thấy bạn nữa. Dữ liệu <Text className="text-ink">vẫn giữ nguyên</Text>.
                </Text>
              </View>
              <View className="flex-row gap-2.5">
                <Text className="w-[58px] font-mono-extrabold text-[12px] text-red-dark">{deleteDate}</Text>
                <Text className="flex-1 text-[13px] leading-[19px] text-muted">Xoá vĩnh viễn, không lấy lại được nữa.</Text>
              </View>
            </View>

            <View className="rounded-input bg-green-bg p-3">
              <Text className="text-[13px] leading-[19px] text-[#1F5A3A]">
                <Text className="font-display-bold">Đổi ý?</Text> Chỉ cần đăng nhập lại trước {deleteDate} là khôi phục
                nguyên vẹn.
              </Text>
            </View>
          </Receipt>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="mx-4 mt-5 gap-1.5">
            <Text className="text-[13px] font-display-semibold text-muted">
              Gõ <Text className="font-mono-extrabold text-red-dark">XOÁ</Text> để xác nhận
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              className="h-[52px] rounded-input border-2 border-red bg-paper px-3.5 font-mono-extrabold text-[18px] tracking-[2px] text-ink"
            />
          </View>

          <View className="mt-auto gap-1.5 px-4 pb-10">
            <Pressable
              onPress={handleDelete}
              disabled={!canConfirm || requestDeletion.isPending}
              className={cn('h-[54px] items-center justify-center rounded-input', canConfirm ? 'bg-red' : 'bg-[#E9B5AE]')}>
              <Text className="font-display-extrabold text-[15px] text-white">
                {requestDeletion.isPending ? 'Đang xử lý…' : 'Xoá sau 30 ngày'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.back()} className="h-11 items-center justify-center">
              <Text className="font-display-bold text-[14px] text-ink">Thôi, giữ lại</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
