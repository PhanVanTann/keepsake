import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, CheckCheck, ChevronLeft, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/receipt';
import { useAuth, useConversations, useKeyboardVisible, useMessages, useSendMessage } from '@/hooks';
import { formatVnd } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { Message } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const conversations = useConversations();
  const messages = useMessages(id);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const keyboardVisible = useKeyboardVisible();

  const conversation = conversations.data?.find((c) => c.id === id);

  const dayLabel = useMemo(() => {
    const last = messages.data?.[messages.data.length - 1];
    if (!last) return '';
    const d = dayjs(last.sentAt);
    const prefix = d.isSame(dayjs(), 'day') ? 'HÔM NAY' : d.format('DD.MM');
    return `${prefix} · ${d.format('HH:mm')}`;
  }, [messages.data]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate({ conversationId: id, content: trimmed });
    setText('');
  }

  if (!conversation) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[13px] text-muted">Đang tải…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-14 flex-row items-center gap-2.5 border-b border-line px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Avatar name={conversation.friend.displayName} avatarUrl={conversation.friend.avatarUrl} size={40} />
          <View>
            <Text className="font-display-extrabold text-[16px] text-ink">{conversation.friend.displayName}</Text>
            <Text className="text-[12px] text-muted">Bạn bè</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 0}>
          <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
            {dayLabel ? (
              <Text className="self-center font-mono-bold text-[11px] tracking-[1px] text-muted">{dayLabel}</Text>
            ) : null}

            {(messages.data ?? []).map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={m.senderId === session?.user.id}
                isLast={i === (messages.data?.length ?? 0) - 1}
              />
            ))}

            {(messages.data ?? []).length === 0 && !messages.isLoading && (
              <Text className="mt-10 text-center text-[13px] text-muted">Chưa có tin nhắn nào, bắt đầu chào hỏi đi!</Text>
            )}
            {messages.isLoading && <Text className="mt-10 text-center text-[13px] text-muted">Đang tải…</Text>}
          </ScrollView>

          <View
            className={
              keyboardVisible
                ? 'flex-row items-center gap-2 border-t border-line px-3 pb-[12px] pt-2.5'
                : 'flex-row items-center gap-2 border-t border-line px-3 pb-[46px] pt-2.5'
            }>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Nhắn tin…"
              placeholderTextColor={colors.placeholder}
              onSubmitEditing={handleSend}
              className="h-12 flex-1 rounded-input border-[1.5px] border-ink bg-paper px-3.5 font-display text-[15px] text-ink"
            />
            <Pressable
              onPress={handleSend}
              disabled={sendMessage.isPending}
              accessibilityLabel="Gửi"
              className="h-12 w-12 items-center justify-center rounded-input bg-red"
              style={{ opacity: sendMessage.isPending ? 0.6 : 1 }}>
              <Send size={20} color={colors.paper} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function MessageBubble({ message, isMe, isLast }: { message: Message; isMe: boolean; isLast: boolean }) {
  return (
    <View className={isMe ? 'items-end gap-1.5' : 'items-start gap-1.5'}>
      {message.messageType === 'POST_REPLY' && (
        <View className={isMe ? 'items-end gap-1' : 'items-start gap-1'} style={{ maxWidth: 250 }}>
          {isMe && <Text className="text-[12px] font-display-semibold text-muted">Bạn trả lời 1 bài</Text>}
          {message.referencedPost ? (
            <View className="w-full flex-row items-center gap-2.5 border-l-[3px] border-red bg-paper p-2.5">
              <View className="h-14 w-14 overflow-hidden rounded-receipt bg-ink">
                <Image source={{ uri: message.referencedPost.imageUrl }} style={{ flex: 1 }} contentFit="cover" />
              </View>
              <View className="min-w-0 flex-1">
                {message.referencedPost.amount > 0 && (
                  <Text className="font-mono-extrabold text-[15px] text-red">{formatVnd(message.referencedPost.amount)}</Text>
                )}
                <Text className="text-[13px] text-muted" numberOfLines={1}>
                  {message.referencedPost.content}
                </Text>
              </View>
            </View>
          ) : (
            <View className="w-full bg-chip p-2.5">
              <Text className="text-[13px] italic text-muted">Bài đăng đã bị xoá</Text>
            </View>
          )}
        </View>
      )}

      {message.content && (
        <View
          style={{ maxWidth: 270 }}
          className={isMe ? 'rounded-tl-[14px] rounded-tr-[14px] rounded-bl-[14px] rounded-br-[4px] bg-ink px-3.5 py-2.5' : 'rounded-tl-[14px] rounded-tr-[14px] rounded-br-[14px] rounded-bl-[4px] bg-paper px-3.5 py-2.5'}>
          <Text className={isMe ? 'text-[15px] leading-[21px] text-white' : 'text-[15px] leading-[21px] text-ink'}>
            {message.content}
          </Text>
        </View>
      )}

      {isMe && isLast && (
        <View className="flex-row items-center gap-1">
          {message.status === 'SEEN' ? (
            <CheckCheck size={13} color={colors.green} />
          ) : (
            <Check size={13} color={colors.muted} />
          )}
          <Text className="text-[11px] font-display-semibold text-muted">
            {message.status === 'SEEN' ? 'Đã xem' : message.status === 'DELIVERED' ? 'Đã nhận' : 'Đã gửi'} ·{' '}
            {dayjs(message.sentAt).format('HH:mm')}
          </Text>
        </View>
      )}
    </View>
  );
}
