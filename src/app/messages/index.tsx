import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, BottomNav, type BottomNavKey } from '@/components/receipt';
import { Skeleton } from '@/components/loading';
import { useConversations, useDelayedLoading } from '@/hooks';
import { formatConversationTime } from '@/lib/date';
import { colors } from '@/theme/tokens';

export default function MessagesScreen() {
  const conversations = useConversations();
  const [query, setQuery] = useState('');
  const showLoading = useDelayedLoading(conversations.isLoading);

  const rows = (conversations.data ?? []).filter((c) =>
    c.friend.displayName.toLowerCase().includes(query.trim().toLowerCase())
  );

  function handleNavTab(key: BottomNavKey) {
    if (key === 'camera') router.push('/');
    else if (key === 'expenses') router.push('/expenses');
    else if (key === 'me') router.push('/me');
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 justify-center px-4">
          <Text className="font-display-extrabold text-[24px] text-ink">Tin nhắn</Text>
        </View>

        <View className="mx-4 mt-3 h-[46px] flex-row items-center gap-2.5 rounded-input bg-paper px-3.5">
          <Search size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm bạn bè"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Tìm cuộc trò chuyện"
            className="flex-1 font-display text-[14px] text-ink"
          />
        </View>

        <View className="mx-4 mt-3.5 flex-1 bg-paper">
          {showLoading ? (
            [0, 1, 2].map((i) => (
              <View key={i} className={`flex-row items-center gap-3 p-3 ${i < 2 ? 'border-b border-dashed border-line' : ''}`}>
                <Skeleton width={48} height={48} radius={24} />
                <View className="flex-1 gap-1.5">
                  <Skeleton width="45%" height={14} />
                  <Skeleton width="70%" height={12} />
                </View>
              </View>
            ))
          ) : (
            <>
              {rows.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/messages/${c.id}`)}
              className={`flex-row items-center gap-3 p-3 ${i < rows.length - 1 ? 'border-b border-dashed border-line' : ''}`}>
              <Avatar name={c.friend.displayName} avatarUrl={c.friend.avatarUrl} size={48} />
              <View className="min-w-0 flex-1 gap-0.5">
                <View className="flex-row justify-between">
                  <Text className="font-display-extrabold text-[15px] text-ink" numberOfLines={1}>
                    {c.friend.displayName}
                  </Text>
                  <Text
                    className={`font-mono-bold text-[11px] ${c.unreadCount > 0 ? 'text-red' : 'text-muted'}`}>
                    {formatConversationTime(c.lastMessageAt)}
                  </Text>
                </View>
                <Text className="text-[13px] text-muted" numberOfLines={1}>
                  {c.lastMessagePreview ?? ''}
                </Text>
              </View>
              {c.unreadCount > 0 && (
                <View className="h-[22px] min-w-[22px] items-center justify-center rounded-md bg-red px-1.5">
                  <Text className="font-mono-extrabold text-[12px] text-white">{c.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          ))}
              {rows.length === 0 && (
                <Text className="py-8 text-center text-[13px] text-muted">
                  {query ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện nào'}
                </Text>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
      <BottomNav active="messages" onChange={handleNavTab} />
    </View>
  );
}
