import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { messageRepo, type SendMessageInput } from '@/data';
import { supabase } from '@/lib/supabase';

export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: messageRepo.getConversations });
}

/** Tin nhắn + Realtime: bên kia gửi là tự cập nhật, không cần kéo lại màn. */
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageRepo.getMessages(conversationId),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) => messageRepo.sendMessage(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Mở hội thoại với 1 bạn — tự tạo nếu đây là lần đầu nhắn, dùng khi bấm "Nhắn" từ danh sách bạn bè. */
export function useOpenConversationWithFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => messageRepo.getOrCreateConversationWithFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Trả lời 1 bài từ bảng tin — tự tìm/tạo hội thoại với tác giả rồi gửi tin kèm tham chiếu bài. */
export function useReplyToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      friendId,
      content,
      referencedPostId,
    }: {
      friendId: string;
      content: string;
      referencedPostId?: string;
    }) => {
      const conversation = await messageRepo.getOrCreateConversationWithFriend(friendId);
      return messageRepo.sendMessage({ conversationId: conversation.id, content, referencedPostId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
