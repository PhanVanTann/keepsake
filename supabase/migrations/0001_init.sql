-- Chi Tiêu Nhà — schema khởi tạo.
-- Dựa trên docs/requirements/PHASE_3.md + phần "Thay đổi so với PHASE_3" trong CLAUDE.md.
-- Không tạo bảng `users` riêng — Supabase Auth đã quản lý auth.users; user_profiles gộp
-- luôn phần PHASE_3.users (auth_provider, phone_number, email, deleted_at→deletion_requested_at)
-- vào 1 bảng duy nhất, khớp đúng src/types/user.ts (UserProfile).

create extension if not exists pgcrypto;

-- ───────────────────────── user_profiles ─────────────────────────
create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  username text not null unique,
  avatar_url text,
  bio text,
  phone_number text,
  email text,
  money_mode text not null default 'PAYDAY' check (money_mode in ('PAYDAY', 'TOP_UP')),
  next_money_mode text check (next_money_mode in ('PAYDAY', 'TOP_UP')),
  notification_tone text not null default 'PLAYFUL' check (notification_tone in ('PLAYFUL', 'SERIOUS')),
  last_moment_toggle boolean not null default false,
  default_post_privacy text not null default 'FRIENDS' check (default_post_privacy in ('SELF', 'FRIENDS', 'SELECTED_FRIENDS')),
  cycle_start_day smallint not null default 25 check (cycle_start_day between 1 and 31),
  next_cycle_start_day smallint check (next_cycle_start_day between 1 and 31),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── categories ─────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  icon text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── bạn bè ─────────────────────────
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_no_self check (sender_id <> receiver_id)
);
create index friend_requests_receiver_idx on public.friend_requests (receiver_id, status);
-- FR-02: không tạo nhiều pending request giống nhau.
create unique index friend_requests_unique_pending
  on public.friend_requests (sender_id, receiver_id) where status = 'PENDING';

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references auth.users (id) on delete cascade,
  user_id_2 uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_ordered check (user_id_1 < user_id_2),
  unique (user_id_1, user_id_2)
);

-- ───────────────────────── posts ─────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  post_type text not null check (post_type in ('MOMENT', 'EXPENSE')),
  image_url text not null,
  image_thumbnail_url text,
  amount bigint not null default 0 check (amount >= 0),
  content text,
  category_id uuid references public.categories (id),
  latitude numeric,
  longitude numeric,
  location_name text,
  show_location boolean not null default false,
  privacy_type text not null default 'FRIENDS' check (privacy_type in ('SELF', 'FRIENDS', 'SELECTED_FRIENDS')),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint posts_expense_requires_category check (post_type = 'MOMENT' or category_id is not null)
);
create index posts_user_created_idx on public.posts (user_id, created_at);
create index posts_created_idx on public.posts (created_at);
create index posts_privacy_idx on public.posts (privacy_type);

create table public.post_visibility (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '😂', '😮', '😢', '🔥')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_views (
  post_id uuid not null references public.posts (id) on delete cascade,
  viewer_id uuid not null references auth.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (post_id, viewer_id)
);

-- ───────────────────────── sổ chi ─────────────────────────
create table public.financial_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  money_mode text not null check (money_mode in ('PAYDAY', 'TOP_UP')),
  start_date date not null,
  end_date date,
  status text not null default 'CURRENT' check (status in ('CURRENT', 'CLOSED', 'FUTURE')),
  carried_over_amount bigint not null default 0,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
-- CYCLE-01: một user chỉ có một CURRENT cycle.
create unique index financial_cycles_one_current_idx
  on public.financial_cycles (user_id) where status = 'CURRENT';

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount bigint not null check (amount >= 0),
  category_id uuid references public.categories (id),
  transaction_kind text not null check (transaction_kind in ('INCOME', 'EXPENSE')),
  frequency text not null default 'MONTHLY' check (frequency = 'MONTHLY'),
  execution_day smallint not null check (execution_day between 1 and 31),
  is_active boolean not null default true,
  last_executed_at timestamptz,
  next_execution_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index recurring_next_exec_idx on public.recurring_transactions (next_execution_date, is_active);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  financial_cycle_id uuid not null references public.financial_cycles (id) on delete cascade,
  name text not null,
  amount bigint not null check (amount >= 0),
  source text not null check (source in ('FAMILY', 'PART_TIME', 'SCHOLARSHIP', 'OTHER')),
  status text not null default 'RECEIVED' check (status in ('RECEIVED', 'EXPECTED', 'SKIPPED')),
  expected_date date,
  opens_new_cycle boolean not null default false,
  recurring_transaction_id uuid references public.recurring_transactions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.saving_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  financial_cycle_id uuid not null references public.financial_cycles (id) on delete cascade,
  target_remaining_amount bigint not null check (target_remaining_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (financial_cycle_id)
);

create table public.expense_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  financial_cycle_id uuid not null references public.financial_cycles (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  amount bigint not null check (amount >= 0),
  transaction_type text not null check (transaction_type in ('PHOTO_EXPENSE', 'RECURRING_EXPENSE')),
  post_id uuid references public.posts (id) on delete set null,
  recurring_transaction_id uuid references public.recurring_transactions (id),
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expense_photo_requires_post check (
    (transaction_type = 'PHOTO_EXPENSE' and post_id is not null) or
    (transaction_type = 'RECURRING_EXPENSE' and post_id is null)
  )
);
create index expense_user_cycle_idx on public.expense_transactions (user_id, financial_cycle_id);
create index expense_date_idx on public.expense_transactions (transaction_date);
create index expense_category_idx on public.expense_transactions (category_id);

-- ───────────────────────── tin nhắn ─────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index conversations_last_message_idx on public.conversations (last_message_at);

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_message_id uuid,
  unique (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  message_type text not null default 'TEXT' check (message_type in ('TEXT', 'POST_REPLY')),
  content text,
  referenced_post_id uuid references public.posts (id) on delete set null,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  seen_at timestamptz,
  deleted_at timestamptz
);
create index messages_conversation_sent_idx on public.messages (conversation_id, sent_at);

-- ───────────────────────── thông báo / kiểm duyệt / linh tinh ─────────────────────────
create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_token text not null,
  platform text not null default 'IOS' check (platform in ('IOS', 'ANDROID')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_token)
);

create table public.budget_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  financial_cycle_id uuid not null references public.financial_cycles (id) on delete cascade,
  alert_type text not null check (alert_type in ('BUDGET_80_PERCENT', 'BUDGET_100_PERCENT', 'BUDGET_EXCEEDED', 'GOAL_AT_RISK')),
  triggered_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, financial_cycle_id, alert_type)
);

-- Hàng chờ thông báo hiển thị (đổ vào từ trigger/hàm ở các đợt sau — bảng tạo sẵn để không phải
-- thêm migration phá vỡ FK khi nối notificationRepo ở đợt 6). Khớp src/types/notification.ts.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'BUDGET_80_PERCENT', 'BUDGET_100_PERCENT', 'BUDGET_EXCEEDED', 'GOAL_AT_RISK',
    'NEW_MESSAGE', 'FRIEND_REQUEST', 'FRIEND_REQUEST_ACCEPTED', 'INCOME_RECEIVED',
    'REACTION', 'POST_REPLY'
  )),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_created_idx on public.notifications (user_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  reason text not null check (reason in ('INAPPROPRIATE', 'SPAM', 'HARASSMENT', 'SCAM', 'OTHER')),
  created_at timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.invite_links (
  code text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references auth.users (id)
);

-- ───────────────────────── danh mục hệ thống (seed 1 lần) ─────────────────────────
insert into public.categories (name, icon, is_default, is_active) values
  ('Ăn uống', 'utensils', true, true),
  ('Đi lại', 'car', true, true),
  ('Mua sắm', 'shopping-bag', true, true),
  ('Hoá đơn', 'receipt', true, true),
  ('Giải trí', 'popcorn', true, true),
  ('Sức khoẻ', 'heart-pulse', true, true),
  ('Giáo dục', 'graduation-cap', true, true),
  ('Khác', 'ellipsis', true, true);

-- ───────────────────────── trigger: tạo user_profiles khi có user mới ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, display_name, username, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    lower(regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      '[^a-zA-Z0-9]+', '_', 'g'
    )) || '_' || substr(new.id::text, 1, 6),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
