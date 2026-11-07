import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeft, Plus, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/receipt';
import { friendRepo } from '@/data';
import { useSendFriendRequest } from '@/hooks';
import { colors } from '@/theme/tokens';

export default function FriendSearchScreen() {
  const [query, setQuery] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sendRequest = useSendFriendRequest();

  const result = useQuery({
    queryKey: ['friendSearch', query],
    queryFn: async () => (await friendRepo.searchByContact(query)) ?? null,
    enabled: query.trim().length >= 6,
  });

  async function handleAdd(userId: string) {
    await sendRequest.mutateAsync(userId);
    setSentTo(userId);
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <View className="h-11 flex-1 flex-row items-center gap-2 rounded-input border-[1.5px] border-ink bg-paper px-3">
            <Search size={18} color={colors.ink} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="SĐT hoặc email, vd: +84901112233"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 font-mono-bold text-[15px] text-ink"
            />
          </View>
        </View>

        {query.trim().length >= 6 && (
          <>
            <Text className="mx-4 mb-2 mt-5 font-mono-bold text-[11px] tracking-[1px] text-muted">
              KẾT QUẢ · {result.data ? 1 : 0}
            </Text>
            {result.data ? (
              <View className="mx-4 flex-row items-center gap-3 bg-paper p-3.5">
                <Avatar name={result.data.displayName} avatarUrl={result.data.avatarUrl} size={52} />
                <View className="min-w-0 flex-1">
                  <Text className="font-display-extrabold text-[16px] text-ink">{result.data.displayName}</Text>
                  <Text className="font-mono text-[12px] text-muted">@{result.data.username}</Text>
                </View>
                {sentTo === result.data.id ? (
                  <Text className="text-[13px] font-display-semibold text-muted">Đã gửi ✓</Text>
                ) : (
                  <Pressable
                    onPress={() => handleAdd(result.data!.id)}
                    disabled={sendRequest.isPending}
                    className="h-10 flex-row items-center gap-1.5 rounded-input bg-red px-3.5">
                    <Plus size={16} color={colors.paper} strokeWidth={2.4} />
                    <Text className="font-display-extrabold text-[14px] text-white">Kết bạn</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              !result.isLoading && (
                <Text className="mx-4 text-[13px] text-muted">
                  Không tìm thấy ai với số/email này — nhập đúng đủ số điện thoại hoặc email nhé.
                </Text>
              )
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
