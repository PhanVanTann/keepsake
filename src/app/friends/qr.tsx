import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZigzagEdge } from '@/components/receipt';
import { useProfile } from '@/hooks';
import { colors } from '@/theme/tokens';

export default function FriendQrScreen() {
  const profile = useProfile();

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="h-12 flex-row items-center gap-2 px-3">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-input bg-paper">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <View className="h-[38px] flex-1 flex-row rounded-input bg-chip2 p-[3px]">
            <View className="flex-1 items-center justify-center rounded-input bg-paper">
              <Text className="font-display-bold text-[14px] text-ink">Mã của tôi</Text>
            </View>
            <Pressable onPress={() => router.replace('/friends/scan')} className="flex-1 items-center justify-center">
              <Text className="font-display-semibold text-[14px] text-muted">Quét mã</Text>
            </Pressable>
          </View>
        </View>

        <View className="mx-10 mt-10">
          <View className="items-center gap-[18px] bg-paper px-[22px] pb-5 pt-[22px]">
            <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">THẺ KẾT BẠN</Text>
            {profile.data && (
              <QRCode
                value={`chitieunha://friend/${profile.data.id}`}
                size={220}
                color={colors.ink}
                backgroundColor={colors.paper}
              />
            )}
            <View className="items-center">
              <Text className="font-display-extrabold text-[20px] text-ink">{profile.data?.displayName}</Text>
              <Text className="font-mono text-[13px] text-muted">@{profile.data?.username}</Text>
            </View>
          </View>
          <ZigzagEdge width={310} edge="bottom" />
        </View>

        <Text className="mx-10 mt-[18px] text-center text-[14px] leading-[21px] text-muted">
          Bạn bè quét mã này bằng camera trong app để gửi lời mời kết bạn.
        </Text>
      </SafeAreaView>
    </View>
  );
}
