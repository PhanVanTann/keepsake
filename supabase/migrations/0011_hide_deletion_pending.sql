-- "Xoá tài khoản = ẩn ngay" (CLAUDE.md) — requestAccountDeletion (đợt 1) chỉ set
-- deletion_requested_at trên user_profiles, chưa có gì THỰC SỰ ẩn người đó khỏi tìm kiếm/QR/bài
-- đăng/bạn bè. Vá lại các điểm đọc liên quan tới người khác (không đụng user_profiles_select_own —
-- người xoá vẫn phải tự xem được hồ sơ mình trong 30 ngày để khôi phục).

create or replace function public.can_view_post(p public.posts)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p.deleted_at is null and (
    p.user_id = auth.uid()
    or (
      not exists (
        select 1 from public.user_profiles up where up.user_id = p.user_id and up.deletion_requested_at is not null
      )
      and not public.is_blocked_either_way(p.user_id, auth.uid())
      and public.are_friends(p.user_id, auth.uid())
      and (
        p.privacy_type = 'FRIENDS'
        or (p.privacy_type = 'SELECTED_FRIENDS' and exists (
          select 1 from public.post_visibility pv where pv.post_id = p.id and pv.user_id = auth.uid()
        ))
      )
    )
  );
$$;

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
    and up.deletion_requested_at is null
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

create or replace function public.get_public_profile(p_user_id uuid)
returns table (user_id uuid, display_name text, username text, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select up.user_id, up.display_name, up.username, up.avatar_url
  from public.user_profiles up
  where up.user_id = p_user_id and up.deletion_requested_at is null;
$$;

drop policy "user_profiles_select_related" on public.user_profiles;
create policy "user_profiles_select_related" on public.user_profiles
  for select using (
    deletion_requested_at is null
    and (
      public.are_friends(auth.uid(), user_id)
      or exists (
        select 1 from public.friend_requests fr
        where (fr.sender_id = auth.uid() and fr.receiver_id = user_id)
           or (fr.sender_id = user_id and fr.receiver_id = auth.uid())
      )
    )
  );
