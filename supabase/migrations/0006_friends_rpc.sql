-- Đợt 3 — nối friendRepo thật: tìm theo SĐT/email, lời mời kết bạn, QR/invite link kết bạn ngay.

-- ───────────────────────── mở rộng quyền đọc user_profiles ─────────────────────────
-- Đợt 1 chỉ cho đọc profile của chính mình (ghi chú sẵn trong 0002_rls.sql). Giờ bạn bè/người
-- đang có lời mời qua lại cần thấy display_name/avatar của nhau (danh sách bạn, lời mời đến/đã gửi).
-- Vẫn KHÔNG mở phone_number/email (search vẫn phải qua RPC find_user_by_contact bên dưới).
create policy "user_profiles_select_related" on public.user_profiles
  for select using (
    public.are_friends(auth.uid(), user_id)
    or exists (
      select 1 from public.friend_requests fr
      where (fr.sender_id = auth.uid() and fr.receiver_id = user_id)
         or (fr.sender_id = user_id and fr.receiver_id = auth.uid())
    )
  );

-- ───────────────────────── tìm theo SĐT/email (khớp đúng đủ, không liệt kê) ─────────────────────────
-- SECURITY DEFINER để không phải mở SELECT phone_number/email cho toàn bộ user_profiles — hàm chỉ
-- trả về 1 dòng public-safe khi khớp tuyệt đối, không cho dò theo vài ký tự đầu.
create or replace function public.find_user_by_contact(p_query text)
returns table (user_id uuid, display_name text, username text, avatar_url text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_normalized text := lower(regexp_replace(p_query, '\s+', '', 'g'));
  v_match record;
begin
  if v_normalized = '' then
    return;
  end if;

  select up.user_id, up.display_name, up.username, up.avatar_url into v_match
  from public.user_profiles up
  where up.user_id <> auth.uid()
    and (
      (up.phone_number is not null and lower(regexp_replace(up.phone_number, '\s+', '', 'g')) = v_normalized)
      or (up.email is not null and lower(regexp_replace(up.email, '\s+', '', 'g')) = v_normalized)
    )
  limit 1;

  if v_match.user_id is null or public.are_friends(auth.uid(), v_match.user_id) then
    return;
  end if;

  return query select v_match.user_id, v_match.display_name, v_match.username, v_match.avatar_url;
end;
$$;
revoke execute on function public.find_user_by_contact(text) from public;
grant execute on function public.find_user_by_contact(text) to authenticated;

-- ───────────────────────── xem trước hồ sơ công khai (QR / link mời) ─────────────────────────
-- Cho cả anon gọi được: màn /invite/[code] phải xem trước tên người mời TRƯỚC KHI đăng nhập.
create or replace function public.get_public_profile(p_user_id uuid)
returns table (user_id uuid, display_name text, username text, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select up.user_id, up.display_name, up.username, up.avatar_url
  from public.user_profiles up
  where up.user_id = p_user_id;
$$;
revoke execute on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to authenticated, anon;

-- ───────────────────────── phản hồi lời mời kết bạn ─────────────────────────
create or replace function public.respond_to_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_req public.friend_requests;
begin
  select * into v_req from public.friend_requests where id = p_request_id;
  if not found then
    raise exception 'Không tìm thấy lời mời';
  end if;
  if v_req.receiver_id <> auth.uid() then
    raise exception 'Không có quyền phản hồi lời mời này';
  end if;
  if v_req.status <> 'PENDING' then
    return;
  end if;

  update public.friend_requests
  set status = case when p_accept then 'ACCEPTED' else 'REJECTED' end, responded_at = now()
  where id = p_request_id;

  if p_accept then
    insert into public.friendships (user_id_1, user_id_2)
    values (least(v_req.sender_id, v_req.receiver_id), greatest(v_req.sender_id, v_req.receiver_id))
    on conflict do nothing;
  end if;
end;
$$;
revoke execute on function public.respond_to_friend_request(uuid, boolean) from public;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;

-- ───────────────────────── kết bạn ngay (QR scan) ─────────────────────────
create or replace function public.add_friend_direct(p_other_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_other_user_id = auth.uid() then
    raise exception 'Không thể tự kết bạn với chính mình';
  end if;
  if not exists (select 1 from public.user_profiles where user_id = p_other_user_id) then
    raise exception 'Không tìm thấy người dùng này';
  end if;

  insert into public.friendships (user_id_1, user_id_2)
  values (least(auth.uid(), p_other_user_id), greatest(auth.uid(), p_other_user_id))
  on conflict do nothing;

  -- Dọn lời mời PENDING giữa 2 người (nếu có) vì đã thành bạn trực tiếp rồi.
  update public.friend_requests
  set status = 'ACCEPTED', responded_at = now()
  where status = 'PENDING'
    and ((sender_id = auth.uid() and receiver_id = p_other_user_id)
      or (sender_id = p_other_user_id and receiver_id = auth.uid()));
end;
$$;
revoke execute on function public.add_friend_direct(uuid) from public;
grant execute on function public.add_friend_direct(uuid) to authenticated;

-- ───────────────────────── dùng link mời ─────────────────────────
-- "người nhận bấm = thành bạn luôn" (CLAUDE.md) — không cần đồng ý từ phía inviter.
create or replace function public.redeem_invite_link(p_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_link public.invite_links;
begin
  select * into v_link from public.invite_links where code = p_code;
  if not found then
    raise exception 'Mã mời không tồn tại';
  end if;
  if v_link.expires_at < now() then
    raise exception 'Mã mời đã hết hạn';
  end if;
  if v_link.inviter_id = auth.uid() then
    raise exception 'Không thể dùng link mời của chính mình';
  end if;
  if v_link.used_by is not null and v_link.used_by <> auth.uid() then
    raise exception 'Mã mời đã được dùng';
  end if;

  update public.invite_links set used_by = auth.uid() where code = p_code;
  perform public.add_friend_direct(v_link.inviter_id);

  return v_link.inviter_id;
end;
$$;
revoke execute on function public.redeem_invite_link(text) from public;
grant execute on function public.redeem_invite_link(text) to authenticated;
