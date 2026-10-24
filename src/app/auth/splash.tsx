import { router } from 'expo-router';
import { Receipt as ReceiptIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export default function AuthSplashScreen() {
  return (
    <Pressable
      onPress={() => router.push('/auth/login')}
      accessibilityLabel="Chạm để tiếp tục"
      className="flex-1 items-center justify-center bg-bg">
      <View
        style={{ width: 132, height: 132, borderRadius: 30, transform: [{ rotate: '-4deg' }] }}
        className="items-center justify-center bg-red">
        <ReceiptIcon size={56} color={colors.paper} strokeWidth={1.8} />
      </View>

      <Text className="mt-7 font-display-extrabold text-[30px] text-ink">Chi Tiêu Nhà</Text>
      <Text className="mt-1.5 text-[15px] text-muted">Chụp một tấm, ghi một khoản.</Text>

      <View className="absolute bottom-[72px] items-center gap-2.5">
        <View className="flex-row gap-1.5">
          <View className="h-2 w-2 rounded-sm bg-red" />
          <View className="h-2 w-2 rounded-sm bg-dot" />
          <View className="h-2 w-2 rounded-sm bg-dot" />
        </View>
        <Text className="font-mono-bold text-[12px] tracking-[1.5px] text-muted">ĐANG MỞ SỔ…</Text>
      </View>
    </Pressable>
  );
}
