import { Briefcase, Ellipsis, GraduationCap, House, type LucideIcon } from 'lucide-react-native';

import { colors } from '@/theme/tokens';
import type { IncomeSource } from '@/types';

export const INCOME_SOURCE_META: Record<IncomeSource, { label: string; icon: LucideIcon; bg: string; fg: string }> = {
  FAMILY: { label: 'Bố mẹ', icon: House, bg: colors.greenBg, fg: colors.green },
  PART_TIME: { label: 'Làm thêm', icon: Briefcase, bg: '#FBF0DC', fg: '#8A5A10' },
  SCHOLARSHIP: { label: 'Học bổng', icon: GraduationCap, bg: '#E3DAF0', fg: '#4A2F73' },
  OTHER: { label: 'Khác', icon: Ellipsis, bg: colors.chip, fg: colors.muted },
};
