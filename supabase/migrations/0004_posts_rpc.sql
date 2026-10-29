-- Đợt 2 — nối postRepo thật: ảnh lên Storage + RPC create_post (post + expense_transaction
-- + post_visibility trong 1 transaction, theo PHASE_3 §21).

-- ───────────────────────── trỏ lại FK để PostgREST embed được author ─────────────────────────
-- posts.user_id / post_reactions.user_id / post_views.viewer_id ban đầu trỏ thẳng auth.users —
-- PostgREST không thể embed user_profiles qua đó (2 bảng cùng tham chiếu auth.users, không phải
-- quan hệ cha-con trực tiếp). Trỏ lại sang public.user_profiles(user_id) (vẫn cascade đúng vì
-- user_profiles đã cascade từ auth.users) để `.select('author:user_profiles!posts_user_id_fkey(...)')`
-- dùng được.
alter table public.posts
  drop constraint posts_user_id_fkey,
  add constraint posts_user_id_fkey foreign key (user_id) references public.user_profiles (user_id) on delete cascade;

alter table public.post_reactions
  drop constraint post_reactions_user_id_fkey,
  add constraint post_reactions_user_id_fkey foreign key (user_id) references public.user_profiles (user_id) on delete cascade;

alter table public.post_views
  drop constraint post_views_viewer_id_fkey,
  add constraint post_views_viewer_id_fkey foreign key (viewer_id) references public.user_profiles (user_id) on delete cascade;

-- ───────────────────────── bootstrap chu kỳ (tối thiểu cho đợt 2) ─────────────────────────
-- Đợt 4 sẽ làm đầy đủ vòng đời chu kỳ (đóng/mở theo ngày lương, rollover TOP_UP...). Ở đây chỉ
-- cần đủ để 1 bài EXPENSE luôn có financial_cycle_id hợp lệ, kể cả khi user chưa từng ghi gì.
create or replace function public.get_or_create_current_cycle(p_user_id uuid)
returns public.financial_cycles
language plpgsql
security definer set search_path = public
as $$
declare
  v_cycle public.financial_cycles;
  v_mode text;
begin
  select * into v_cycle from public.financial_cycles
  where user_id = p_user_id and status = 'CURRENT'
  limit 1;

  if found then
    return v_cycle;
  end if;

  select money_mode into v_mode from public.user_profiles where user_id = p_user_id;

  insert into public.financial_cycles (user_id, money_mode, start_date, status, carried_over_amount)
  values (p_user_id, coalesce(v_mode, 'PAYDAY'), current_date, 'CURRENT', 0)
  returning * into v_cycle;

  return v_cycle;
end;
$$;

-- Chỉ create_post (cũng security definer, nên gọi nội bộ không bị chặn) được dùng hàm này —
-- không cho client gọi trực tiếp (sẽ tạo chu kỳ hộ bất kỳ user_id nào nếu không revoke).
revoke execute on function public.get_or_create_current_cycle(uuid) from public;

-- ───────────────────────── create_post RPC ─────────────────────────
create or replace function public.create_post(
  p_post_type text,
  p_image_path text,
  p_amount bigint,
  p_content text,
  p_category_id uuid,
  p_location_name text,
  p_show_location boolean,
  p_privacy_type text,
  p_selected_friend_ids uuid[]
)
returns public.posts
language plpgsql
security definer set search_path = public
as $$
declare
  v_post public.posts;
  v_cycle public.financial_cycles;
  v_friend_id uuid;
begin
  if p_post_type not in ('MOMENT', 'EXPENSE') then
    raise exception 'post_type không hợp lệ: %', p_post_type;
  end if;
  if p_post_type = 'EXPENSE' and p_category_id is null then
    raise exception 'Khoản chi cần chọn danh mục';
  end if;

  insert into public.posts (
    user_id, post_type, image_url, amount, content, category_id,
    location_name, show_location, privacy_type
  ) values (
    auth.uid(),
    p_post_type,
    p_image_path,
    case when p_post_type = 'MOMENT' then 0 else greatest(0, p_amount) end,
    p_content,
    case when p_post_type = 'EXPENSE' then p_category_id else null end,
    p_location_name,
    p_show_location,
    coalesce(p_privacy_type, 'FRIENDS')
  )
  returning * into v_post;

  if p_privacy_type = 'SELECTED_FRIENDS' and p_selected_friend_ids is not null then
    foreach v_friend_id in array p_selected_friend_ids loop
      insert into public.post_visibility (post_id, user_id) values (v_post.id, v_friend_id)
      on conflict do nothing;
    end loop;
  end if;

  if p_post_type = 'EXPENSE' then
    v_cycle := public.get_or_create_current_cycle(auth.uid());
    insert into public.expense_transactions (
      user_id, financial_cycle_id, category_id, amount, transaction_type, post_id, transaction_date
    ) values (
      auth.uid(), v_cycle.id, p_category_id, v_post.amount, 'PHOTO_EXPENSE', v_post.id, v_post.created_at
    );
  end if;

  return v_post;
end;
$$;

revoke execute on function public.create_post(text, text, bigint, text, uuid, text, boolean, text, uuid[]) from public;
grant execute on function public.create_post(text, text, bigint, text, uuid, text, boolean, text, uuid[]) to authenticated;
