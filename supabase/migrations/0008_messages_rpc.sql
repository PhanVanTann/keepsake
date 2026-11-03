-- Đợt 5 — nối messageRepo thật + Realtime cho chat live.

-- "Đã xem" cần mốc thời gian đọc cuối — conversation_members đã có last_read_message_id (chưa
-- dùng tới) nhưng tính unread theo timestamp đơn giản hơn nhiều (khỏi join lại messages để lấy
-- sent_at của 1 id). Giữ cột cũ (không ai dùng, không hại gì), thêm cột mới dùng thật.
alter table public.conversation_members add column last_read_at timestamptz;

create policy "conversation_members_update_own" on public.conversation_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Client chỉ được select conversations (0002_rls.sql), không update được last_message_at trực
-- tiếp — trigger này tự cập nhật mỗi khi có message mới, security definer nên không bị RLS chặn.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.sent_at, updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_touch_conversation_on_message
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Mở/tạo hội thoại 1-1 với 1 người bạn — bắt buộc phải là bạn bè (đúng mô hình xã hội đã chốt).
create or replace function public.get_or_create_conversation_with_friend(p_friend_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  if p_friend_id = auth.uid() then
    raise exception 'Không thể tự nhắn cho mình';
  end if;
  if not public.are_friends(auth.uid(), p_friend_id) then
    raise exception 'Chỉ nhắn được cho bạn bè';
  end if;

  select cm1.conversation_id into v_conversation_id
  from public.conversation_members cm1
  join public.conversation_members cm2 on cm2.conversation_id = cm1.conversation_id
  where cm1.user_id = auth.uid() and cm2.user_id = p_friend_id
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations default values returning id into v_conversation_id;
  insert into public.conversation_members (conversation_id, user_id) values
    (v_conversation_id, auth.uid()),
    (v_conversation_id, p_friend_id);

  return v_conversation_id;
end;
$$;
revoke execute on function public.get_or_create_conversation_with_friend(uuid) from public;
grant execute on function public.get_or_create_conversation_with_friend(uuid) to authenticated;

-- Danh sách hội thoại + tên/avatar người kia + preview + số chưa đọc, gộp 1 lần gọi thay vì
-- N round-trip phía client.
create or replace function public.get_my_conversations()
returns table (
  conversation_id uuid,
  friend_id uuid,
  friend_display_name text,
  friend_username text,
  friend_avatar_url text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count bigint
)
language sql stable security definer set search_path = public
as $$
  select
    c.id,
    up.user_id,
    up.display_name,
    up.username,
    up.avatar_url,
    c.last_message_at,
    (
      select m.content from public.messages m
      where m.conversation_id = c.id and m.deleted_at is null
      order by m.sent_at desc limit 1
    ),
    (
      select count(*) from public.messages m
      where m.conversation_id = c.id and m.deleted_at is null
        and m.sender_id <> auth.uid()
        and m.sent_at > coalesce(my_member.last_read_at, 'epoch'::timestamptz)
    )
  from public.conversation_members my_member
  join public.conversations c on c.id = my_member.conversation_id
  join public.conversation_members other_member
    on other_member.conversation_id = c.id and other_member.user_id <> auth.uid()
  join public.user_profiles up on up.user_id = other_member.user_id
  where my_member.user_id = auth.uid()
  order by c.last_message_at desc;
$$;
revoke execute on function public.get_my_conversations() from public;
grant execute on function public.get_my_conversations() to authenticated;

-- Bật Realtime (Postgres Changes) cho bảng messages — chat nhận tin mới không cần poll lại.
alter publication supabase_realtime add table public.messages;
