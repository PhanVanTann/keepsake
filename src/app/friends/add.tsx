import { router } from 'expo-router';
import { QrCode, ScanLine, Search, UserPlus, X } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/receipt';
import { useCreateInviteLink, useFriends, useIncomingFriendRequests, useRespondToFriendRequest } from '@/hooks';
import { colors } from '@/theme/tokens';

export default function FriendAddScreen() {
  const friends = useFriends();
  const requests = useIncomingFriendRequests();
  const respond = useRespondToFriendRequest();
  const createInviteLink = useCreateInviteLink();

  async function handleInviteLink() {
    try {
      const code = await createInviteLink.mutateAsync();
      await Share.share({ message: `Mời bạn dùng Chi Tiêu Nhà — chitieunha://invite/${code}` });
    } catch {
      Alert.alert('Không tạo được link mời', 'Thử lại sau nhé.');
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <X size={20} color={colors.ink} />
          </Pressable>
          <Text className="flex-1 font-display-extrabold text-[20px] text-ink">Thêm bạn bè</Text>
          <View className="h-8 items-center justify-center rounded-md bg-paper px-2.5">
            <Text className="font-mono-extrabold text-[12px] text-ink">
              {friends.isLoading ? '…' : `${friends.data?.length ?? 0} BẠN`}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Pressable
            onPress={() => router.push('/friends/search')}
            className="mx-4 mt-3 h-[50px] flex-row items-center gap-2.5 rounded-input border-[1.5px] border-ink bg-paper px-3.5">
            <Search size={18} color={colors.ink} />
            <Text className="text-[15px] text-placeholder">Tìm bằng số điện thoại hoặc email</Text>
          </Pressable>

          <View className="mx-4 mt-3 flex-row gap-2">
            <Pressable
              onPress={() => router.push('/friends/scan')}
              className="h-[92px] flex-1 items-center justify-center gap-2 rounded-card bg-paper">
              <ScanLine size={26} color={colors.ink} />
              <Text className="font-display-bold text-[13px] text-ink">Quét mã</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/friends/qr')}
              className="h-[92px] flex-1 items-center justify-center gap-2 rounded-card bg-paper">
              <QrCode size={26} color={colors.ink} />
              <Text className="font-display-bold text-[13px] text-ink">Mã của tôi</Text>
            </Pressable>
            <Pressable
              onPress={handleInviteLink}
              disabled={createInviteLink.isPending}
              className="h-[92px] flex-1 items-center justify-center gap-2 rounded-card bg-red"
              style={{ opacity: createInviteLink.isPending ? 0.6 : 1 }}>
              <UserPlus size={26} color={colors.paper} />
              <Text className="font-display-bold text-[13px] text-white">Gửi link mời</Text>
            </Pressable>
          </View>

          {(requests.data ?? []).length > 0 && (
            <>
              <Text className="mx-4 mb-1.5 mt-5 font-mono-bold text-[11px] tracking-[1px] text-muted">
                LỜI MỜI ĐẾN · {requests.data?.length}
              </Text>
              <View className="mx-4 bg-paper">
                {requests.data?.map((r, i) => (
                  <View
                    key={r.id}
                    className={`flex-row items-center gap-2.5 p-3 ${i < (requests.data?.length ?? 0) - 1 ? 'border-b border-dashed border-line' : ''}`}>
                    <Avatar name={r.sender.displayName} avatarUrl={r.sender.avatarUrl} size={40} />
                    <Text className="flex-1 font-display-bold text-[14px] text-ink">{r.sender.displayName}</Text>
                    <Pressable
                      onPress={() => respond.mutate({ requestId: r.id, accept: true })}
                      className="h-9 items-center justify-center rounded-input bg-red px-3">
                      <Text className="font-display-bold text-[13px] text-white">Đồng ý</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => respond.mutate({ requestId: r.id, accept: false })}
                      accessibilityLabel={`Từ chối lời mời của ${r.sender.displayName}`}
                      className="h-9 w-9 items-center justify-center rounded-input bg-chip">
                      <X size={16} color={colors.ink} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text className="mx-4 mt-5 text-center text-[12px] leading-[18px] text-muted">
            App chỉ so số điện thoại để tìm bạn, không lưu danh bạ của bạn.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
