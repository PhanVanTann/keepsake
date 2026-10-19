import type { Conversation, Message } from '@/types';

import { allPosts } from './posts';
import { friends, meProfile } from './users';

function friend(username: string) {
  const found = friends.find((f) => f.username === username);
  if (!found) throw new Error(`Không tìm thấy bạn: ${username}`);
  return found;
}

function post(id: string) {
  const found = allPosts.find((p) => p.id === id);
  if (!found) throw new Error(`Không tìm thấy bài: ${id}`);
  return found;
}

export const conversations: Conversation[] = [
  {
    id: 'conv_minhanh',
    friend: friend('minhanh'),
    lastMessageAt: '2026-10-18T22:55:00+07:00',
    lastMessagePreview: 'Ăn ở đâu đấy? 😋',
    unreadCount: 2,
  },
  {
    id: 'conv_hoang',
    friend: friend('hoang'),
    lastMessageAt: '2026-10-18T19:20:00+07:00',
    lastMessagePreview: 'Đẹp vậy',
    unreadCount: 0,
  },
  {
    id: 'conv_thao',
    friend: friend('thao'),
    lastMessageAt: '2026-10-16T10:00:00+07:00',
    lastMessagePreview: 'Ok hẹn chiều nhé',
    unreadCount: 0,
  },
];

export const messagesByConversation: Record<string, Message[]> = {
  conv_minhanh: [
    {
      id: 'msg_1',
      conversationId: 'conv_minhanh',
      senderId: friend('minhanh').id,
      messageType: 'POST_REPLY',
      content: 'Ăn ở đâu đấy? 😋',
      referencedPost: post('post_me_an_uong'),
      sentAt: '2026-10-18T22:55:00+07:00',
      status: 'DELIVERED',
    },
    {
      id: 'msg_2',
      conversationId: 'conv_minhanh',
      senderId: meProfile.id,
      messageType: 'TEXT',
      content: 'Quán gần nhà, để gửi địa chỉ sau nha',
      sentAt: '2026-10-18T22:58:00+07:00',
      status: 'SEEN',
    },
  ],
  conv_hoang: [
    {
      id: 'msg_3',
      conversationId: 'conv_hoang',
      senderId: meProfile.id,
      messageType: 'POST_REPLY',
      content: 'Đẹp vậy',
      referencedPost: post('post_hoang_moment'),
      sentAt: '2026-10-18T19:20:00+07:00',
      status: 'SEEN',
    },
  ],
  conv_thao: [
    {
      id: 'msg_4',
      conversationId: 'conv_thao',
      senderId: friend('thao').id,
      messageType: 'TEXT',
      content: 'Ok hẹn chiều nhé',
      sentAt: '2026-10-16T10:00:00+07:00',
      status: 'SEEN',
    },
  ],
};
