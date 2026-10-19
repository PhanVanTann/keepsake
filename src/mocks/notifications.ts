import type { AppNotification } from '@/types';

export const notifications: AppNotification[] = [
  {
    id: 'noti_budget_80',
    kind: 'BUDGET_80_PERCENT',
    title: 'Ví đang thở oxy rồi đó 😮‍💨',
    body: 'Bạn đã dùng 80% ngân sách chu kỳ này.',
    createdAt: '2026-10-18T12:45:00+07:00',
  },
  {
    id: 'noti_reaction',
    kind: 'REACTION',
    title: 'Minh Anh đã thả ❤️',
    body: 'cho bài lẩu nấm của bạn',
    createdAt: '2026-10-18T12:52:00+07:00',
    readAt: '2026-10-18T13:00:00+07:00',
  },
  {
    id: 'noti_friend_request',
    kind: 'FRIEND_REQUEST',
    title: 'Khôi muốn kết bạn với bạn',
    body: 'Xem lời mời kết bạn',
    createdAt: '2026-10-17T09:00:00+07:00',
  },
  {
    id: 'noti_post_reply',
    kind: 'POST_REPLY',
    title: 'Minh Anh đã nhắn cho bạn',
    body: 'Ăn ở đâu đấy? 😋',
    createdAt: '2026-10-18T22:55:00+07:00',
  },
];
