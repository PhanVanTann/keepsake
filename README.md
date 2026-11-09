# Keepsake (Chi Tiêu Nhà)

App mạng xã hội chia sẻ ảnh kiểu Locket, kết hợp sổ chi tiêu. Mở app là camera, chụp ảnh,
tuỳ chọn ghi số tiền, gửi cho bạn bè. Bạn bè xem ảnh, thả cảm xúc, nhắn trả lời. App tự
cộng sổ chi theo chu kỳ (lương đều hoặc tiền vào lúc có lúc không).

Giao diện tiếng Việt, tiền tệ VNĐ. MVP nhắm iOS trước, Android làm sau (cùng codebase
React Native).

## Tech stack

- **Expo (React Native) + TypeScript**, Expo Router (file-based routing trong `src/app`)
- **NativeWind** (Tailwind cho RN)
- **Supabase**: Postgres + Auth + Storage + Realtime + pg_cron (schema ở `supabase/migrations`)
- `@tanstack/react-query` cho data fetching, `zustand` cho state nhỏ, `dayjs` cho ngày giờ
- Font: Be Vietnam Pro (chữ), JetBrains Mono (số tiền, nhãn)

Chi tiết quyết định thiết kế/sản phẩm: xem `CLAUDE.md` ở thư mục gốc repo cha
(`chi-tieu-nha-context/CLAUDE.md`) — đó là nguồn thông tin chính, ưu tiên hơn tài liệu
requirements cũ.

## Trạng thái

- Đã nối Supabase thật (không còn mock) cho posts, friends, expenses, incomes, messages,
  notifications, moderation, profile — xem `src/data/*.ts`.
- RLS + RPC + cron đã có trong `supabase/migrations/0001` → `0015`.
- Đăng nhập Google chạy được; đăng nhập SĐT + OTP chưa xong.
- Chưa có push notification, chưa có crash reporting (Sentry).
- Build native hiện tại ký bằng Apple ID free (`iOS Team Provisioning Profile`) nên chỉ
  chạy được **7 ngày** trên máy thật rồi phải cài lại qua Xcode. Muốn phát rộng hơn (vd
  TestFlight) cần Apple Developer Program trả phí.

## Chạy thử

```bash
npm install
npx expo start
```

Quét QR bằng app **Expo Go** trên iPhone — không cần build native, không bị giới hạn 7
ngày, sửa code thấy ngay. Chỉ cần build native (Xcode/EAS) khi test tính năng Expo Go
không hỗ trợ.

Cần có file `.env` (copy từ `.env.example`, điền URL + anon key từ Supabase Dashboard)
thì các repo trong `src/data` mới gọi được backend thật.

## Cấu trúc

```
src/
  app/          # màn hình, Expo Router (auth, feed, post, expenses, messages, friends, settings, me)
  components/   # component dùng lại: receipt (biên lai), post, expenses, loading, errors
  data/         # repository layer, bọc Supabase — màn hình không import Supabase trực tiếp
  hooks/        # React Query hooks gọi repository
  lib/          # hàm thuần: money.ts, date.ts, privacy.ts, reportStats.ts (có unit test)
  store/        # zustand store nhỏ (draft bài đăng, lời mời đang chờ)
  theme/        # token màu, font
  types/        # types khớp data model (snake_case DB -> camelCase app, map trong repo)
supabase/
  migrations/   # schema, RLS, RPC, cron — nguồn sự thật cho backend
```
