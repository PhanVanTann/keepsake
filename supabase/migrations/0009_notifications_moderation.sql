-- Đợt 6 — nối notificationRepo + moderationRepo thật.
-- notifications chỉ nhận insert từ trigger/RPC security definer (đã chốt từ đợt 1) — đợt này viết
-- các trigger/điểm chèn đó cho những sự kiện có thể bắt được NGAY (không cần pg_cron): có cảm xúc
-- mới, có tin nhắn mới, có lời mời kết bạn / được đồng ý kết bạn. Thông báo ngân sách 80%/100%/vượt
-- để đợt 7 (cần pg_cron đánh giá theo chu kỳ, không bắt được qua trigger 1 dòng).

-- ───────────────────────── có cảm xúc mới trên bài của mình ─────────────────────────
create or replace function public.notify_new_reaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_author_id uuid;
  v_reactor_name text;
begin
  select user_id into v_author_id from public.posts where id = new.post_id;
  if v_author_id is null or v_author_id = new.user_id then
    return new;
  end if;
  select display_name into v_reactor_name from public.user_profiles where user_id = new.user_id;

  insert into public.notifications (user_id, kind, title, body)
  values (
    v_author_id,
    'REACTION',
    'Có người vừa thả cảm xúc',
    coalesce(v_reactor_name, 'Ai đó') || ' đã thả ' || new.emoji || ' bài đăng của bạn'
  );
  return new;
end;
$$;

create trigger trg_notify_new_reaction
  after insert on public.post_reactions
  for each row execute function public.notify_new_reaction();

-- ───────────────────────── có tin nhắn mới ─────────────────────────
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_recipient_id uuid;
  v_sender_name text;
begin
  select user_id into v_recipient_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id
    limit 1;
  if v_recipient_id is null then
    return new;
  end if;
  select display_name into v_sender_name from public.user_profiles where user_id = new.sender_id;

  insert into public.notifications (user_id, kind, title, body)
  values (
    v_recipient_id,
    case when new.message_type = 'POST_REPLY' then 'POST_REPLY' else 'NEW_MESSAGE' end,
    coalesce(v_sender_name, 'Ai đó') || ' đã gửi tin nhắn',
    coalesce(new.content, 'Đã trả lời bài đăng của bạn')
  );
  return new;
end;
$$;

create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ───────────────────────── có lời mời kết bạn mới ─────────────────────────
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_name text;
begin
  select display_name into v_sender_name from public.user_profiles where user_id = new.sender_id;
  insert into public.notifications (user_id, kind, title, body)
  values (new.receiver_id, 'FRIEND_REQUEST', 'Lời mời kết bạn mới', coalesce(v_sender_name, 'Ai đó') || ' muốn kết bạn với bạn');
  return new;
end;
$$;

create trigger trg_notify_friend_request
  after insert on public.friend_requests
  for each row execute function public.notify_friend_request();

-- ───────────────────────── lời mời được đồng ý — sửa lại respond_to_friend_request ─────────────────────────
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

    insert into public.notifications (user_id, kind, title, body)
    values (
      v_req.sender_id,
      'FRIEND_REQUEST_ACCEPTED',
      'Lời mời đã được đồng ý',
      coalesce((select display_name from public.user_profiles where user_id = v_req.receiver_id), 'Người kia') || ' đã đồng ý kết bạn với bạn'
    );
  end if;
end;
$$;

-- ───────────────────────── kết bạn trực tiếp (QR/invite) — sửa lại add_friend_direct ─────────────────────────
create or replace function public.add_friend_direct(p_other_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_row_count integer;
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
  get diagnostics v_row_count = row_count;

  update public.friend_requests
  set status = 'ACCEPTED', responded_at = now()
  where status = 'PENDING'
    and ((sender_id = auth.uid() and receiver_id = p_other_user_id)
      or (sender_id = p_other_user_id and receiver_id = auth.uid()));

  -- Chỉ báo khi thật sự vừa thành bạn (tránh spam nếu gọi lại khi đã là bạn từ trước).
  if v_row_count > 0 then
    insert into public.notifications (user_id, kind, title, body)
    values (
      p_other_user_id,
      'FRIEND_REQUEST_ACCEPTED',
      'Có bạn mới',
      coalesce((select display_name from public.user_profiles where user_id = auth.uid()), 'Ai đó') || ' đã kết bạn với bạn'
    );
  end if;
end;
$$;
revoke execute on function public.add_friend_direct(uuid) from public;
grant execute on function public.add_friend_direct(uuid) to authenticated;

-- ───────────────────────── chặn người dùng ─────────────────────────
-- "Chặn 1 người — huỷ kết bạn luôn, hai bên không thấy bài và không nhắn tin được" (CLAUDE.md).
-- Client không có quyền xoá friendships trực tiếp (0002_rls.sql) nên phải qua RPC.
create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_blocked_id = auth.uid() then
    raise exception 'Không thể tự chặn chính mình';
  end if;

  insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), p_blocked_id)
  on conflict do nothing;

  delete from public.friendships
  where user_id_1 = least(auth.uid(), p_blocked_id) and user_id_2 = greatest(auth.uid(), p_blocked_id);

  update public.friend_requests
  set status = 'CANCELLED', responded_at = now()
  where status = 'PENDING'
    and ((sender_id = auth.uid() and receiver_id = p_blocked_id)
      or (sender_id = p_blocked_id and receiver_id = auth.uid()));
end;
$$;
revoke execute on function public.block_user(uuid) from public;
grant execute on function public.block_user(uuid) to authenticated;
