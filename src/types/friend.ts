import type { User } from './user';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type Friend = User & {
  friendsSince: string;
};

export type FriendRequest = {
  id: string;
  sender: User;
  receiver: User;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string;
};
