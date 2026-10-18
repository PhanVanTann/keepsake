import { Camera, ChartPie, MessageCircle, User, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

export type BottomNavKey = 'camera' | 'expenses' | 'messages' | 'me';

const TABS: Array<{ key: BottomNavKey; label: string; Icon: LucideIcon }> = [
  { key: 'camera', label: 'Chụp', Icon: Camera },
  { key: 'expenses', label: 'Chi tiêu', Icon: ChartPie },
  { key: 'messages', label: 'Tin nhắn', Icon: MessageCircle },
  { key: 'me', label: 'Tôi', Icon: User },
];

type BottomNavProps = {
  active: BottomNavKey;
  onChange?: (key: BottomNavKey) => void;
};

/** Thanh điều hướng dưới: Chụp · Chi tiêu · Tin nhắn · Tôi. */
export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <View
      className="flex-row items-start justify-around border-t border-line bg-bg pt-3"
      style={{ height: 84 }}
      accessibilityRole="menubar"
      accessibilityLabel="Điều hướng chính">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onChange?.(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            className="w-[76px] items-center gap-1">
            <Icon size={24} strokeWidth={isActive ? 2.2 : 2} color={isActive ? colors.ink : colors.muted} />
            <Text
              className={cn(
                'text-[11px]',
                isActive ? 'font-display-extrabold text-ink' : 'font-display-semibold text-muted'
              )}>
              {label}
            </Text>
            <View
              style={{ width: 18, height: 3, borderRadius: 2 }}
              className={isActive ? 'bg-red' : 'bg-transparent'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
