import type { PostPrivacy } from '@/types';

export const PRIVACY_LABEL: Record<PostPrivacy, string> = {
  FRIENDS: 'Tất cả bạn bè',
  SELECTED_FRIENDS: 'Bạn bè được chọn',
  SELF: 'Chỉ mình tôi',
};
