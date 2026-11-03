-- Đợt 7 (phần 1) — pg_cron: tự đóng/mở chu kỳ PAYDAY, tự chạy chi định kỳ, tự đánh giá ngân sách.
-- Không đụng tới OTP SĐT / push — 2 phần đó cần bạn chọn nhà cung cấp trước (xem chat).

create extension if not exists pg_cron;

-- Ngày trong tháng, kẹp về ngày cuối tháng nếu tháng đó ngắn hơn (vd ngày 31 ở tháng 2).
create or replace function public.clamp_day_to_month(p_year int, p_month int, p_day int)
returns date
language sql
immutable
as $$
  select least(
    make_date(p_year, p_month, 1) + (p_day - 1),
    (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date
  );
$$;

-- Sửa lại get_or_create_current_cycle (đợt 2): PAYDAY giờ tính đúng end_date (ngày lương kế tiếp
-- trừ 1) ngay từ lúc mở chu kỳ đầu tiên — trước đây để NULL, làm PaydayDashboard hiển thị sai (coi
-- chu kỳ chỉ có 1 ngày vì không có end_date để tính tổng số ngày).
create or replace function public.get_or_create_current_cycle(p_user_id uuid)
returns public.financial_cycles
language plpgsql
security definer set search_path = public
as $$
declare
  v_cycle public.financial_cycles;
  v_mode text;
  v_cycle_start_day smallint;
  v_end_date date;
begin
  select * into v_cycle from public.financial_cycles
  where user_id = p_user_id and status = 'CURRENT'
  limit 1;

  if found then
    return v_cycle;
  end if;

  select money_mode, cycle_start_day into v_mode, v_cycle_start_day from public.user_profiles where user_id = p_user_id;
  v_mode := coalesce(v_mode, 'PAYDAY');

  if v_mode = 'PAYDAY' then
    v_end_date := public.clamp_day_to_month(
      extract(year from current_date + interval '1 month')::int,
      extract(month from current_date + interval '1 month')::int,
      coalesce(v_cycle_start_day, 25)
    ) - 1;
  else
    v_end_date := null;
  end if;

  insert into public.financial_cycles (user_id, money_mode, start_date, end_date, status, carried_over_amount)
  values (p_user_id, v_mode, current_date, v_end_date, 'CURRENT', 0)
  returning * into v_cycle;

  return v_cycle;
end;
$$;

-- ───────────────────────── 1. đóng/mở chu kỳ PAYDAY đúng ngày lương ─────────────────────────
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
  v_next_end date;
begin
  for v_row in
    select up.user_id, up.cycle_start_day, fc.id as cycle_id
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

      v_next_end := public.clamp_day_to_month(
        extract(year from current_date + interval '1 month')::int,
        extract(month from current_date + interval '1 month')::int,
        v_row.cycle_start_day
      ) - 1;

      insert into public.financial_cycles (user_id, money_mode, start_date, end_date, status, carried_over_amount)
      values (v_row.user_id, 'PAYDAY', current_date, v_next_end, 'CURRENT', v_leftover);
    exception when others then
      raise warning 'run_payday_cycle_rollover: lỗi với user %: %', v_row.user_id, sqlerrm;
    end;
  end loop;
end;
$$;

-- ───────────────────────── 2. chạy chi định kỳ đúng ngày ─────────────────────────
create or replace function public.run_recurring_transactions()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
  v_cycle public.financial_cycles;
  v_next date;
begin
  for r in
    select * from public.recurring_transactions
    where is_active = true and deleted_at is null and next_execution_date <= current_date
  loop
    begin
      v_cycle := public.get_or_create_current_cycle(r.user_id);

      if r.transaction_kind = 'EXPENSE' then
        insert into public.expense_transactions (
          user_id, financial_cycle_id, category_id, amount, transaction_type, recurring_transaction_id, transaction_date
        ) values (
          r.user_id, v_cycle.id, r.category_id, r.amount, 'RECURRING_EXPENSE', r.id, now()
        );
      else
        -- Thu nhập định kỳ chỉ ghi ở trạng thái EXPECTED — CLAUDE.md: "khoản dự kiến chỉ HỎI khi
        -- tới ngày, không tự ghi". Màn Tiền vào đã có sẵn ConfirmIncomeModal để hỏi tiếp.
        insert into public.incomes (
          user_id, financial_cycle_id, name, amount, source, status, expected_date, opens_new_cycle, recurring_transaction_id
        ) values (
          r.user_id, v_cycle.id, r.name, r.amount, 'OTHER', 'EXPECTED', current_date, false, r.id
        );
      end if;

      v_next := public.clamp_day_to_month(
        extract(year from r.next_execution_date + interval '1 month')::int,
        extract(month from r.next_execution_date + interval '1 month')::int,
        r.execution_day
      );

      update public.recurring_transactions
      set last_executed_at = now(), next_execution_date = v_next
      where id = r.id;
    exception when others then
      raise warning 'run_recurring_transactions: lỗi với recurring_transaction %: %', r.id, sqlerrm;
    end;
  end loop;
end;
$$;

-- ───────────────────────── 3. đánh giá ngân sách PAYDAY (80% / 100% / vượt / mục tiêu) ─────────────────────────
-- TOP_UP không cần: cảnh báo "sắp cạn ví" đã tính sống ngay trên TopUpDashboard, không cần lưu.
create or replace function public.run_budget_alerts()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  v_target bigint;
  v_total_income bigint;
  v_total_expense bigint;
  v_spendable bigint;
  v_used_ratio numeric;
  v_total_days int;
  v_days_elapsed int;
  v_avg_daily numeric;
  v_projected bigint;
  v_alert_type text;
  v_tone text;
  v_title text;
  v_body text;
begin
  for c in
    select fc.id, fc.user_id, fc.start_date, fc.end_date, fc.carried_over_amount, up.notification_tone
    from public.financial_cycles fc
    join public.user_profiles up on up.user_id = fc.user_id
    where fc.status = 'CURRENT' and fc.money_mode = 'PAYDAY' and fc.end_date is not null
  loop
    begin
      select coalesce(sum(target_remaining_amount), 0) into v_target from public.saving_goals where financial_cycle_id = c.id;
      select coalesce(sum(amount), 0) into v_total_income from public.incomes
        where financial_cycle_id = c.id and status = 'RECEIVED' and deleted_at is null;
      select coalesce(sum(amount), 0) into v_total_expense from public.expense_transactions
        where financial_cycle_id = c.id and deleted_at is null;

      v_spendable := greatest(0, v_total_income - v_target);
      v_used_ratio := case when v_spendable > 0 then v_total_expense::numeric / v_spendable else 0 end;

      v_total_days := greatest(1, (c.end_date - c.start_date) + 1);
      v_days_elapsed := greatest(1, least(v_total_days, (current_date - c.start_date) + 1));
      v_avg_daily := v_total_expense::numeric / v_days_elapsed;
      v_projected := round(v_total_income - v_avg_daily * v_total_days);

      v_alert_type := null;
      if v_total_expense > v_spendable then
        v_alert_type := 'BUDGET_EXCEEDED';
      elsif v_used_ratio >= 1.0 then
        v_alert_type := 'BUDGET_100_PERCENT';
      elsif v_used_ratio >= 0.8 then
        v_alert_type := 'BUDGET_80_PERCENT';
      end if;

      if v_alert_type is not null then
        v_tone := coalesce(c.notification_tone, 'PLAYFUL');
        if v_alert_type = 'BUDGET_EXCEEDED' then
          v_title := 'Vượt ngân sách';
          v_body := case when v_tone = 'PLAYFUL' then 'Hết tiền rồi nha. Từ giờ là mì gói arc 🍜' else 'Bạn đã chi vượt ngân sách chu kỳ này.' end;
        elsif v_alert_type = 'BUDGET_100_PERCENT' then
          v_title := 'Đã dùng hết ngân sách';
          v_body := case when v_tone = 'PLAYFUL' then 'Trân châu sắp thành cổ đông của bạn 🧋' else 'Bạn đã dùng 100% ngân sách chu kỳ này.' end;
        else
          v_title := 'Gần hết ngân sách';
          v_body := case when v_tone = 'PLAYFUL' then 'Ví đang thở oxy rồi đó 😮‍💨' else 'Bạn đã dùng khoảng 80% ngân sách chu kỳ này.' end;
        end if;

        insert into public.budget_alerts (user_id, financial_cycle_id, alert_type, triggered_at)
        values (c.user_id, c.id, v_alert_type, now())
        on conflict (user_id, financial_cycle_id, alert_type) do nothing;

        if found then
          insert into public.notifications (user_id, kind, title, body) values (c.user_id, v_alert_type, v_title, v_body);
        end if;
      end if;

      if v_target > 0 and (v_target - v_projected) > 0 then
        insert into public.budget_alerts (user_id, financial_cycle_id, alert_type, triggered_at)
        values (c.user_id, c.id, 'GOAL_AT_RISK', now())
        on conflict (user_id, financial_cycle_id, alert_type) do nothing;

        if found then
          insert into public.notifications (user_id, kind, title, body)
          values (c.user_id, 'GOAL_AT_RISK', 'Mục tiêu có thể không đạt', 'Giữ nhịp chi này, cuối kỳ sẽ thiếu so với mục tiêu giữ lại.');
        end if;
      end if;
    exception when others then
      raise warning 'run_budget_alerts: lỗi với cycle %: %', c.id, sqlerrm;
    end;
  end loop;
end;
$$;

-- Khoá hết 3 hàm trên — chỉ pg_cron (chạy nội bộ, không qua PostgREST) được gọi, không lộ qua RPC.
revoke execute on function public.run_payday_cycle_rollover() from public, anon, authenticated;
revoke execute on function public.run_recurring_transactions() from public, anon, authenticated;
revoke execute on function public.run_budget_alerts() from public, anon, authenticated;

-- Chạy 00:00 / 00:05 / 00:10 giờ VN (UTC+7) = 17:00 / 17:05 / 17:10 UTC hôm trước.
select cron.schedule('payday-cycle-rollover', '0 17 * * *', 'select public.run_payday_cycle_rollover();');
select cron.schedule('recurring-transactions', '5 17 * * *', 'select public.run_recurring_transactions();');
select cron.schedule('budget-alerts', '10 17 * * *', 'select public.run_budget_alerts();');
