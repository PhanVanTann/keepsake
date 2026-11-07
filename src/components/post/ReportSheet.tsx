import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Switch } from '@/components/receipt';
import { cn } from '@/lib/cn';
import type { ReportReason } from '@/types';

type ReportSheetProps = {
  visible: boolean;
  authorName: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, alsoBlock: boolean) => void;
};

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'INAPPROPRIATE', label: 'Ảnh phản cảm, không phù hợp' },
  { value: 'SPAM', label: 'Spam, quảng cáo' },
  { value: 'HARASSMENT', label: 'Quấy rối, bắt nạt' },
  { value: 'SCAM', label: 'Lừa đảo, vay mượn tiền' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export function ReportSheet({ visible, authorName, onClose, onSubmit }: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [alsoBlock, setAlsoBlock] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose} />
      <View className="absolute bottom-0 left-0 right-0 rounded-t-[22px] bg-paper px-4 pb-[46px] pt-2.5">
        <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
        <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Bài này có vấn đề gì?</Text>
        <Text className="mt-1 text-[13px] text-muted">{authorName} sẽ không biết bạn đã báo cáo.</Text>

        <View role="radiogroup" aria-label="Lý do" className="mt-3">
          {REASONS.map((r, i) => {
            const active = reason === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setReason(r.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                className={cn(
                  'h-[50px] flex-row items-center gap-3',
                  i < REASONS.length - 1 && 'border-b border-dashed border-line'
                )}>
                <View className={cn('h-5 w-5 rounded-full border-2', active ? 'border-[6px] border-red' : 'border-dot')} />
                <Text className={cn('text-[15px] text-ink', active ? 'font-display-extrabold' : 'font-display-semibold')}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-3 flex-row items-center gap-3 rounded-input bg-chip p-3">
          <View className="flex-1">
            <Text className="font-display-bold text-[15px] text-ink">Chặn luôn {authorName}</Text>
            <Text className="text-[12px] text-muted">Huỷ kết bạn, hai bên không thấy bài và không nhắn tin được</Text>
          </View>
          <Switch value={alsoBlock} onValueChange={setAlsoBlock} tone="red" />
        </View>

        <View className="mt-4 flex-row gap-2">
          <Pressable onPress={onClose} className="h-[52px] flex-1 items-center justify-center rounded-input border-[1.5px] border-ink">
            <Text className="font-display-bold text-[15px] text-ink">Huỷ</Text>
          </Pressable>
          <Pressable
            onPress={() => onSubmit(reason, alsoBlock)}
            className="h-[52px] flex-1 items-center justify-center rounded-input bg-red">
            <Text className="font-display-extrabold text-[15px] text-white">Gửi báo cáo</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
