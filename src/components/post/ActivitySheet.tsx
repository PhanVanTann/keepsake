import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/receipt';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/date';
import { colors } from '@/theme/tokens';
import type { Post, ReactionEmoji } from '@/types';

type ActivitySheetProps = {
  visible: boolean;
  post: Post;
  onClose: () => void;
};

export function ActivitySheet({ visible, post, onClose }: ActivitySheetProps) {
  const [filter, setFilter] = useState<ReactionEmoji | 'all'>('all');

  const chips = useMemo(() => {
    const uniqueEmojis = Array.from(new Set(post.reactions.map((r) => r.emoji)));
    return [
      { key: 'all' as const, label: 'Tất cả', count: post.reactions.length },
      ...uniqueEmojis.map((emoji) => ({
        key: emoji,
        label: emoji,
        count: post.reactions.filter((r) => r.emoji === emoji).length,
      })),
    ];
  }, [post.reactions]);

  const rows = filter === 'all' ? post.reactions : post.reactions.filter((r) => r.emoji === filter);
  const unreactedViewers = post.views.filter((v) => !post.reactions.some((r) => r.userId === v.viewerId));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45" onPress={onClose} />
      <View className="absolute bottom-0 left-0 right-0 max-h-[520px] rounded-t-[22px] bg-paper px-4 pt-2.5">
        <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />

        <View className="mt-3 flex-row items-center justify-between">
          <View>
            <Text className="font-display-extrabold text-[18px] text-ink">Hoạt động</Text>
            <Text className="font-mono-bold text-[12px] text-muted">
              {post.views.length} ĐÃ XEM · {post.reactions.length} CẢM XÚC
            </Text>
          </View>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-input bg-chip">
            <X size={18} color={colors.ink} />
          </Pressable>
        </View>

        <View className="mt-3.5 flex-row flex-wrap gap-2">
          {chips.map((chip) => {
            const active = filter === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                className={cn(
                  'h-[38px] flex-row items-center gap-1.5 rounded-input px-3.5',
                  active ? 'bg-ink' : 'bg-chip'
                )}>
                <Text className={cn('text-[14px]', active ? 'font-display-bold text-white' : 'font-display-semibold text-ink')}>
                  {chip.label}
                </Text>
                <Text className={cn('font-mono text-[13px]', active ? 'text-white' : 'text-ink')}>{chip.count}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView className="mt-2.5">
          {rows.map((r) => (
            <View key={r.userId} className="h-[58px] flex-row items-center gap-3 border-b border-dashed border-line">
              <Avatar name={r.userName} size={40} />
              <View className="flex-1">
                <Text className="font-display-bold text-[15px] text-ink">{r.userName}</Text>
                <Text className="text-[12px] text-muted">{formatRelativeTime(r.createdAt)}</Text>
              </View>
              <Text className="text-[26px]">{r.emoji}</Text>
            </View>
          ))}
          {rows.length === 0 && (
            <Text className="py-6 text-center text-[13px] text-muted">Chưa có ai trong mục này</Text>
          )}
        </ScrollView>

        {filter === 'all' && post.views.length > 0 && (
          <View className="mb-4 mt-3.5 flex-row items-center gap-2.5">
            <Text className="font-mono-bold text-[11px] tracking-[1px] text-muted">ĐÃ XEM</Text>
            <View className="flex-row">
              {post.views.slice(0, 4).map((v, i) => (
                <Avatar key={v.viewerId} name={v.viewerName} size={28} bordered={i > 0} style={i > 0 && { marginLeft: -6 }} />
              ))}
            </View>
            <Text className="flex-1 text-[13px] text-muted" numberOfLines={1}>
              {unreactedViewers.length > 0
                ? `${unreactedViewers
                    .slice(0, 2)
                    .map((v) => v.viewerName)
                    .join(', ')} ${unreactedViewers.length > 2 ? `và ${unreactedViewers.length - 2} người ` : ''}chưa thả`
                : 'Mọi người đã thả cảm xúc'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
