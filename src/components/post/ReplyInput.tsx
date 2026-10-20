import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { colors } from '@/theme/tokens';

type ReplyInputProps = {
  friendName: string;
  onSend: (text: string) => void;
  sending?: boolean;
};

export function ReplyInput({ friendName, onSend, sending }: ReplyInputProps) {
  const [text, setText] = useState('');

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View className="flex-row gap-2">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={`Nhắn cho ${friendName}…`}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={`Trả lời ${friendName}`}
        onSubmitEditing={handleSend}
        className="h-[52px] flex-1 rounded-input border-[1.5px] border-ink bg-paper px-4 font-display text-[15px] text-ink"
      />
      <Pressable
        onPress={handleSend}
        accessibilityLabel="Gửi"
        disabled={sending}
        className="h-[52px] w-[52px] items-center justify-center rounded-input bg-red"
        style={{ opacity: sending ? 0.6 : 1 }}>
        <Send size={22} color={colors.paper} />
      </Pressable>
    </View>
  );
}
