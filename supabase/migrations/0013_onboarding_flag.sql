-- Thoát app giữa màn "Tiền của bạn về thế nào?" (chưa bấm Bắt đầu chụp / Để sau) rồi mở lại thì
-- vào thẳng Camera, bỏ qua bước chọn kiểu tiền về luôn — vì chưa có cách nào phân biệt "chưa từng
-- chọn" với "đã chọn PAYDAY" (PAYDAY là default của money_mode). Thêm cờ rõ ràng để AuthGate biết
-- khi nào cần đẩy lại về màn finance-setup.
alter table public.user_profiles add column onboarding_completed_at timestamptz;
