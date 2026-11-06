-- 2 lỗi phát hiện khi làm màn "Ngày nhận lương" trong Cài đặt:
-- 1. user_profiles.next_money_mode được ghi (màn "Kiểu tiền về") nhưng CHƯA TỪNG được đọc ở đâu —
--    đổi kiểu tiền về không bao giờ có tác dụng thật.
-- 2. next_cycle_start_day tồn tại trong schema từ đợt 1 nhưng chưa dùng tới (chưa có UI, chưa có
--    chỗ áp dụng) — giờ làm cả UI (Cài đặt) lẫn chỗ áp dụng (lúc mở chu kỳ mới).
-- Sửa cả 2 điểm "mở chu kỳ mới": run_payday_cycle_rollover (pg_cron, PAYDAY→PAYDAY hoặc
-- PAYDAY→TOP_UP) và add_income khi opens_new_cycle (TOP_UP→TOP_UP hoặc TOP_UP→PAYDAY).

create or replace function public.run_payday_cycle_rollover()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_row record;
  v_cycle public.financial_cycles;
  v_total_income bigint;
  v_total_expense bigint;
  v_leftover bigint;
  v_new_mode text;
  v_new_day smallint;
  v_next_end date;
begin
  for v_row in
    select up.user_id, up.cycle_start_day, up.next_cycle_start_day, up.next_money_mode, fc.id as cycle_id
    from public.user_profiles up
    join public.financial_cycles fc on fc.user_id = up.user_id and fc.status = 'CURRENT'
    where up.money_mode = 'PAYDAY' and fc.end_date is not null and fc.end_date < current_date
  loop
    begin
      select * into v_cycle from public.financial_cycles where id = v_row.cycle_id;

      select coalesce(sum(amount), 0) into v_total_income from public.incomes
        where financial_cycle_id = v_cycle.id and status = 'RECEIVED' and deleted_at is null;
      select coalesce(sum(amount), 0) into v_total_expense from public.expense_transactions
        where financial_cycle_id = v_cycle.id and deleted_at is null;
      v_leftover := greatest(0, v_cycle.carried_over_amount + v_total_income - v_total_expense);

      update public.financial_cycles set status = 'CLOSED', closed_at = now() where id = v_cycle.id;

      v_new_mode := coalesce(v_row.next_money_mode, 'PAYDAY');
      v_new_day := coalesce(v_row.next_cycle_start_day, v_row.cycle_start_day);

      if v_new_mode = 'PAYDAY' then
        v_next_end := public.clamp_day_to_month(
          extract(year from current_date + interval '1 month')::int,
          extract(month from current_date + interval '1 month')::int,
          v_new_day
        ) - 1;
      else
        v_next_end := null;
      end if;

      insert into public.financial_cycles (user_id, money_mode, start_date, end_date, status, carried_over_amount)
      values (v_row.user_id, v_new_mode, current_date, v_next_end, 'CURRENT', v_leftover);

      update public.user_profiles
      set money_mode = v_new_mode, cycle_start_day = v_new_day, next_money_mode = null, next_cycle_start_day = null
      where user_id = v_row.user_id;
    exception when others then
      raise warning 'run_payday_cycle_rollover: lỗi với user %: %', v_row.user_id, sqlerrm;
    end;
  end loop;
end;
$$;

create or replace function public.add_income(
  p_cycle_id uuid,
  p_name text,
  p_amount bigint,
  p_source text,
  p_opens_new_cycle boolean
)
returns public.incomes
language plpgsql
security definer set search_path = public
as $$
declare
  v_cycle public.financial_cycles;
  v_target_cycle_id uuid := p_cycle_id;
  v_income public.incomes;
  v_total_income bigint;
  v_total_expense bigint;
  v_leftover bigint;
  v_profile public.user_profiles;
  v_new_mode text;
  v_new_day smallint;
  v_next_end date;
begin
  select * into v_cycle from public.financial_cycles where id = p_cycle_id and user_id = auth.uid();
  if not found then
    raise exception 'Không tìm thấy chu kỳ';
  end if;

  if p_opens_new_cycle and v_cycle.status = 'CURRENT' then
    select coalesce(sum(amount), 0) into v_total_income from public.incomes
      where financial_cycle_id = v_cycle.id and status = 'RECEIVED' and deleted_at is null;
    select coalesce(sum(amount), 0) into v_total_expense from public.expense_transactions
      where financial_cycle_id = v_cycle.id and deleted_at is null;
    v_leftover := greatest(0, v_cycle.carried_over_amount + v_total_income - v_total_expense);

    update public.financial_cycles
    set status = 'CLOSED', end_date = current_date, closed_at = now()
    where id = v_cycle.id;

    select * into v_profile from public.user_profiles where user_id = auth.uid();
    v_new_mode := coalesce(v_profile.next_money_mode, v_cycle.money_mode);
    v_new_day := coalesce(v_profile.next_cycle_start_day, v_profile.cycle_start_day);

    if v_new_mode = 'PAYDAY' then
      v_next_end := public.clamp_day_to_month(
        extract(year from current_date + interval '1 month')::int,
        extract(month from current_date + interval '1 month')::int,
        v_new_day
      ) - 1;
    else
      v_next_end := null;
    end if;

    insert into public.financial_cycles (user_id, money_mode, start_date, end_date, status, carried_over_amount)
    values (auth.uid(), v_new_mode, current_date, v_next_end, 'CURRENT', v_leftover)
    returning id into v_target_cycle_id;

    update public.user_profiles
    set money_mode = v_new_mode, cycle_start_day = v_new_day, next_money_mode = null, next_cycle_start_day = null
    where user_id = auth.uid();
  end if;

  insert into public.incomes (user_id, financial_cycle_id, name, amount, source, status, opens_new_cycle)
  values (auth.uid(), v_target_cycle_id, p_name, greatest(0, p_amount), p_source, 'RECEIVED', p_opens_new_cycle)
  returning * into v_income;

  return v_income;
end;
$$;
