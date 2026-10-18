import { useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

type ZigzagEdgeProps = {
  /** Chiều rộng mép răng cưa (px), thường đo từ onLayout của thẻ chứa. */
  width: number;
  height?: number;
  step?: number;
  color?: string;
  /** 'top' = răng cưa nhô lên trên thẻ giấy; 'bottom' = nhô xuống dưới thẻ giấy. */
  edge?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
};

function buildZigzagPath(width: number, height: number, step: number, edge: 'top' | 'bottom') {
  const mid = height / 2;
  const far = edge === 'top' ? 0 : height;
  const baseline = edge === 'top' ? height : 0;
  const pts: Array<[number, number]> = [];

  if (edge === 'top') {
    pts.push([0, baseline], [0, mid]);
    let x = step;
    let atFar = true;
    while (x < width) {
      pts.push([x, atFar ? far : mid]);
      atFar = !atFar;
      x += step;
    }
    pts.push([width, baseline]);
  } else {
    pts.push([0, baseline], [width, baseline], [width, mid]);
    let x = width - step;
    let atFar = true;
    while (x > 0) {
      pts.push([x, atFar ? far : mid]);
      atFar = !atFar;
      x -= step;
    }
    pts.push([0, mid]);
  }

  return `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;
}

export function ZigzagEdge({
  width,
  height = 10,
  step = 6,
  color = colors.paper,
  edge = 'bottom',
  style,
}: ZigzagEdgeProps) {
  const d = useMemo(
    () => (width > 0 ? buildZigzagPath(width, height, step, edge) : ''),
    [width, height, step, edge]
  );

  if (width <= 0) return null;

  return (
    <Svg width={width} height={height} style={style}>
      <Path d={d} fill={color} />
    </Svg>
  );
}
