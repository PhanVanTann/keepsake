/// <reference types="jest" />

import {
  calcAverageDailySpend,
  calcAvailableToSpend,
  calcDailyBudgetUntil,
  calcProjectedEndBalance,
  calcRunwayDays,
  calcSpendableBudget,
  clampPercent,
  formatVnd,
  sumAmounts,
} from './money';

describe('formatVnd', () => {
  it('formats với dấu chấm ngăn cách nghìn và hậu tố đ', () => {
    expect(formatVnd(50000)).toBe('50.000đ');
    expect(formatVnd(1500000)).toBe('1.500.000đ');
  });

  it('làm tròn số thập phân', () => {
    expect(formatVnd(50000.6)).toBe('50.001đ');
  });

  it('giữ dấu trừ khi âm', () => {
    expect(formatVnd(-320000)).toBe('-320.000đ');
  });

  it('xử lý 0', () => {
    expect(formatVnd(0)).toBe('0đ');
  });
});

describe('sumAmounts', () => {
  it('cộng tổng mảng số tiền', () => {
    expect(sumAmounts([3_200_000, 850_000, 2_100_000])).toBe(6_150_000);
  });

  it('mảng rỗng trả về 0', () => {
    expect(sumAmounts([])).toBe(0);
  });
});

describe('calcSpendableBudget', () => {
  it('trừ mục tiêu giữ lại khỏi tổng tiền vào', () => {
    expect(calcSpendableBudget(15_000_000, 3_000_000)).toBe(12_000_000);
  });

  it('không âm kể cả khi mục tiêu lớn hơn tổng tiền vào', () => {
    expect(calcSpendableBudget(5_000_000, 10_000_000)).toBe(0);
  });
});

describe('calcAvailableToSpend', () => {
  it('trừ đã chi khỏi ngân sách có thể tiêu', () => {
    expect(calcAvailableToSpend(12_000_000, 9_840_000)).toBe(2_160_000);
  });

  it('cho phép âm khi vượt ngân sách', () => {
    expect(calcAvailableToSpend(12_000_000, 12_500_000)).toBe(-500_000);
  });
});

describe('clampPercent', () => {
  it('đổi tỉ lệ sang % làm tròn', () => {
    expect(clampPercent(0.82)).toBe(82);
  });

  it('kẹp trong khoảng 0-100', () => {
    expect(clampPercent(1.4)).toBe(100);
    expect(clampPercent(-0.2)).toBe(0);
  });
});

describe('calcAverageDailySpend / calcProjectedEndBalance', () => {
  it('khớp ví dụ chu kỳ 💼 trong docs/design/README.md', () => {
    const avg = calcAverageDailySpend(9_840_000, 24);
    expect(avg).toBe(410_000);
    expect(calcProjectedEndBalance(15_000_000, avg, 30)).toBe(2_700_000);
  });
});

describe('calcRunwayDays / calcDailyBudgetUntil', () => {
  it('khớp ví dụ đợt 🎒 trong docs/design/README.md', () => {
    const avg = calcAverageDailySpend(2_880_000, 18);
    expect(avg).toBe(160_000);
    expect(calcRunwayDays(620_000, avg)).toBe(4);
    expect(calcDailyBudgetUntil(620_000, 14)).toBe(44_000);
  });

  it('không chi gì thì coi như vô hạn ngày', () => {
    expect(calcRunwayDays(500_000, 0)).toBe(Infinity);
  });
});
