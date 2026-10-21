/** "1500000" → "1.500.000" — chỉ phân tách nghìn, không có hậu tố đ. */
export function groupThousands(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const grouped = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped}`;
}

/** Format số tiền nguyên (VNĐ) kiểu "50.000đ". */
export function formatVnd(amount: number): string {
  return `${groupThousands(amount)}đ`;
}

export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}

/** Ngân sách có thể tiêu trong chu kỳ = tổng tiền vào - mục tiêu giữ lại. */
export function calcSpendableBudget(totalIncome: number, targetRemainingAmount: number): number {
  return Math.max(0, totalIncome - targetRemainingAmount);
}

/** Còn được chi trong chu kỳ = ngân sách có thể tiêu - đã chi. Có thể âm (vượt ngân sách). */
export function calcAvailableToSpend(spendableBudget: number, totalExpense: number): number {
  return spendableBudget - totalExpense;
}

/** % đã dùng ngân sách, kẹp 0-100 để vẽ thanh tiến trình. */
export function clampPercent(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

/** Trung bình chi mỗi ngày, từ lúc chu kỳ/đợt bắt đầu tới hôm nay. */
export function calcAverageDailySpend(totalExpense: number, daysElapsed: number): number {
  return daysElapsed > 0 ? totalExpense / daysElapsed : 0;
}

/** Dự kiến số dư cuối chu kỳ nếu giữ nguyên tốc độ chi hiện tại. */
export function calcProjectedEndBalance(
  totalIncome: number,
  averageDailySpend: number,
  totalCycleDays: number
): number {
  return totalIncome - averageDailySpend * totalCycleDays;
}

/** TOP_UP: còn cầm cự được ~N ngày với tốc độ chi hiện tại. */
export function calcRunwayDays(remaining: number, averageDailySpend: number): number {
  if (averageDailySpend <= 0) return Infinity;
  return Math.max(0, Math.round(remaining / averageDailySpend));
}

/** TOP_UP: mỗi ngày nên tiêu dưới bao nhiêu để cầm cự tới ngày tiền về dự kiến (làm tròn xuống nghìn cho dễ nhớ). */
export function calcDailyBudgetUntil(remaining: number, daysUntilExpected: number): number {
  if (daysUntilExpected <= 0) return Math.max(0, remaining);
  return Math.floor(remaining / daysUntilExpected / 1000) * 1000;
}
