/// <reference types="jest" />

import { breakdownByCategory, breakdownByDay } from './reportStats';
import type { Category, ExpenseTransaction } from '@/types';

const food: Category = { id: 'cat_food', name: 'Ăn uống', icon: 'utensils', isDefault: true, isActive: true };
const transport: Category = { id: 'cat_go', name: 'Đi lại', icon: 'car', isDefault: true, isActive: true };

function txn(category: Category, amount: number, date: string): ExpenseTransaction {
  return { id: `${category.id}_${date}`, cycleId: 'cyc_1', category, amount, transactionType: 'PHOTO_EXPENSE', transactionDate: date };
}

describe('breakdownByCategory', () => {
  it('gộp tổng theo danh mục và tính % giảm dần', () => {
    const result = breakdownByCategory([
      txn(food, 300_000, '2026-10-18T07:00:00+07:00'),
      txn(food, 200_000, '2026-10-17T07:00:00+07:00'),
      txn(transport, 500_000, '2026-10-16T07:00:00+07:00'),
    ]);

    expect(result).toEqual([
      { category: food, total: 500_000, percent: 50 },
      { category: transport, total: 500_000, percent: 50 },
    ]);
  });

  it('mảng rỗng trả về mảng rỗng', () => {
    expect(breakdownByCategory([])).toEqual([]);
  });
});

describe('breakdownByDay', () => {
  it('cộng dồn theo ngày ISO', () => {
    const result = breakdownByDay(
      [txn(food, 50_000, '2026-10-18T07:00:00+07:00'), txn(food, 30_000, '2026-10-18T12:00:00+07:00')],
      ['2026-10-17', '2026-10-18']
    );
    expect(result).toEqual([
      { date: '2026-10-17', total: 0 },
      { date: '2026-10-18', total: 80_000 },
    ]);
  });
});
