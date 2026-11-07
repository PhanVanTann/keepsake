import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Bell, ChevronRight, Image as ImageIcon, MessageCircle, Pencil, QrCode, Search, Settings, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, BottomNav, type BottomNavKey } from '@/components/receipt';
import { Skeleton } from '@/components/loading';
import {
  useCreateInviteLink,
  useCurrentCycle,
  useDelayedLoading,
  useFeed,
  useFriends,
  useIncomingFriendRequests,
  useMyPosts,
  useOpenConversationWithFriend,
  useProfile,
  useRespondToFriendRequest,
  useTransactions,
  useUpdateProfile,
  useKeyboardVisible,
  useUploadAvatar,
} from '@/hooks';
import { formatVnd, sumAmounts } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function MeScreen() {
  const profile = useProfile();
  const myPosts = useMyPosts();
  const friends = useFriends();
  const requests = useIncomingFriendRequests();
  const respond = useRespondToFriendRequest();
  const cycle = useCurrentCycle();
  const transactions = useTransactions(cycle.data?.id);
  const feed = useFeed();
  const openConversation = useOpenConversationWithFriend();
  const createInviteLink = useCreateInviteLink();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const totalExpense = sumAmounts((transactions.data ?? []).map((t) => t.amount));
  const showHeaderLoading = useDelayedLoading(profile.isLoading || myPosts.isLoading || friends.isLoading);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const keyboardVisible = useKeyboardVisible();

  function openEdit() {
    if (!profile.data) return;
    setEditName(profile.data.displayName);
    setEditUsername(profile.data.username);
    setEditOpen(true);
  }

  async function saveEdit() {
    const displayName = editName.trim();
    const username = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!displayName || !username) return;
    try {
      await updateProfile.mutateAsync({ displayName, username });
      setEditOpen(false);
    } catch (e) {
      const message =
        e instanceof Error && e.message.toLowerCase().includes('duplicate')
          ? 'Username này đã có người dùng, thử tên khác nhé.'
          : 'Thử lại sau nhé.';
      Alert.alert('Không lưu được', message);
    }
  }

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền thư viện ảnh', 'Cấp quyền trong Cài đặt máy để đổi ảnh đại diện.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const url = await uploadAvatar.mutateAsync(result.assets[0].uri);
      await updateProfile.mutateAsync({ avatarUrl: url });
    } catch {
      Alert.alert('Không đổi được ảnh', 'Thử lại sau nhé.');
    }
  }

  const lastPostByFriend = new Map<string, string>();
  for (const post of feed.data ?? []) {
    const existing = lastPostByFriend.get(post.author.id);
    if (!existing || post.createdAt > existing) lastPostByFriend.set(post.author.id, post.createdAt);
  }

  function handleNavTab(key: BottomNavKey) {
    if (key === 'camera') router.push('/');
    else if (key === 'expenses') router.push('/expenses');
    else if (key === 'messages') router.push('/messages');
  }

  async function handleMessageFriend(friendId: string) {
    const conversation = await openConversation.mutateAsync(friendId);
    router.push(`/messages/${conversation.id}`);
  }

  async function handleInvite() {
    if (!profile.data) return;
    try {
      const code = await createInviteLink.mutateAsync();
      await Share.share({
        message: `${profile.data.displayName} mời bạn dùng Chi Tiêu Nhà — chitieunha://invite/${code}`,
      });
    } catch {
      Alert.alert('Không tạo được link mời', 'Thử lại sau nhé.');
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="mx-4 mt-2 bg-paper p-4">
            <View className="flex-row items-center gap-3.5">
              <Pressable onPress={openEdit} className="flex-1 flex-row items-center gap-3.5">
                <Avatar name={profile.data?.displayName ?? '?'} avatarUrl={profile.data?.avatarUrl} size={64} />
                <View className="flex-1 gap-1.5">
                  {showHeaderLoading ? (
                    <>
                      <Skeleton width="50%" height={16} />
                      <Skeleton width="35%" height={12} />
                    </>
                  ) : (
                    <>
                      <View className="flex-row items-center gap-1.5">
                        <Text className="font-display-extrabold text-[20px] text-ink">{profile.data?.displayName}</Text>
                        <Pencil size={14} color={colors.muted} />
                      </View>
                      <Text className="font-mono text-[13px] text-muted">@{profile.data?.username}</Text>
                    </>
                  )}
                </View>
              </Pressable>
              <Pressable
                onPress={() => router.push('/notifications')}
                accessibilityLabel="Thông báo"
                className="h-11 w-11 items-center justify-center rounded-input bg-chip">
                <Bell size={20} color={colors.ink} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings')}
                accessibilityLabel="Cài đặt"
                className="h-11 w-11 items-center justify-center rounded-input bg-chip">
                <Settings size={20} color={colors.ink} />
              </Pressable>
            </View>

            <View className="mt-3.5 flex-row border-t-2 border-dotted border-line pt-3">
              <Stat loading={showHeaderLoading} value={String(myPosts.data?.length ?? 0)} label="bài đăng" />
              <Stat loading={showHeaderLoading} value={String(friends.data?.length ?? 0)} label="bạn bè" />
              <Stat loading={showHeaderLoading || transactions.isLoading} value={formatVnd(totalExpense)} label="chi kỳ này" />
            </View>

            {(myPosts.data?.length ?? 0) > 0 && (
              <Pressable
                onPress={() => router.push('/feed/mine')}
                className="mt-3 h-12 flex-row items-center gap-2.5 rounded-input bg-chip px-3.5">
                <ImageIcon size={18} color={colors.ink} />
                <Text className="flex-1 font-display-bold text-[14px] text-ink">Xem lại bài đã đăng</Text>
                <ChevronRight size={16} color={colors.muted} />
              </Pressable>
            )}

            <View className="mt-3.5 flex-row gap-2">
              <Pressable
                onPress={() => router.push('/friends/qr')}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-input border-[1.5px] border-ink">
                <QrCode size={18} color={colors.ink} />
                <Text className="font-display-bold text-[14px] text-ink">Mã QR của tôi</Text>
              </Pressable>
              <Pressable
                onPress={handleInvite}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-input bg-ink">
                <UserPlus size={18} color={colors.paper} />
                <Text className="font-display-bold text-[14px] text-white">Gửi link mời</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/friends/add')}
            className="mx-4 mt-3 h-12 flex-row items-center gap-2.5 rounded-input bg-paper px-3.5">
            <Search size={18} color={colors.muted} />
            <Text className="flex-1 text-[14px] text-placeholder">Thêm bạn: tìm SĐT, quét QR, gửi link</Text>
          </Pressable>

          {(requests.data ?? []).length > 0 && (
            <>
              <Text className="mx-4 mb-1.5 mt-4 font-mono-bold text-[11px] tracking-[1px] text-muted">
                LỜI MỜI KẾT BẠN · {requests.data?.length}
              </Text>
              {requests.data?.map((r) => (
                <View key={r.id} className="mx-4 flex-row items-center gap-2.5 bg-paper p-3">
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
            </>
          )}

          <Text className="mx-4 mb-1.5 mt-4 font-mono-bold text-[11px] tracking-[1px] text-muted">
            BẠN BÈ · {friends.data?.length ?? 0}
          </Text>
          <View className="mx-4 mb-6 bg-paper">
            {(friends.data ?? []).map((f, i) => (
              <Pressable
                key={f.id}
                onPress={() => router.push(`/friends/${f.id}`)}
                className={`flex-row items-center gap-2.5 p-3 ${i < (friends.data?.length ?? 0) - 1 ? 'border-b border-dashed border-line' : ''}`}>
                <Avatar name={f.displayName} avatarUrl={f.avatarUrl} size={40} />
                <View className="flex-1">
                  <Text className="font-display-bold text-[14px] text-ink">{f.displayName}</Text>
                  <Text className="text-[12px] text-muted">
                    {lastPostByFriend.has(f.id) ? 'Đã đăng bài gần đây' : 'Chưa có bài nào'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleMessageFriend(f.id)}
                  accessibilityLabel={`Nhắn cho ${f.displayName}`}
                  className="h-10 w-10 items-center justify-center rounded-input bg-chip">
                  <MessageCircle size={18} color={colors.ink} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav active="me" onChange={handleNavTab} />

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setEditOpen(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className={
            keyboardVisible
              ? 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[20px] pt-2.5'
              : 'absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[90px] pt-2.5'
          }>
          <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
          <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Sửa hồ sơ</Text>

          <Pressable onPress={handlePickAvatar} disabled={uploadAvatar.isPending} className="mt-3 items-center">
            <View>
              <Avatar name={profile.data?.displayName ?? '?'} avatarUrl={profile.data?.avatarUrl} size={72} />
              <View
                className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full border-2 border-paper bg-ink"
                style={{ opacity: uploadAvatar.isPending ? 0.6 : 1 }}>
                {uploadAvatar.isPending ? <ActivityIndicator size="small" color={colors.paper} /> : <Pencil size={12} color={colors.paper} />}
              </View>
            </View>
            <Text className="mt-1.5 text-[12px] font-display-semibold text-muted">Đổi ảnh đại diện</Text>
          </Pressable>

          <Text className="mt-3 font-mono-bold text-[11px] tracking-[1px] text-muted">TÊN HIỂN THỊ</Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Tên của bạn"
            placeholderTextColor={colors.placeholder}
            className="mt-1.5 h-12 rounded-input bg-chip px-3.5 font-display text-[15px] text-ink"
          />

          <Text className="mt-3 font-mono-bold text-[11px] tracking-[1px] text-muted">USERNAME</Text>
          <View className="mt-1.5 h-12 flex-row items-center rounded-input bg-chip px-3.5">
            <Text className="font-mono text-[15px] text-muted">@</Text>
            <TextInput
              value={editUsername}
              onChangeText={(t) => setEditUsername(t.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              placeholder="username"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              className="flex-1 font-mono text-[15px] text-ink"
            />
          </View>

          <Pressable
            onPress={saveEdit}
            disabled={!editName.trim() || !editUsername.trim() || updateProfile.isPending}
            className="mt-4 mb-6 h-[54px] items-center justify-center rounded-input bg-red"
            style={{ opacity: !editName.trim() || !editUsername.trim() || updateProfile.isPending ? 0.5 : 1 }}>
            <Text className="font-display-extrabold text-[15px] text-white">
              {updateProfile.isPending ? 'Đang lưu…' : 'Lưu'}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Stat({ value, label, loading }: { value: string; label: string; loading?: boolean }) {
  return (
    <View className="flex-1 items-center gap-1">
      {loading ? <Skeleton width={36} height={16} /> : <Text className="font-mono-extrabold text-[18px] text-ink">{value}</Text>}
      <Text className="text-[12px] text-muted">{label}</Text>
    </View>
  );
}

