import dayjs from 'dayjs';

import { supabase } from '@/lib/supabase';
import type { Category, ExpenseTransaction, FinancialCycle, RecurringKind, RecurringTransaction, SavingGoal } from '@/types';
import type { CategoryRow, ExpenseTransactionRow, FinancialCycleRow, RecurringTransactionRow, SavingGoalRow } from '@/types/database';

type CategoryEmbed = Pick<CategoryRow, 'id' | 'name' | 'icon' | 'is_default' | 'is_active'>;
const RECURRING_SELECT =
  'id, user_id, name, amount, category_id, transaction_kind, frequency, execution_day, is_active, last_executed_at, next_execution_date, created_at, updated_at, deleted_at, category:categories(id, name, icon, is_default, is_active)';

/** Ngày chạy đầu tiên: hôm nay nếu chưa qua ngày đó trong tháng, không thì sang tháng sau — kẹp về ngày cuối tháng nếu tháng ngắn hơn. */
function computeFirstExecutionDate(executionDay: number): string {
  const today = dayjs();
  const clampedThisMonth = Math.min(executionDay, today.daysInMonth());
  let candidate = today.date(clampedThisMonth);
  if (candidate.isBefore(today, 'day')) {
    const nextMonth = today.add(1, 'month');
    candidate = nextMonth.date(Math.min(executionDay, nextMonth.daysInMonth()));
  }
  return candidate.format('YYYY-MM-DD');
}

function mapCategory(row: CategoryEmbed): Category {
  return { id: row.id, name: row.name, icon: row.icon, isDefault: row.is_default, isActive: row.is_active };
}

function mapCycle(row: FinancialCycleRow): FinancialCycle {
  return {
    id: row.id,
    moneyMode: row.money_mode,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    status: row.status,
    carriedOverAmount: row.carried_over_amount,
    closedAt: row.closed_at ?? undefined,
  };
}

function mapSavingGoal(row: SavingGoalRow): SavingGoal {
  return { id: row.id, cycleId: row.financial_cycle_id, targetRemainingAmount: row.target_remaining_amount };
}

function mapTransaction(row: ExpenseTransactionRow & { category: CategoryEmbed }): ExpenseTransaction {
  return {
    id: row.id,
    cycleId: row.financial_cycle_id,
    category: mapCategory(row.category),
    amount: row.amount,
    transactionType: row.transaction_type,
    postId: row.post_id ?? undefined,
    transactionDate: row.transaction_date,
  };
}

function mapRecurring(row: RecurringTransactionRow & { category: CategoryEmbed | null }): RecurringTransaction {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    category: row.category ? mapCategory(row.category) : undefined,
    kind: row.transaction_kind,
    frequency: row.frequency,
    executionDay: row.execution_day,
    isActive: row.is_active,
    nextExecutionDate: row.next_execution_date,
  };
}

const TRANSACTION_SELECT = 'id, user_id, financial_cycle_id, category_id, amount, transaction_type, post_id, recurring_transaction_id, transaction_date, created_at, deleted_at, category:categories(id, name, icon, is_default, is_active)';

export const expenseRepo = {
  /** Danh mục đã nối Supabase thật (postRepo cần category_id thật khi đăng bài EXPENSE). */
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, is_default, is_active')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');
    if (error) throw error;
    return data.map(mapCategory);
  },

  /** Tạo danh mục riêng của mình (is_default=false) — "+ Tạo danh mục" ở Cài đặt. */
  async createCategory(name: string, icon: string): Promise<Category> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error('Chưa đăng nhập.');

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: userData.user.id, name, icon, is_default: false })
      .select('id, name, icon, is_default, is_active')
      .single();
    if (error) throw error;
    return mapCategory(data);
  },

  /** Tự mở chu kỳ đầu tiên nếu user chưa từng có (chưa đăng bài EXPENSE / ghi tiền vào lần nào). */
  async getCurrentCycle(): Promise<FinancialCycle | undefined> {
    const { data, error } = await supabase.rpc('get_or_create_my_current_cycle');
    if (error) throw error;
    return data ? mapCycle(data) : undefined;
  },

  async getCycles(): Promise<FinancialCycle[]> {
    const { data, error } = await supabase.from('financial_cycles').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return data.map(mapCycle);
  },

  async getSavingGoal(cycleId: string): Promise<SavingGoal | undefined> {
    const { data, error } = await supabase.from('saving_goals').select('*').eq('financial_cycle_id', cycleId).maybeSingle();
    if (error) throw error;
    return data ? mapSavingGoal(data) : undefined;
  },

  async getTransactions(cycleId: string): Promise<ExpenseTransaction[]> {
    const { data, error } = await supabase
      .from('expense_transactions')
      .select(TRANSACTION_SELECT)
      .eq('financial_cycle_id', cycleId)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .overrideTypes<(ExpenseTransactionRow & { category: CategoryEmbed })[], { merge: false }>();
    if (error) throw error;
    return data.map(mapTransaction);
  },

  async getTransaction(id: string): Promise<ExpenseTransaction | undefined> {
    const { data, error } = await supabase
      .from('expense_transactions')
      .select(TRANSACTION_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()
      .overrideTypes<(ExpenseTransactionRow & { category: CategoryEmbed }) | null, { merge: false }>();
    if (error) throw error;
    return data ? mapTransaction(data) : undefined;
  },

  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select(RECURRING_SELECT)
      .eq('is_active', true)
      .order('execution_day')
      .overrideTypes<(RecurringTransactionRow & { category: CategoryEmbed | null })[], { merge: false }>();
    if (error) throw error;
    return data.map(mapRecurring);
  },

  /** "+ Thêm khoản định kỳ" ở Cài đặt — tự tính ngày chạy đầu tiên từ `executionDay`. */
  async createRecurringTransaction(input: {
    name: string;
    amount: number;
    kind: RecurringKind;
    categoryId?: string;
    executionDay: number;
  }): Promise<RecurringTransaction> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error('Chưa đăng nhập.');

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: userData.user.id,
        name: input.name,
        amount: Math.max(0, input.amount),
        category_id: input.kind === 'EXPENSE' ? input.categoryId ?? null : null,
        transaction_kind: input.kind,
        execution_day: input.executionDay,
        next_execution_date: computeFirstExecutionDate(input.executionDay),
      })
      .select(RECURRING_SELECT)
      .single()
      .overrideTypes<RecurringTransactionRow & { category: CategoryEmbed | null }, { merge: false }>();
    if (error) throw error;
    return mapRecurring(data);
  },

  /** Số lần mỗi danh mục được dùng, tính trên toàn bộ lịch sử (mọi chu kỳ). */
  async getCategoryUsageCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase.from('expense_transactions').select('category_id').is('deleted_at', null);
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
    }
    return counts;
  },
};
