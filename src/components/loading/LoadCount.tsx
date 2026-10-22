import { Text, View } from 'react-native';

import { Skeleton } from '@/components/loading/Skeleton';
import { MonoLabel } from '@/components/receipt';

/** Loading kiểu "máy đếm tiền" — dùng khi tải màn Chi tiêu. */
export function LoadCount() {
  return (
    <View className="flex-1 bg-bg pt-6">
      <View className="mx-4 gap-4 bg-paper px-4 py-[22px]">
        <MonoLabel tone="muted">CÒN ĐƯỢC CHI</MonoLabel>
        <Skeleton width={180} height={44} radius={6} />
        <Skeleton width="100%" height={12} radius={3} />
        <View className="gap-3 border-t-2 border-dotted border-line pt-3.5">
          <CountRow w1={96} w2={80} />
          <CountRow w1={64} w2={72} />
          <CountRow w1={84} w2={76} />
        </View>
      </View>
      <Text className="mt-7 text-center font-mono-bold text-[13px] tracking-[1.5px] text-muted">ĐANG CỘNG SỔ…</Text>
    </View>
  );
}

function CountRow({ w1, w2 }: { w1: number; w2: number }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Skeleton width={w1} height={10} />
      <View className="flex-1 border-b-2 border-dotted border-line" />
      <Skeleton width={w2} height={12} />
    </View>
  );
}
