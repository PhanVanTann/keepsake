import dayjs, { type Dayjs } from 'dayjs';

const VN_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** "THỨ BẢY · 18.10" — dùng cho header các màn kiểu biên lai. */
export function formatVnDateHeader(date: Dayjs): string {
  return `${VN_WEEKDAYS[date.day()].toUpperCase()} · ${date.format('DD.MM')}`;
}

export function isSameDay(a: Dayjs, b: Dayjs): boolean {
  return a.format('YYYY-MM-DD') === b.format('YYYY-MM-DD');
}

/** "12 phút trước" / "2 giờ trước" / "Hôm qua" / "18.10.2026". */
export function formatRelativeTime(iso: string, now: Dayjs = dayjs()): string {
  const d = dayjs(iso);
  const diffMin = now.diff(d, 'minute');
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = now.diff(d, 'hour');
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = now.diff(d, 'day');
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return d.format('DD.MM.YYYY');
}

const VN_SHORT_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "19:40" hôm nay / "Hôm qua" / "T5" trong tuần / "18.10" xa hơn — dùng cho danh sách hội thoại. */
export function formatConversationTime(iso: string, now: Dayjs = dayjs()): string {
  const d = dayjs(iso);
  if (isSameDay(d, now)) return d.format('HH:mm');

  const diffDay = now.diff(d, 'day');
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return VN_SHORT_WEEKDAYS[d.day()];

  return d.format('DD.MM');
}
