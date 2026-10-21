import { View } from 'react-native';

import { colors } from '@/theme/tokens';

type ProgressBarProps = {
  /** 0-100, đã kẹp sẵn (dùng clampPercent ở nơi gọi). */
  percent: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  /** Vạch đỏ tham chiếu (vd: % ngày đã trôi qua trong chu kỳ), 0-100. */
  markerPercent?: number;
};

export function ProgressBar({
  percent,
  height = 12,
  trackColor = colors.chip,
  fillColor = colors.ink,
  markerPercent,
}: ProgressBarProps) {
  return (
    <View style={{ height, borderRadius: height / 4, backgroundColor: trackColor, overflow: 'hidden' }}>
      <View style={{ width: `${percent}%`, height, borderRadius: height / 4, backgroundColor: fillColor }} />
      {markerPercent !== undefined && (
        <View
          style={{
            position: 'absolute',
            left: `${markerPercent}%`,
            top: -4,
            width: 2,
            height: height + 8,
            backgroundColor: colors.red,
          }}
        />
      )}
    </View>
  );
}
