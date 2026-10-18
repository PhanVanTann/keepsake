import { Pressable, View } from 'react-native';

import { colors } from '@/theme/tokens';

type SwitchProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  tone?: 'red' | 'ink';
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Công tắc vuông kiểu biên lai: track 52×32, thumb 26×26, bo 6-8px. */
export function Switch({ value, onValueChange, tone = 'red', disabled, accessibilityLabel }: SwitchProps) {
  const onColor = tone === 'ink' ? colors.ink : colors.red;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={{
        width: 52,
        height: 32,
        borderRadius: 8,
        padding: 3,
        backgroundColor: value ? onColor : colors.line,
        justifyContent: value ? 'flex-end' : 'flex-start',
        opacity: disabled ? 0.5 : 1,
      }}>
      <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: colors.paper }} />
    </Pressable>
  );
}
