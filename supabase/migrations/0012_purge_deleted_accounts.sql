-- "Xoá tài khoản = ẩn ngay, xoá vĩnh viễn sau 30 ngày" (CLAUDE.md) — phần "ẩn ngay" đã xong ở
-- 0011. Đây là phần còn lại: 1 job chạy mỗi đêm, tự tìm ai đã xin xoá ≥ 30 ngày mà chưa đăng nhập
-- lại (đăng nhập lại = requestAccountDeletion không được gọi lại nên deletion_requested_at vẫn
-- còn — restore thật sẽ cần 1 nút "Huỷ yêu cầu xoá" gọi profileRepo.cancelAccountDeletion, màn
-- hình hiện tại chưa có nút đó, chỉ mới có hàm — ghi chú lại để làm sau).
create or replace function public.purge_accounts_pending_deletion()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user record;
begin
  for v_user in
    select user_id from public.user_profiles
    where deletion_requested_at is not null and deletion_requested_at <= now() - interval '30 days'
  loop
    begin
      -- Xoá metadata ảnh trong Storage trước — app không còn tạo được signed URL cho ảnh này nữa.
      delete from storage.objects
      where bucket_id = 'post-images' and (storage.foldername(name))[1] = v_user.user_id::text;

      -- Xoá auth.users kéo theo mọi bảng khác (on delete cascade đã khai từ đợt 1).
      delete from auth.users where id = v_user.user_id;
    exception when others then
      raise warning 'purge_accounts_pending_deletion: lỗi với user %: %', v_user.user_id, sqlerrm;
    end;
  end loop;
end;
$$;

revoke execute on function public.purge_accounts_pending_deletion() from public, anon, authenticated;

-- Chạy 00:15 giờ VN (UTC+7) = 17:15 UTC hôm trước, sau 3 job đã có của đợt 7.
select cron.schedule('purge-deleted-accounts', '15 17 * * *', 'select public.purge_accounts_pending_deletion();');
