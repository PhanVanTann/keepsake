-- Đợt 2 — sửa bài có thể đổi "Ai được xem": owner cần xoá được danh sách post_visibility cũ
-- trước khi ghi lại danh sách mới. 0002_rls.sql trước đó chỉ có select + insert cho bảng này.
create policy "post_visibility_delete_owner" on public.post_visibility
  for delete using (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
