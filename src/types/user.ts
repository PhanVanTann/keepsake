export type MoneyMode = 'PAYDAY' | 'TOP_UP';
export type NotificationTone = 'PLAYFUL' | 'SERIOUS';
export type PostPrivacy = 'SELF' | 'FRIENDS' | 'SELECTED_FRIENDS';

export type User = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  /** Dùng để tìm bạn — khớp đúng đủ số/email, không gợi ý theo vài ký tự đầu. */
  phoneNumber?: string;
  email?: string;
};

export type UserProfile = User & {
  moneyMode: MoneyMode;
  /** Kiểu tiền về sẽ áp dụng từ chu kỳ sau, nếu người dùng vừa đổi. */
  nextMoneyMode?: MoneyMode;
  notificationTone: NotificationTone;
  /** Trạng thái công tắc "Chỉ chia sẻ khoảnh khắc" ở lần đăng bài gần nhất — màn Đăng ảnh mở lên sẽ nhớ đúng vị trí này. */
  lastMomentToggle: boolean;
  defaultPostPrivacy: PostPrivacy;
  cycleStartDay: number;
  nextCycleStartDay?: number;
  /** Có giá trị khi người dùng yêu cầu xoá tài khoản — xoá vĩnh viễn sau 30 ngày, đăng nhập lại trước hạn là khôi phục. */
  deletionRequestedAt?: string;
  /** Có giá trị sau khi hoàn tất màn "Tiền của bạn về thế nào?" — chưa có thì AuthGate đẩy lại về đó. */
  onboardingCompletedAt?: string;
};
