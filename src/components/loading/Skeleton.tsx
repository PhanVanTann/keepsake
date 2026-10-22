import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

type SkeletonProps = {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Khối xương cá nhấp nháy nhẹ — tôn trọng Reduce Motion (chỉ mờ tĩnh, không nhấp nháy). */
export function Skeleton({ width, height, radius = 3, style }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.6;
      return;
    }
    opacity.value = withRepeat(withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.chip2 }, animatedStyle, style]}
    />
  );
}
