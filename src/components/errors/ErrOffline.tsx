import { RefreshCw, WifiOff } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZigzagEdge } from '@/components/receipt';
import { colors } from '@/theme/tokens';

type ErrOfflineProps = {
  visible: boolean;
  onContinue: () => void;
};

/** Hiện khi NetInfo báo mất mạng thật trên máy — hàng chờ gửi chỉ là ví dụ minh hoạ. */
export function ErrOffline({ visible, onContinue }: ErrOfflineProps) {
  return (
    <Modal visible={visible} animationType="fade">
      <View className="flex-1 bg-bg">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="mx-4 h-11 flex-row items-center gap-2.5 rounded-input bg-ink px-3.5">
            <WifiOff size={18} color={colors.paper} />
            <Text className="font-display-semibold text-[13px] text-white">Không có kết nối mạng</Text>
          </View>

          <View className="relative mx-8 mt-14">
            <View className="gap-3 bg-paper p-[20px]">
              <View className="flex-row justify-between">
                <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">HÀNG CHỜ GỬI</Text>
                <Text className="font-mono-bold text-[11px] text-muted">VÍ DỤ</Text>
              </View>
              <View className="border-t-2 border-dotted border-line" />
              <View className="gap-2.5">
                <QueueRow label="Ăn uống · 07:40" amount="50.000đ" bg="#6E4B33" />
                <QueueRow label="Đi lại · 08:05" amount="80.000đ" bg="#3E5466" />
              </View>
            </View>
            <ZigzagEdge width={326} edge="bottom" />
            <View
              style={{ position: 'absolute', right: -6, top: -16, transform: [{ rotate: '7deg' }] }}
              className="rounded-[8px] border-[2.5px] border-ink bg-bg px-3 py-1.5">
              <Text className="font-mono-extrabold text-[14px] tracking-[1px] text-ink">CHỜ MẠNG</Text>
            </View>
          </View>

          <View className="mx-8 mt-9 items-center">
            <Text className="font-display-extrabold text-[22px] text-ink">Mất mạng rồi</Text>
            <Text className="mt-2 text-center text-[15px] leading-[22.5px] text-muted">
              Bạn vẫn chụp và ghi khoản chi bình thường. Bài sẽ tự gửi khi có mạng trở lại.
            </Text>
          </View>

          <View className="mt-auto gap-2.5 px-4 pb-12">
            <View className="h-[54px] flex-row items-center justify-center gap-2 rounded-input bg-ink">
              <RefreshCw size={18} color={colors.paper} />
              <Text className="font-display-bold text-[16px] text-white">Thử kết nối lại</Text>
            </View>
            <Pressable onPress={onContinue} className="h-[54px] items-center justify-center rounded-input border-[1.5px] border-ink">
              <Text className="font-display-bold text-[16px] text-ink">Tiếp tục chụp</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function QueueRow({ label, amount, bg }: { label: string; amount: string; bg: string }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-9 w-9 rounded-receipt" style={{ backgroundColor: bg }} />
      <Text className="flex-1 font-mono text-[13px] text-ink">{label}</Text>
      <Text className="font-mono-extrabold text-[13px] text-ink">{amount}</Text>
    </View>
  );
}
