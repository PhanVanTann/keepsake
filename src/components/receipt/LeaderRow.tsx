import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

type LeaderRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
};

/** Dòng kiểu hoá đơn: "Tên ........ 50.000đ" — leader là border-bottom chấm. */
export function LeaderRow({ label, value, valueClassName, className }: LeaderRowProps) {
  return (
    <View className={cn('flex-row items-baseline gap-1.5', className)}>
      <Text className="font-display text-[13px] text-ink">{label}</Text>
      <View className="mb-[3px] flex-1 border-b-2 border-dotted border-dot" />
      <Text className={cn('font-mono-bold text-[13px] text-ink', valueClassName)}>{value}</Text>
    </View>
  );
}
