-- Storage cho ảnh bài đăng. Bucket private — đọc phải qua signed URL hoặc đúng policy dưới.
-- Quy ước path (áp dụng từ đợt 2 khi nối postRepo thật): `${auth.uid()}/${postId}.jpg`,
-- và cột posts.image_url lưu ĐÚNG path này (không lưu URL đầy đủ) để policy select so khớp được.

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', false)
on conflict (id) do nothing;

create policy "post_images_insert_own" on storage.objects
  for insert with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_images_update_own" on storage.objects
  for update using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_images_delete_own" on storage.objects
  for delete using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Đọc: chủ ảnh luôn được; người khác chỉ khi có bài đăng dùng đúng path này và họ được xem bài đó
-- (dùng lại public.can_view_post từ 0002_rls.sql).
create policy "post_images_select" on storage.objects
  for select using (
    bucket_id = 'post-images' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.posts p
        where p.image_url = storage.objects.name and public.can_view_post(p)
      )
    )
  );
