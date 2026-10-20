import { ChevronUp, Users } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/receipt';
import { colors } from '@/theme/tokens';
import type { Post } from '@/types';

type ActivityBarProps = {
  post: Post;
  onPress: () => void;
};

export function ActivityBar({ post, onPress }: ActivityBarProps) {
  const reactorNames = Array.from(new Set(post.reactions.map((r) => r.userName)));
  const emojiSummary = Array.from(new Set(post.reactions.map((r) => r.emoji))).slice(0, 3).join('');
  const avatarNames = (reactorNames.length > 0 ? reactorNames : post.views.map((v) => v.viewerName)).slice(0, 3);

  const namesLine =
    reactorNames.length > 0
      ? `${emojiSummary} ${reactorNames.slice(0, 2).join(', ')}${
          reactorNames.length > 2 ? ` +${reactorNames.length - 2}` : ''
        }`
      : 'Chưa ai thả cảm xúc';

  const viewsLine =
    post.views.length > 0 ? `${post.views.length} người đã xem · chạm để xem hoạt động` : 'Chưa ai xem bài này';

  return (
    <Pressable
      onPress={onPress}
      className="h-16 flex-row items-center gap-2.5 rounded-input border-[1.5px] border-ink bg-paper px-3.5">
      {avatarNames.length > 0 ? (
        <View className="flex-row">
          {avatarNames.map((name, i) => (
            <Avatar key={name} name={name} size={30} bordered={i > 0} style={i > 0 && { marginLeft: -8 }} />
          ))}
        </View>
      ) : (
        <Users size={22} color={colors.muted} />
      )}
      <View className="flex-1">
        <Text className="font-display-bold text-[14px] text-ink" numberOfLines={1}>
          {namesLine}
        </Text>
        <Text className="text-[12px] text-muted" numberOfLines={1}>
          {viewsLine}
        </Text>
      </View>
      <ChevronUp size={18} color={colors.ink} />
    </Pressable>
  );
}
