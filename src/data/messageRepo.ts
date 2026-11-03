import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';
import type { MessageInsert, MessageRow, MyConversationRow } from '@/types/database';

const BUCKET = 'post-images';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Chưa đăng nhập.');
  return data.user.id;
}

function mapConversation(row: MyConversationRow): Conversation {
  return {
    id: row.conversation_id,
    friend: {
      id: row.friend_id,
      displayName: row.friend_display_name,
      username: row.friend_username,
      avatarUrl: row.friend_avatar_url ?? undefined,
    },
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview ?? undefined,
    unreadCount: Number(row.unread_count),
  };
}

type ReferencedPostEmbed = { image_url: string; amount: number; content: string | null } | null;
type MessageQueryRow = MessageRow & { referenced_post: ReferencedPostEmbed };

const MESSAGE_SELECT =
  'id, conversation_id, sender_id, message_type, content, referenced_post_id, sent_at, delivered_at, seen_at, deleted_at, referenced_post:posts(image_url, amount, content)';

async function resolveImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function mapMessage(row: MessageQueryRow): Promise<Message> {
  let referencedPost: Message['referencedPost'];
  if (row.referenced_post_id) {
    referencedPost = row.referenced_post
      ? {
          imageUrl: await resolveImageUrl(row.referenced_post.image_url),
          amount: row.referenced_post.amount,
          content: row.referenced_post.content ?? undefined,
        }
      : null;
  }

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    messageType: row.message_type,
    content: row.content ?? undefined,
    referencedPost,
    sentAt: row.sent_at,
    status: row.seen_at ? 'SEEN' : row.delivered_at ? 'DELIVERED' : 'SENT',
  };
}

export type SendMessageInput = {
  conversationId: string;
  content: string;
  referencedPostId?: string;
};

export const messageRepo = {
  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase.rpc('get_my_conversations');
    if (error) throw error;
    return data.map(mapConversation);
  },

  /** Trả về hội thoại với bạn này — tạo mới nếu đây là lần đầu nhắn. Chỉ nhắn được cho bạn bè. */
  async getOrCreateConversationWithFriend(friendId: string): Promise<Conversation> {
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation_with_friend', {
      p_friend_id: friendId,
    });
    if (error) throw error;

    const { data: profiles, error: profileError } = await supabase.rpc('get_public_profile', { p_user_id: friendId });
    if (profileError) throw profileError;
    const profile = profiles[0];

    return {
      id: conversationId,
      friend: profile
        ? {
            id: profile.user_id,
            displayName: profile.display_name,
            username: profile.username,
            avatarUrl: profile.avatar_url ?? undefined,
          }
        : { id: friendId, displayName: 'Người dùng', username: 'nguoi_dung' },
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };
  },

  /** Tải tin nhắn + đánh dấu đã đọc tới lúc này (không chặn kết quả trả về nếu bước đánh dấu lỗi). */
  async getMessages(conversationId: string): Promise<Message[]> {
    const myUserId = await requireUserId();

    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('sent_at', { ascending: true })
      .overrideTypes<MessageQueryRow[], { merge: false }>();
    if (error) throw error;

    void supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', myUserId);

    return Promise.all(data.map(mapMessage));
  },

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const myUserId = await requireUserId();
    const insert: MessageInsert = {
      conversation_id: input.conversationId,
      sender_id: myUserId,
      content: input.content,
      message_type: input.referencedPostId ? 'POST_REPLY' : 'TEXT',
      referenced_post_id: input.referencedPostId,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(insert)
      .select(MESSAGE_SELECT)
      .single()
      .overrideTypes<MessageQueryRow, { merge: false }>();
    if (error) throw error;

    return mapMessage(data);
  },
};
