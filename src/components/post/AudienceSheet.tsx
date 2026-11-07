import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/receipt';
import { cn } from '@/lib/cn';
import type { Friend, PostPrivacy } from '@/types';

type AudienceSheetProps = {
  visible: boolean;
  friends: Friend[];
  privacy: PostPrivacy;
  selectedFriendIds: string[];
  onClose: () => void;
  onDone: (privacy: PostPrivacy, selectedFriendIds: string[]) => void;
};

const OPTIONS: Array<{ value: PostPrivacy; label: string; hint?: string }> = [
  { value: 'FRIENDS', label: 'Tất cả bạn bè' },
  { value: 'SELECTED_FRIENDS', label: 'Bạn bè được chọn' },
  { value: 'SELF', label: 'Chỉ mình tôi', hint: 'vẫn ghi vào sổ' },
];

export function AudienceSheet({ visible, friends, privacy, selectedFriendIds, onClose, onDone }: AudienceSheetProps) {
  const [draftPrivacy, setDraftPrivacy] = useState(privacy);
  const [draftSelected, setDraftSelected] = useState(selectedFriendIds);

  function toggleFriend(id: string) {
    setDraftSelected((cur) => (cur.includes(id) ? cur.filter((f) => f !== id) : [...cur, id]));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45" onPress={onClose} />
      <View className="absolute bottom-0 left-0 right-0 max-h-[640px] rounded-t-[22px] bg-paper px-4 pt-2.5">
        <View className="mx-auto h-[5px] w-10 rounded-full bg-line" />
        <Text className="mt-3.5 font-display-extrabold text-[19px] text-ink">Ai được xem bài này?</Text>

        <View className="mt-3 gap-2">
          {OPTIONS.map((opt) => {
            const active = draftPrivacy === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setDraftPrivacy(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                className={cn(
                  'h-[54px] flex-row items-center gap-3 rounded-card border px-3.5',
                  active ? 'border-2 border-ink' : 'border-[1.5px] border-line'
                )}>
                <View
                  className={cn('h-5 w-5 rounded-full border-2', active ? 'border-[6px] border-ink' : 'border-dot')}
                />
                <Text className={cn('flex-1 text-[15px] text-ink', active ? 'font-display-extrabold' : 'font-display-medium')}>
                  {opt.label}
                </Text>
                {opt.value === 'FRIENDS' && (
                  <Text className="font-mono text-[12px] text-muted">{friends.length}</Text>
                )}
                {opt.value === 'SELECTED_FRIENDS' && (
                  <Text className="font-mono-extrabold text-[12px] text-ink">{draftSelected.length}</Text>
                )}
                {opt.hint && <Text className="text-[12px] text-muted">{opt.hint}</Text>}
              </Pressable>
            );
          })}
        </View>

        {draftPrivacy === 'SELECTED_FRIENDS' && (
          <>
            <Text className="mt-4 font-mono-bold text-[11px] tracking-[1px] text-muted">CHỌN BẠN BÈ</Text>
            <ScrollView className="mt-1.5 max-h-[260px]">
              {friends.map((f, i) => {
                const checked = draftSelected.includes(f.id);
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => toggleFriend(f.id)}
                    className={cn(
                      'h-[54px] flex-row items-center gap-3',
                      i < friends.length - 1 && 'border-b border-dashed border-line'
                    )}>
                    <Avatar name={f.displayName} avatarUrl={f.avatarUrl} size={36} />
                    <Text className="flex-1 font-display-bold text-[15px] text-ink">{f.displayName}</Text>
                    <View
                      className={cn(
                        'h-[22px] w-[22px] items-center justify-center rounded-[6px] border-2',
                        checked ? 'border-ink bg-ink' : 'border-dot bg-paper'
                      )}>
                      {checked && <Text className="text-[13px] font-display-extrabold text-white">✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        <Pressable
          onPress={() => onDone(draftPrivacy, draftSelected)}
          className="mb-[46px] mt-4 h-[54px] items-center justify-center rounded-input bg-ink">
          <Text className="font-display-extrabold text-[16px] text-white">
            Xong{draftPrivacy === 'SELECTED_FRIENDS' ? ` · ${draftSelected.length} người` : ''}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
