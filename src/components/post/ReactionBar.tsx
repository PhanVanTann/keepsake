import { Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import type { ReactionEmoji } from '@/types';

const EMOJIS: ReactionEmoji[] = ['❤️', '😂', '😮', '😢', '🔥'];

type ReactionBarProps = {
  myReaction?: ReactionEmoji;
  onReact: (emoji: ReactionEmoji) => void;
};

export function ReactionBar({ myReaction, onReact }: ReactionBarProps) {
  return (
    <View role="group" aria-label="Thả cảm xúc" className="flex-row gap-2">
      {EMOJIS.map((emoji) => {
        const active = myReaction === emoji;
        return (
          <Pressable
            key={emoji}
            onPress={() => onReact(emoji)}
            accessibilityLabel={`Thả ${emoji}`}
            accessibilityState={{ selected: active }}
            className={cn(
              'h-[50px] flex-1 items-center justify-center rounded-card',
              active ? 'border-2 border-red bg-red-bg' : 'border-0 bg-paper'
            )}>
            <Text className="text-2xl">{emoji}</Text>
          </Pressable>
        );
      })}
      <View className="h-[50px] flex-1 items-center justify-center rounded-card border-[1.5px] border-dashed border-dot">
        <Plus size={20} color={colors.muted} />
      </View>
    </View>
  );
}
