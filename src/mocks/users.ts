import type { Friend, FriendRequest, User, UserProfile } from '@/types';

export const meProfile: UserProfile = {
  id: 'usr_tan',
  displayName: 'Văn Tấn',
  username: 'vanntan_n',
  phoneNumber: '+84912345678',
  moneyMode: 'PAYDAY',
  notificationTone: 'PLAYFUL',
  lastMomentToggle: false,
  defaultPostPrivacy: 'FRIENDS',
  cycleStartDay: 25,
};

export const friends: Friend[] = [
  { id: 'usr_minhanh', displayName: 'Minh Anh', username: 'minhanh', friendsSince: '2026-03-01' },
  { id: 'usr_hoang', displayName: 'Hoàng', username: 'hoang', friendsSince: '2026-02-14' },
  { id: 'usr_thao', displayName: 'Thảo', username: 'thao', friendsSince: '2026-01-20' },
  { id: 'usr_quan', displayName: 'Quân', username: 'quan', friendsSince: '2025-12-05' },
  { id: 'usr_linh', displayName: 'Linh', username: 'linh', friendsSince: '2025-11-11' },
];

export const khoiUser: User = {
  id: 'usr_khoi',
  displayName: 'Khôi',
  username: 'khoi_vt',
  phoneNumber: '+84987654321',
};

export const incomingFriendRequests: FriendRequest[] = [
  {
    id: 'freq_khoi',
    sender: khoiUser,
    receiver: meProfile,
    status: 'PENDING',
    createdAt: '2026-10-17T09:00:00+07:00',
  },
];

/** Người dùng khác (chưa phải bạn) — để demo tìm bạn qua SĐT/email và quét QR. */
export const discoverableUsers: User[] = [
  khoiUser,
  { id: 'usr_bao', displayName: 'Bảo', username: 'baole', phoneNumber: '+84901112233', email: 'bao.le@gmail.com' },
  { id: 'usr_chi', displayName: 'Chi', username: 'chinguyen', phoneNumber: '+84909887766', email: 'chi.ng@gmail.com' },
];
