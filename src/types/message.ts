import type { User } from './user';

export type MessageType = 'TEXT' | 'POST_REPLY';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'SEEN';

/** Chỉ cần đủ để vẽ bong bóng trả lời bài — không phải Post đầy đủ (reactions/views/author...). */
export type ReferencedPostPreview = {
  imageUrl: string;
  amount: number;
  content?: string;
};

export type Conversation = {
  id: string;
  friend: User;
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  content?: string;
  /** Null nếu bài được tham chiếu đã bị xoá — UI hiện "Bài đăng đã bị xoá". */
  referencedPost?: ReferencedPostPreview | null;
  sentAt: string;
  status: MessageStatus;
};
