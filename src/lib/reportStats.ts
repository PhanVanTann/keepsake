import type { Category, ExpenseTransaction } from '@/types';

export type CategoryBreakdown = {
  category: Category;
  total: number;
  percent: number;
};

/** Gộp tổng chi theo danh mục, sắp xếp giảm dần, kèm % trên tổng. */
export function breakdownByCategory(transactions: ExpenseTransaction[]): CategoryBreakdown[] {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const byId = new Map<string, { category: Category; total: number }>();

  for (const t of transactions) {
    const entry = byId.get(t.category.id);
    if (entry) entry.total += t.amount;
    else byId.set(t.category.id, { category: t.category, total: t.amount });
  }

  return Array.from(byId.values())
    .map((entry) => ({ ...entry, percent: total > 0 ? Math.round((entry.total / total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

export type DailyTotal = { date: string; total: number };

/** Tổng chi theo từng ngày trong danh sách `dates` (định dạng YYYY-MM-DD). */
export function breakdownByDay(transactions: ExpenseTransaction[], dates: string[]): DailyTotal[] {
  return dates.map((date) => ({
    date,
    total: transactions.filter((t) => t.transactionDate.startsWith(date)).reduce((sum, t) => sum + t.amount, 0),
  }));
}
