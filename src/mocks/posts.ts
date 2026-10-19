import type { Post } from '@/types';

import { findCategory } from './categories';
import { friends, meProfile } from './users';

function friend(username: string) {
  const found = friends.find((f) => f.username === username);
  if (!found) throw new Error(`Không tìm thấy bạn: ${username}`);
  return found;
}

/** Bài của Văn Tấn — mỗi bài khớp 1 khoản chi trong mocks/finance.ts (postId tương ứng). */
export const myPosts: Post[] = [
  {
    id: 'post_me_an_uong',
    author: meProfile,
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/me-an-uong/800/800',
    amount: 3_200_000,
    content: 'Lẩu nấm cuối tuần, chia 4 người là vừa',
    category: findCategory('cat_an_uong'),
    locationName: 'Quận 3',
    showLocation: true,
    privacy: 'FRIENDS',
    createdAt: '2026-10-18T12:40:00+07:00',
    reactions: [
      { userId: friend('minhanh').id, userName: 'Minh Anh', emoji: '❤️', createdAt: '2026-10-18T12:52:00+07:00' },
      { userId: friend('hoang').id, userName: 'Hoàng', emoji: '🔥', createdAt: '2026-10-18T13:05:00+07:00' },
    ],
    views: [
      { viewerId: friend('minhanh').id, viewerName: 'Minh Anh', viewedAt: '2026-10-18T12:51:00+07:00' },
      { viewerId: friend('hoang').id, viewerName: 'Hoàng', viewedAt: '2026-10-18T13:04:00+07:00' },
      { viewerId: friend('thao').id, viewerName: 'Thảo', viewedAt: '2026-10-18T14:00:00+07:00' },
    ],
  },
  {
    id: 'post_me_di_lai',
    author: meProfile,
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/me-di-lai/800/800',
    amount: 850_000,
    content: 'Đổ xăng với bảo dưỡng xe đầu tháng',
    category: findCategory('cat_di_lai'),
    showLocation: false,
    privacy: 'FRIENDS',
    createdAt: '2026-10-15T08:10:00+07:00',
    reactions: [],
    views: [{ viewerId: friend('quan').id, viewerName: 'Quân', viewedAt: '2026-10-15T09:00:00+07:00' }],
  },
  {
    id: 'post_me_mua_sam',
    author: meProfile,
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/me-mua-sam/800/800',
    amount: 2_100_000,
    content: 'Mua áo khoác đông, sale 30%',
    category: findCategory('cat_mua_sam'),
    showLocation: false,
    privacy: 'FRIENDS',
    createdAt: '2026-10-10T19:20:00+07:00',
    editedAt: '2026-10-10T20:05:00+07:00',
    reactions: [{ userId: friend('linh').id, userName: 'Linh', emoji: '😮', createdAt: '2026-10-10T19:30:00+07:00' }],
    views: [{ viewerId: friend('linh').id, viewerName: 'Linh', viewedAt: '2026-10-10T19:29:00+07:00' }],
  },
  {
    id: 'post_me_giai_tri',
    author: meProfile,
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/me-giai-tri/800/800',
    amount: 1_200_000,
    content: 'Xem phim cuối tuần với hội bạn thân',
    category: findCategory('cat_giai_tri'),
    locationName: 'CGV Vincom',
    showLocation: true,
    privacy: 'FRIENDS',
    createdAt: '2026-10-05T21:00:00+07:00',
    reactions: [],
    views: [],
  },
  {
    id: 'post_me_suc_khoe',
    author: meProfile,
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/me-suc-khoe/800/800',
    amount: 600_000,
    content: 'Khám sức khoẻ định kỳ',
    category: findCategory('cat_suc_khoe'),
    showLocation: false,
    privacy: 'SELF',
    createdAt: '2026-09-29T17:30:00+07:00',
    reactions: [],
    views: [],
  },
];

/** Bảng tin — bài của bạn bè, mới nhất trước. post_lau_nam khớp docs/design/A-Feed.dc.html. */
export const feedPosts: Post[] = [
  {
    id: 'post_lau_nam',
    author: friend('minhanh'),
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/lau-nam/800/800',
    amount: 120_000,
    content: 'Lẩu nấm cuối tuần, chia 4 người là vừa',
    category: findCategory('cat_an_uong'),
    locationName: 'Quận 3',
    showLocation: true,
    privacy: 'FRIENDS',
    createdAt: '2026-10-18T22:44:00+07:00',
    reactions: [{ userId: meProfile.id, userName: meProfile.displayName, emoji: '❤️', createdAt: '2026-10-18T22:50:00+07:00' }],
    myReaction: '❤️',
    views: [],
  },
  {
    id: 'post_hoang_moment',
    author: friend('hoang'),
    postType: 'MOMENT',
    imageUrl: 'https://picsum.photos/seed/hoang-moment/800/800',
    amount: 0,
    content: 'Trời Đà Lạt đẹp quá trời',
    showLocation: false,
    privacy: 'FRIENDS',
    createdAt: '2026-10-18T19:15:00+07:00',
    reactions: [],
    views: [],
  },
  {
    id: 'post_thao_cf',
    author: friend('thao'),
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/thao-cf/800/800',
    amount: 65_000,
    content: 'Cà phê sáng trước giờ làm',
    category: findCategory('cat_an_uong'),
    showLocation: false,
    privacy: 'FRIENDS',
    createdAt: '2026-10-18T07:30:00+07:00',
    reactions: [],
    views: [],
  },
  {
    id: 'post_quan_sach',
    author: friend('quan'),
    postType: 'EXPENSE',
    imageUrl: 'https://picsum.photos/seed/quan-sach/800/800',
    amount: 340_000,
    content: 'Mua mấy cuốn sách mới ra',
    category: findCategory('cat_giao_duc'),
    showLocation: false,
    privacy: 'FRIENDS',
    createdAt: '2026-10-17T15:00:00+07:00',
    reactions: [],
    views: [],
  },
];

export const allPosts: Post[] = [...myPosts, ...feedPosts];
