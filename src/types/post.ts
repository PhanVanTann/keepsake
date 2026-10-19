import type { Category } from './category';
import type { PostPrivacy, User } from './user';

export type PostType = 'MOMENT' | 'EXPENSE';
export type ReactionEmoji = '❤️' | '😂' | '😮' | '😢' | '🔥';

export type PostReaction = {
  userId: string;
  userName: string;
  emoji: ReactionEmoji;
  createdAt: string;
};

export type PostView = {
  viewerId: string;
  viewerName: string;
  viewedAt: string;
};

export type Post = {
  id: string;
  author: User;
  postType: PostType;
  imageUrl: string;
  /** 0 khi là MOMENT (không tạo khoản chi). */
  amount: number;
  content?: string;
  /** Chỉ có khi postType = EXPENSE. */
  category?: Category;
  locationName?: string;
  showLocation: boolean;
  privacy: PostPrivacy;
  selectedFriendIds?: string[];
  createdAt: string;
  /** Có giá trị sau khi bài được sửa — hiện nhãn "đã sửa". */
  editedAt?: string;
  /** Có giá trị khi bài đã bị xoá (soft delete) — tin nhắn tham chiếu vẫn giữ được bài. */
  deletedAt?: string;
  reactions: PostReaction[];
  myReaction?: ReactionEmoji;
  views: PostView[];
};
