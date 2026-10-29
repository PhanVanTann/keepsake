import { create } from 'zustand';

type PendingInviteState = {
  code: string | null;
  setCode: (code: string) => void;
  clear: () => void;
};

/** Giữ mã mời qua lúc đăng nhập Google (rời app sang browser rồi quay lại) để dùng ngay sau khi có session. */
export const usePendingInviteStore = create<PendingInviteState>((set) => ({
  code: null,
  setCode: (code) => set({ code }),
  clear: () => set({ code: null }),
}));
