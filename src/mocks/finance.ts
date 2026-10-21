import type { ExpenseTransaction, FinancialCycle, Income, RecurringTransaction, SavingGoal } from '@/types';

import { findCategory } from './categories';

/** Chu kỳ 💼 hiện tại của Văn Tấn — số liệu khớp docs/design/README.md. */
export const currentCycle: FinancialCycle = {
  id: 'cyc_2026_09',
  moneyMode: 'PAYDAY',
  startDate: '2026-09-25',
  endDate: '2026-10-24',
  status: 'CURRENT',
  carriedOverAmount: 0,
};

/** Đợt 🎒 trước đây, trước khi Tấn đổi sang kiểu Đều đặn — minh hoạ lịch sử đổi kiểu tiền về. */
export const previousTopUpCycle: FinancialCycle = {
  id: 'cyc_topup_01',
  moneyMode: 'TOP_UP',
  startDate: '2026-09-01',
  endDate: '2026-09-24',
  status: 'CLOSED',
  carriedOverAmount: 0,
  closedAt: '2026-09-24T23:59:00+07:00',
};

export const financialCycles: FinancialCycle[] = [currentCycle, previousTopUpCycle];

export const incomes: Income[] = [
  {
    id: 'inc_luong_09',
    cycleId: currentCycle.id,
    name: 'Lương',
    amount: 15_000_000,
    source: 'PART_TIME',
    status: 'RECEIVED',
    opensNewCycle: false,
    createdAt: '2026-09-25T08:00:00+07:00',
  },
  {
    id: 'inc_topup_09',
    cycleId: previousTopUpCycle.id,
    name: 'Bố mẹ gửi',
    amount: 3_500_000,
    source: 'FAMILY',
    status: 'RECEIVED',
    opensNewCycle: true,
    createdAt: '2026-09-01T10:00:00+07:00',
  },
  {
    id: 'inc_hocbong_pending',
    cycleId: currentCycle.id,
    name: 'Học bổng',
    amount: 2_000_000,
    source: 'SCHOLARSHIP',
    status: 'EXPECTED',
    expectedDate: '2026-10-15',
    opensNewCycle: false,
    createdAt: '2026-09-25T08:00:00+07:00',
  },
];

export const savingGoals: SavingGoal[] = [
  { id: 'goal_09', cycleId: currentCycle.id, targetRemainingAmount: 3_000_000 },
];

/** Tổng = 9.840.000đ, khớp "đã chi" của chu kỳ hiện tại trong docs/design/README.md. */
export const expenseTransactions: ExpenseTransaction[] = [
  {
    id: 'exp_01',
    cycleId: currentCycle.id,
    category: findCategory('cat_an_uong'),
    amount: 3_200_000,
    transactionType: 'PHOTO_EXPENSE',
    postId: 'post_me_an_uong',
    transactionDate: '2026-10-18T12:40:00+07:00',
  },
  {
    id: 'exp_02',
    cycleId: currentCycle.id,
    category: findCategory('cat_di_lai'),
    amount: 850_000,
    transactionType: 'PHOTO_EXPENSE',
    postId: 'post_me_di_lai',
    transactionDate: '2026-10-15T08:10:00+07:00',
  },
  {
    id: 'exp_03',
    cycleId: currentCycle.id,
    category: findCategory('cat_mua_sam'),
    amount: 2_100_000,
    transactionType: 'PHOTO_EXPENSE',
    postId: 'post_me_mua_sam',
    transactionDate: '2026-10-10T19:20:00+07:00',
  },
  {
    id: 'exp_04',
    cycleId: currentCycle.id,
    category: findCategory('cat_hoa_don'),
    amount: 1_890_000,
    transactionType: 'RECURRING_EXPENSE',
    transactionDate: '2026-10-01T00:05:00+07:00',
  },
  {
    id: 'exp_05',
    cycleId: currentCycle.id,
    category: findCategory('cat_giai_tri'),
    amount: 1_200_000,
    transactionType: 'PHOTO_EXPENSE',
    postId: 'post_me_giai_tri',
    transactionDate: '2026-10-05T21:00:00+07:00',
  },
  {
    id: 'exp_06',
    cycleId: currentCycle.id,
    category: findCategory('cat_suc_khoe'),
    amount: 600_000,
    transactionType: 'PHOTO_EXPENSE',
    postId: 'post_me_suc_khoe',
    transactionDate: '2026-09-29T17:30:00+07:00',
  },
];

export const recurringTransactions: RecurringTransaction[] = [
  {
    id: 'rec_tien_nha',
    name: 'Tiền nhà',
    amount: 2_500_000,
    category: findCategory('cat_hoa_don'),
    kind: 'EXPENSE',
    frequency: 'MONTHLY',
    executionDay: 1,
    isActive: true,
    nextExecutionDate: '2026-11-01',
  },
  {
    id: 'rec_netflix',
    name: 'Netflix',
    amount: 260_000,
    category: findCategory('cat_giai_tri'),
    kind: 'EXPENSE',
    frequency: 'MONTHLY',
    executionDay: 15,
    isActive: true,
    nextExecutionDate: '2026-11-15',
  },
];
