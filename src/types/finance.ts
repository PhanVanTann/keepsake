import type { Category } from './category';
import type { MoneyMode } from './user';

export type FinancialCycleStatus = 'CURRENT' | 'CLOSED' | 'FUTURE';

export type FinancialCycle = {
  id: string;
  moneyMode: MoneyMode;
  startDate: string;
  /** Null khi TOP_UP đang mở đợt, chưa có lần tiền về tiếp theo. */
  endDate?: string;
  status: FinancialCycleStatus;
  carriedOverAmount: number;
  closedAt?: string;
};

export type IncomeSource = 'FAMILY' | 'PART_TIME' | 'SCHOLARSHIP' | 'OTHER';
export type IncomeStatus = 'RECEIVED' | 'EXPECTED' | 'SKIPPED';

export type Income = {
  id: string;
  cycleId: string;
  name: string;
  amount: number;
  source: IncomeSource;
  status: IncomeStatus;
  /** Chỉ dùng khi status = EXPECTED — ngày hệ thống sẽ hỏi lại. */
  expectedDate?: string;
  /** TOP_UP: lần ghi tiền vào này có mở đợt mới không. */
  opensNewCycle: boolean;
  createdAt: string;
};

export type SavingGoal = {
  id: string;
  cycleId: string;
  targetRemainingAmount: number;
};

export type ExpenseTransactionType = 'PHOTO_EXPENSE' | 'RECURRING_EXPENSE';

export type ExpenseTransaction = {
  id: string;
  cycleId: string;
  category: Category;
  amount: number;
  transactionType: ExpenseTransactionType;
  /** Bắt buộc có khi transactionType = PHOTO_EXPENSE. */
  postId?: string;
  transactionDate: string;
};

export type RecurringKind = 'INCOME' | 'EXPENSE';

export type RecurringTransaction = {
  id: string;
  name: string;
  amount: number;
  category?: Category;
  kind: RecurringKind;
  /** MVP chỉ hỗ trợ hàng tháng. */
  frequency: 'MONTHLY';
  /** Ngày trong tháng; ngày 31 ở tháng ngắn hơn thì chạy vào ngày cuối tháng. */
  executionDay: number;
  isActive: boolean;
  nextExecutionDate: string;
};
