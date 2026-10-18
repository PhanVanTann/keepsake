import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';

import { ZigzagEdge } from './ZigzagEdge';

type ReceiptProps = {
  children: ReactNode;
  zigzagTop?: boolean;
  zigzagBottom?: boolean;
  className?: string;
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
};

/** Thẻ biên lai: nền trắng, góc gần vuông, mép răng cưa trên/dưới (tuỳ chọn). */
export function Receipt({
  children,
  zigzagTop = false,
  zigzagBottom = true,
  className,
  contentClassName,
  style,
}: ReceiptProps) {
  const [width, setWidth] = useState(0);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} className={className} style={style}>
      {zigzagTop && <ZigzagEdge width={width} edge="top" />}
      <View className={cn('rounded-receipt bg-paper', contentClassName)}>{children}</View>
      {zigzagBottom && <ZigzagEdge width={width} edge="bottom" />}
    </View>
  );
}
