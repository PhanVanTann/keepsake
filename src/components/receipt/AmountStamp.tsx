import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/money';

type AmountStampProps = {
  amount: number;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  className?: string;
};

/** Con dấu tiền trên bài: viền đỏ 2px, chữ đỏ mono, xoay -4°. */
export function AmountStamp({ amount, size = 'md', style, className }: AmountStampProps) {
  const fontSize = size === 'md' ? 18 : 14;
  return (
    <View
      style={[{ transform: [{ rotate: '-4deg' }] }, style]}
      className={cn('self-start rounded-md border-2 border-red px-2.5 py-1', className)}>
      <Text style={{ fontSize }} className="font-mono-extrabold text-red">
        {formatVnd(amount)}
      </Text>
    </View>
  );
}
