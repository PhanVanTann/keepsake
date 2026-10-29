import { supabase } from '@/lib/supabase';
import type { Income, IncomeSource, IncomeStatus } from '@/types';
import type { IncomeRow } from '@/types/database';

function mapIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    cycleId: row.financial_cycle_id,
    name: row.name,
    amount: row.amount,
    source: row.source,
    status: row.status,
    expectedDate: row.expected_date ?? undefined,
    opensNewCycle: row.opens_new_cycle,
    createdAt: row.created_at,
  };
}

export type AddIncomeInput = {
  cycleId: string;
  name: string;
  amount: number;
  source: IncomeSource;
  opensNewCycle: boolean;
};

export const incomeRepo = {
  async getIncomes(cycleId: string): Promise<Income[]> {
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('financial_cycle_id', cycleId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapIncome);
  },

  /** TOP_UP + opensNewCycle: đóng đợt hiện tại, mở đợt mới, cộng tiền dư sang `carriedOverAmount` (RPC add_income). */
  async addIncome(input: AddIncomeInput): Promise<Income> {
    const { data, error } = await supabase.rpc('add_income', {
      p_cycle_id: input.cycleId,
      p_name: input.name,
      p_amount: input.amount,
      p_source: input.source,
      p_opens_new_cycle: input.opensNewCycle,
    });
    if (error) throw error;
    return mapIncome(data);
  },

  /** Trả lời câu hỏi "đã nhận tiền chưa?" cho khoản tiền dự kiến — amount cho phép sửa lại số thực nhận. */
  async confirmIncome(
    incomeId: string,
    status: Extract<IncomeStatus, 'RECEIVED' | 'SKIPPED'>,
    amount?: number
  ): Promise<Income> {
    const patch: { status: IncomeStatus; amount?: number } = { status };
    if (status === 'RECEIVED' && amount !== undefined) patch.amount = Math.max(0, amount);
    const { data, error } = await supabase.from('incomes').update(patch).eq('id', incomeId).select('*').single();
    if (error) throw error;
    return mapIncome(data);
  },
};
