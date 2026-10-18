import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

type MonoLabelProps = TextProps & {
  weight?: 'medium' | 'bold' | 'extrabold';
  tone?: 'muted' | 'ink' | 'white' | 'red' | 'green';
  className?: string;
};

const WEIGHT_CLASS = {
  medium: 'font-mono',
  bold: 'font-mono-bold',
  extrabold: 'font-mono-extrabold',
} as const;

const TONE_CLASS = {
  muted: 'text-muted',
  ink: 'text-ink',
  white: 'text-white',
  red: 'text-red',
  green: 'text-green',
} as const;

/** Nhãn IN HOA kiểu hoá đơn: JetBrains Mono, 11px, letter-spacing 1px. */
export function MonoLabel({ weight = 'bold', tone = 'muted', className, children, ...rest }: MonoLabelProps) {
  return (
    <Text
      className={cn('text-[11px] uppercase tracking-[1px]', WEIGHT_CLASS[weight], TONE_CLASS[tone], className)}
      {...rest}>
      {children}
    </Text>
  );
}
