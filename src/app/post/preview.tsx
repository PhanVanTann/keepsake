import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight, RotateCcw, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZigzagEdge } from '@/components/receipt';
import { usePostDraftStore } from '@/store/postDraftStore';
import { colors } from '@/theme/tokens';

export default function PreviewScreen() {
  const photoUri = usePostDraftStore((s) => s.photoUri);
  const reset = usePostDraftStore((s) => s.reset);

  function handleCancel() {
    reset();
    router.back();
  }

  function handleRetake() {
    router.back();
  }

  function handleNext() {
    router.push('/post/create');
  }

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 justify-center px-4">
          <Text className="font-mono-bold text-[12px] tracking-[1px] text-muted">
            VỪA CHỤP · {dayjs().format('HH:mm')}
          </Text>
          <Text className="font-display-extrabold text-[20px] text-ink">Xem lại ảnh</Text>
        </View>

        <View className="relative mx-4 mt-3 h-[392px] overflow-hidden rounded-frame bg-ink">
          {photoUri && <Image source={{ uri: photoUri }} style={{ flex: 1 }} contentFit="cover" />}
          <CornerBrackets />
        </View>

        <Text className="mx-6 mt-4 text-center text-[13px] leading-[19.5px] text-muted">
          Bước tiếp: ghi số tiền và nội dung. Ảnh chỉ được đăng khi bạn bấm "Đăng".
        </Text>

        <View className="absolute bottom-14 left-4 right-4">
          <ZigzagEdge width={358} edge="bottom" />
          <View className="flex-row items-center justify-between bg-paper p-4">
            <Pressable onPress={handleCancel} className="w-[76px] items-center gap-1.5">
              <View className="h-[52px] w-[52px] items-center justify-center rounded-input bg-chip">
                <X size={22} color={colors.ink} />
              </View>
              <Text className="font-display-bold text-[13px] text-ink">Huỷ</Text>
            </Pressable>

            <Pressable onPress={handleRetake} className="w-[76px] items-center gap-1.5">
              <View className="h-[52px] w-[52px] items-center justify-center rounded-input bg-chip">
                <RotateCcw size={22} color={colors.ink} />
              </View>
              <Text className="font-display-bold text-[13px] text-ink">Chụp lại</Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              accessibilityLabel="Tiếp, sang bước ghi số tiền"
              className="h-24 w-24 items-center justify-center rounded-full bg-red">
              <View className="h-20 w-20 items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-white">
                <ArrowRight size={20} color={colors.paper} />
                <Text className="font-mono-extrabold text-[14px] tracking-[1px] text-white">TIẾP</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CornerBrackets() {
  const common = 'absolute h-7 w-7 border-white';
  return (
    <>
      <View className={`${common} left-4 top-4 border-l-[3px] border-t-[3px]`} />
      <View className={`${common} right-4 top-4 border-r-[3px] border-t-[3px]`} />
      <View className={`${common} bottom-4 left-4 border-b-[3px] border-l-[3px]`} />
      <View className={`${common} bottom-4 right-4 border-b-[3px] border-r-[3px]`} />
    </>
  );
}
