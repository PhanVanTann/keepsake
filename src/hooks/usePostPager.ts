import { useEffect, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const VELOCITY_THRESHOLD = 800;
// withTiming (không phải withSpring) — spring dễ nảy qua nảy lại khi buông tay, timing luôn tới
// đích 1 lần rồi dừng, không lắc.
const SETTLE_CONFIG = { duration: 260, easing: Easing.out(Easing.cubic) };

type UsePostPagerOptions = {
  length: number;
  /** Vuốt xuống khi đang ở bài đầu tiên — dùng để quay về camera. */
  onExitTop: () => void;
};

/**
 * Vuốt liên tục kiểu Reels/Locket: cả danh sách bài là 1 cột dài, chạm vào đâu là trượt theo
 * ngón tay tới đó, buông ra thì trượt êm 1 lần về đúng trang gần nhất (dựa theo khoảng cách +
 * vận tốc vuốt) rồi dừng hẳn — dùng withTiming chứ không withSpring để khỏi lắc qua lắc lại.
 */
export function usePostPager({ length, onExitTop }: UsePostPagerOptions) {
  const [index, setIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const translateY = useSharedValue(0);
  const pageHeightShared = useSharedValue(0);
  const indexShared = useSharedValue(0);
  const lengthShared = useSharedValue(length);

  useEffect(() => {
    pageHeightShared.value = pageHeight;
    translateY.value = -index * pageHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageHeight]);

  useEffect(() => {
    indexShared.value = index;
    // Đồng bộ lại vị trí khi index đổi từ bên ngoài (vd setIndex(0) sau khi chặn 1 người) — gesture
    // tự đồng bộ trong worklet rồi nên gọi lại ở đây vô hại (cùng đích, không giật).
    translateY.value = withTiming(-index * pageHeightShared.value, SETTLE_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    lengthShared.value = length;
  }, [length, lengthShared]);

  function onContainerLayout(height: number) {
    setPageHeight(height);
  }

  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onUpdate((e) => {
      'worklet';
      translateY.value = -indexShared.value * pageHeightShared.value + e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      const threshold = pageHeightShared.value * 0.18;
      let nextIndex = indexShared.value;

      if (
        (e.translationY < -threshold || e.velocityY < -VELOCITY_THRESHOLD) &&
        indexShared.value < lengthShared.value - 1
      ) {
        nextIndex = indexShared.value + 1;
      } else if (e.translationY > threshold || e.velocityY > VELOCITY_THRESHOLD) {
        if (indexShared.value === 0) {
          translateY.value = withTiming(0, SETTLE_CONFIG);
          runOnJS(onExitTop)();
          return;
        }
        nextIndex = indexShared.value - 1;
      }

      translateY.value = withTiming(-nextIndex * pageHeightShared.value, SETTLE_CONFIG);
      if (nextIndex !== indexShared.value) {
        runOnJS(setIndex)(nextIndex);
      }
    });

  const stackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { index, setIndex, panGesture, stackStyle, pageHeight, onContainerLayout };
}
