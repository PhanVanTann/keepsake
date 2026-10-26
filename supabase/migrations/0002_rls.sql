-- Row Level Security — "Mọi Financial Data phải kiểm tra User Ownership" (PHASE_3 §25).
-- Bật RLS cho mọi bảng. Đợt 1 chỉ thật sự CẦN policy của user_profiles (profileRepo đã nối),
-- nhưng viết đủ ngay từ đầu để các đợt sau (post/friend/expense/message...) không phải vừa viết
-- query vừa vá bảo mật.

-- ───────────────────────── helper ─────────────────────────
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.user_id_1 = least(a, b) and f.user_id_2 = greatest(a, b)
  );
$$;

create or replace function public.is_blocked_either_way(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.blocks bl
    where (bl.blocker_id = a and bl.blocked_id = b) or (bl.blocker_id = b and bl.blocked_id = a)
  );
$$;

create or replace function public.can_view_post(p public.posts)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p.deleted_at is null and (
    p.user_id = auth.uid()
    or (
      not public.is_blocked_either_way(p.user_id, auth.uid())
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

-- ───────────────────────── user_profiles ─────────────────────────
alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own" on public.user_profiles
  for select using (user_id = auth.uid());
create policy "user_profiles_update_own" on public.user_profiles
  for update using (user_id = auth.uid());
-- Không có insert policy cho client: hàng được tạo bởi trigger handle_new_user (security definer).
-- GHI CHÚ cho đợt 2/3: postRepo/friendRepo cần đọc display_name/avatar của NGƯỜI KHÁC (tác giả bài,
-- bạn bè, người chat) — lúc đó cân nhắc thêm 1 policy select giới hạn cột an toàn (không lộ
-- phone_number/email) qua view riêng, thay vì nới rộng thẳng policy này.

-- ───────────────────────── categories ─────────────────────────
alter table public.categories enable row level security;

create policy "categories_select" on public.categories
  for select using (is_default = true or user_id = auth.uid());
create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid() and is_default = false);
create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid() and is_default = false);

-- ───────────────────────── bạn bè ─────────────────────────
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

create policy "friend_requests_select" on public.friend_requests
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "friend_requests_insert" on public.friend_requests
  for insert with check (sender_id = auth.uid());
create policy "friend_requests_update" on public.friend_requests
  for update using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "friendships_select" on public.friendships
  for select using (auth.uid() in (user_id_1, user_id_2));
-- Ghi friendships nên đi qua hàm RPC security-definer ở đợt 3 (chấp nhận lời mời phải tạo
-- friendship + cập nhật friend_requests.status cùng lúc). Không mở insert/delete trực tiếp ở đây.

-- ───────────────────────── posts ─────────────────────────
alter table public.posts enable row level security;
alter table public.post_visibility enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_views enable row level security;

create policy "posts_select" on public.posts
  for select using (public.can_view_post(posts));
create policy "posts_insert_own" on public.posts
  for insert with check (user_id = auth.uid());
create policy "posts_update_own" on public.posts
  for update using (user_id = auth.uid());

create policy "post_visibility_select" on public.post_visibility
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );
create policy "post_visibility_insert_owner" on public.post_visibility
  for insert with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

create policy "post_reactions_select" on public.post_reactions
  for select using (exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p)));
create policy "post_reactions_write_own" on public.post_reactions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p)));

create policy "post_views_select" on public.post_views
  for select using (
    viewer_id = auth.uid()
    or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );
create policy "post_views_insert_own" on public.post_views
  for insert with check (viewer_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p)));

-- ───────────────────────── sổ chi (ownership tuyệt đối — PHASE_3 §25) ─────────────────────────
alter table public.financial_cycles enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.incomes enable row level security;
alter table public.saving_goals enable row level security;
alter table public.expense_transactions enable row level security;

create policy "financial_cycles_owner" on public.financial_cycles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_transactions_owner" on public.recurring_transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "incomes_owner" on public.incomes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saving_goals_owner" on public.saving_goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expense_transactions_owner" on public.expense_transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────────────────── tin nhắn ─────────────────────────
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_member" on public.conversations
  for select using (exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));

create policy "conversation_members_select" on public.conversation_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.conversation_members m2 where m2.conversation_id = conversation_id and m2.user_id = auth.uid())
  );

create policy "messages_select_member" on public.messages
  for select using (exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy "messages_insert_member" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
  );
create policy "messages_update_member" on public.messages
  for update using (exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));

-- ───────────────────────── thông báo / kiểm duyệt / linh tinh ─────────────────────────
alter table public.device_tokens enable row level security;
alter table public.budget_alerts enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.invite_links enable row level security;

create policy "device_tokens_owner" on public.device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "budget_alerts_select_own" on public.budget_alerts for select using (user_id = auth.uid());
create policy "budget_alerts_update_own" on public.budget_alerts for update using (user_id = auth.uid());
-- Insert do backend (SECURITY DEFINER / cron) tạo ở đợt 7 — không mở insert cho client.

create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid());
-- Insert do trigger/backend tạo (đợt 6) — không mở insert cho client.

create policy "reports_insert_own" on public.reports for insert with check (reporter_id = auth.uid());
-- Không có select policy: chỉ đội ngũ vận hành (qua service role) mới đọc được báo cáo.

create policy "blocks_owner" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "invite_links_select_any" on public.invite_links for select using (true);
create policy "invite_links_insert_own" on public.invite_links for insert with check (inviter_id = auth.uid());
