-- Ảnh đại diện thật (trước giờ chỉ hiện chữ cái đầu tên). Bucket PUBLIC — khác với post-images:
-- avatar không nhạy cảm, nhiều chỗ cần hiện cho người CHƯA đăng nhập (màn xem trước link mời,
-- /invite/[code] gọi được qua anon) nên dùng thẳng URL công khai, khỏi phải ký URL ở mọi nơi.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_insert_own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Đọc: bucket public nên ai cũng xem được qua URL /object/public/... (không cần policy select
-- riêng), nhưng vẫn khai 1 policy select tường minh cho rõ ý định + phòng khi đổi bucket về private sau này.
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');
