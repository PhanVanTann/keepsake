import dayjs from 'dayjs';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { ZigzagEdge } from '@/components/receipt';
import { groupThousands } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { Income } from '@/types';

type ConfirmIncomeModalProps = {
  visible: boolean;
  income: Income;
  walletRemaining: number;
  onReceived: (amount: number) => void;
  onAskLater: () => void;
  onSkip: () => void;
};

export function ConfirmIncomeModal({ visible, income, walletRemaining, onReceived, onAskLater, onSkip }: ConfirmIncomeModalProps) {
  const [amountText, setAmountText] = useState(groupThousands(income.amount));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50">
        <View className="absolute left-6 right-6" style={{ top: 190 }}>
          <View className="bg-paper px-5 pb-[18px] pt-[22px]">
            <Text className="text-[40px] leading-[40px]">👀</Text>
            <Text className="mt-3 font-display-extrabold text-[21px] leading-[27.3px] text-ink">
              Hôm nay {dayjs().format('DD.MM')} rồi.{'\n'}
              {income.name} gửi tiền chưa?
            </Text>
            <Text className="mt-1.5 text-[13px] text-muted">
              Ví còn {groupThousands(walletRemaining)}đ thôi đó, hỏi thật 🥲
            </Text>

            <View className="mt-4">
              <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">SỐ TIỀN NHẬN (SỬA ĐƯỢC)</Text>
              <View className="mt-1 flex-row items-baseline gap-1 border-b-2 border-green">
                <TextInput
                  value={amountText}
                  onChangeText={(t) => setAmountText(t.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  className="flex-1 font-mono-extrabold text-[28px] text-green"
                />
                <Text className="font-mono-extrabold text-[20px] text-muted">đ</Text>
              </View>
            </View>

            <View className="mt-[18px] gap-2">
              <Pressable
                onPress={() => onReceived(parseInt(amountText || '0', 10))}
                className="h-[50px] items-center justify-center rounded-input bg-green">
                <Text className="font-display-extrabold text-[15px] text-white">Rồi! Ghi vào sổ</Text>
              </Pressable>
              <Pressable
                onPress={onAskLater}
                className="h-[46px] items-center justify-center rounded-input border-[1.5px] border-ink">
                <Text className="font-display-bold text-[14px] text-ink">Chưa, mai hỏi lại</Text>
              </Pressable>
              <Pressable onPress={onSkip} className="h-10 items-center justify-center">
                <Text className="text-[13px] font-display-semibold text-muted">Lần này không có</Text>
              </Pressable>
            </View>
          </View>
          <ZigzagEdge width={342} edge="bottom" />
        </View>
      </View>
    </Modal>
  );
}
