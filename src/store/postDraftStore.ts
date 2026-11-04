import { create } from 'zustand';

import type { PostPrivacy, PostType } from '@/types';

type PostDraftState = {
  photoUri: string | null;
  postType: PostType;
  amount: number;
  content: string;
  categoryId: string | undefined;
  showLocation: boolean;
  locationName: string | undefined;
  privacy: PostPrivacy;
  selectedFriendIds: string[];
  defaultsSynced: boolean;

  setPhoto: (uri: string) => void;
  setPostType: (type: PostType) => void;
  setAmount: (amount: number) => void;
  setContent: (content: string) => void;
  setCategoryId: (categoryId: string | undefined) => void;
  setShowLocation: (show: boolean) => void;
  setPrivacy: (privacy: PostPrivacy) => void;
  setSelectedFriendIds: (ids: string[]) => void;
  /** Nạp mặc định từ hồ sơ thật — chỉ áp dụng 1 lần lúc mở app, không đè khi đang đăng bài. */
  syncDefaultsFromProfile: (postType: PostType, privacy: PostPrivacy) => void;
  reset: () => void;
};

const EMPTY_DRAFT = {
  photoUri: null as string | null,
  amount: 0,
  content: '',
  categoryId: undefined as string | undefined,
  showLocation: false,
  locationName: undefined as string | undefined,
  selectedFriendIds: [] as string[],
};

/**
 * Trạng thái tạm của 1 lượt đăng bài — dùng chung giữa 3 màn Camera → Xem lại → Đăng ảnh.
 * `postType`/`privacy` "nhớ trạng thái lần trước" (CLAUDE.md) nên KHÔNG bị reset sau mỗi lần
 * đăng — chỉ nạp từ hồ sơ thật đúng 1 lần lúc mở app, qua `syncDefaultsFromProfile` (gọi ở
 * màn Camera khi `useProfile()` tải xong).
 */
export const usePostDraftStore = create<PostDraftState>((set, get) => ({
  ...EMPTY_DRAFT,
  postType: 'EXPENSE',
  privacy: 'FRIENDS',
  defaultsSynced: false,

  setPhoto: (uri) => set({ photoUri: uri }),
  setPostType: (postType) => set({ postType }),
  setAmount: (amount) => set({ amount }),
  setContent: (content) => set({ content }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setShowLocation: (showLocation) =>
    set({ showLocation, locationName: showLocation ? 'Vị trí hiện tại' : undefined }),
  setPrivacy: (privacy) => set({ privacy }),
  setSelectedFriendIds: (selectedFriendIds) => set({ selectedFriendIds }),
  syncDefaultsFromProfile: (postType, privacy) => {
    if (get().defaultsSynced) return;
    set({ postType, privacy, defaultsSynced: true });
  },
  reset: () => set({ ...EMPTY_DRAFT }),
}));
