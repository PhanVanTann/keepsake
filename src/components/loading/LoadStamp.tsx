import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ZigzagEdge } from '@/components/receipt';
import { colors } from '@/theme/tokens';

type LoadStampProps = {
  visible: boolean;
  photoUri: string | null;
  onGoToCamera: () => void;
};

/** Loading kiểu "đóng dấu" — hiện đè khi đang đăng bài, không chặn thao tác thoát. */
export function LoadStamp({ visible, photoUri, onGoToCamera }: LoadStampProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || !visible) return;
    scale.value = withRepeat(
      withSequence(withTiming(0.92, { duration: 260 }), withTiming(1, { duration: 500 })),
      -1
    );
  }, [reduceMotion, visible, scale]);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -60 }, { rotate: '-10deg' }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center bg-bg pt-16">
        <Text className="font-display-extrabold text-[17px] text-ink">Ghi khoản chi</Text>

        <View className="mx-10 mt-16" style={{ width: 310 }}>
          <View className="bg-paper p-4">
            <View className="h-[190px] overflow-hidden rounded-receipt bg-ink">
              {photoUri && <Image source={{ uri: photoUri }} style={{ flex: 1 }} contentFit="cover" />}
            </View>
          </View>
          <ZigzagEdge width={310} edge="bottom" />
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: '50%',
                top: 84,
                borderRadius: 10,
                borderWidth: 3,
                borderColor: colors.red,
                backgroundColor: 'rgba(255,255,255,0.9)',
                paddingHorizontal: 18,
                paddingVertical: 8,
              },
              stampStyle,
            ]}>
            <Text className="font-mono-extrabold text-[24px] tracking-[3px] text-red">ĐÃ GHI</Text>
          </Animated.View>
        </View>

        <View className="mx-10 mt-10 w-[310px]">
          <Text className="font-mono-bold text-[13px] tracking-[1px] text-muted">ĐANG ĐĂNG…</Text>
        </View>

        <Text className="mx-10 mt-6 text-center text-[13px] leading-[19.5px] text-muted">
          Bạn có thể quay lại camera, bài vẫn tiếp tục đăng.
        </Text>

        <Pressable
          onPress={onGoToCamera}
          className="absolute bottom-12 left-4 right-4 h-[54px] items-center justify-center rounded-input border-[1.5px] border-ink">
          <Text className="font-display-bold text-[16px] text-ink">Về camera</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
