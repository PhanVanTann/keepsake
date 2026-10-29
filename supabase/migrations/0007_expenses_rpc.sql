-- Đợt 4 — nối expenseRepo + incomeRepo thật.

-- Expenses tab cần LUÔN có 1 CURRENT cycle để hiển thị, kể cả user chưa từng đăng bài EXPENSE
-- hay ghi tiền vào lần nào. get_or_create_current_cycle(uuid) đã có từ đợt 2 (dùng nội bộ cho
-- create_post) nhưng bị revoke hết execute — bọc 1 lớp không tham số để client gọi an toàn
-- (không cho truyền user_id tuỳ ý của người khác).
create or replace function public.get_or_create_my_current_cycle()
returns public.financial_cycles
language plpgsql
security definer set search_path = public
as $$
begin
  return public.get_or_create_current_cycle(auth.uid());
end;
$$;
revoke execute on function public.get_or_create_my_current_cycle() from public;
grant execute on function public.get_or_create_my_current_cycle() to authenticated;

-- Ghi "Tiền vào": nếu TOP_UP + mở đợt mới, đóng chu kỳ hiện tại + tính tiền dư mang sang chu kỳ
-- mới trong 1 transaction (khớp logic đã có ở incomeRepo mock trước khi nối thật).
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

    insert into public.financial_cycles (user_id, money_mode, start_date, status, carried_over_amount)
    values (auth.uid(), v_cycle.money_mode, current_date, 'CURRENT', v_leftover)
    returning id into v_target_cycle_id;
  end if;

  insert into public.incomes (user_id, financial_cycle_id, name, amount, source, status, opens_new_cycle)
  values (auth.uid(), v_target_cycle_id, p_name, greatest(0, p_amount), p_source, 'RECEIVED', p_opens_new_cycle)
  returning * into v_income;

  return v_income;
end;
$$;
revoke execute on function public.add_income(uuid, text, bigint, text, boolean) from public;
grant execute on function public.add_income(uuid, text, bigint, text, boolean) to authenticated;
