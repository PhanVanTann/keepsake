import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ZigzagEdge } from '@/components/receipt';
import { Skeleton } from '@/components/loading/Skeleton';
import { colors } from '@/theme/tokens';

/** Loading kiểu "đang in biên lai" — dùng khi tải bảng tin / danh sách bài. */
export function LoadPrint() {
  const reduceMotion = useReducedMotion();
  const dot = useSharedValue(1);
  const cardY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    dot.value = withRepeat(withSequence(withTiming(0.25, { duration: 400 }), withTiming(1, { duration: 400 })), -1);
    cardY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })
      ),
      -1
    );
  }, [reduceMotion, dot, cardY]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));

  return (
    <View className="flex-1 items-center bg-bg pt-16">
      <View style={{ width: 300 }}>
        <View className="z-10 h-[22px] flex-row items-center rounded-full bg-ink px-3">
          <View className="h-1 flex-1 rounded-full bg-[#3A3D44]" />
          <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, marginLeft: 8 }, dotStyle]} />
        </View>

        <Animated.View style={[{ marginTop: -10 }, cardStyle]}>
          <View className="gap-3.5 bg-paper p-[18px]">
            <View className="flex-row items-center gap-2.5">
              <Skeleton width={36} height={36} radius={10} />
              <View className="flex-1 gap-1.5">
                <Skeleton width="60%" height={10} />
                <Skeleton width="40%" height={8} />
              </View>
            </View>
            <Skeleton width="100%" height={150} radius={4} />
            <View className="gap-2.5">
              <Row />
              <Row />
            </View>
          </View>
          <ZigzagEdge width={260} edge="bottom" />
        </Animated.View>
      </View>

      <Text className="mt-7 font-mono-bold text-[13px] tracking-[1.5px] text-muted">ĐANG IN BẢNG TIN…</Text>
    </View>
  );
}

function Row() {
  return (
    <View className="flex-row items-center gap-1.5">
      <Skeleton width={70} height={9} />
      <View className="flex-1 border-b-2 border-dotted border-line" />
      <Skeleton width={48} height={11} />
    </View>
  );
}
