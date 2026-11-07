import { Image } from 'expo-image';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

type AvatarProps = {
  name: string;
  /** Có ảnh thật thì ưu tiên hiện ảnh — không có thì rơi về chữ cái đầu tên như cũ. */
  avatarUrl?: string;
  size?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PALETTE = [
  { bg: '#F6D9D2', text: '#8A2E1F' },
  { bg: '#D6E4F0', text: '#1F4766' },
  { bg: '#DCE8D1', text: '#3E5C28' },
  { bg: '#EADCF5', text: '#5B3A82' },
  { bg: '#FBE7B9', text: '#7A5410' },
] as const;

function pickPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Avatar vuông bo góc — ảnh thật nếu có, không thì chữ cái đầu tên với màu suy ra từ tên. */
export function Avatar({ name, avatarUrl, size = 40, bordered = false, style }: AvatarProps) {
  const { bg, text } = pickPalette(name);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        bordered && { borderWidth: 2, borderColor: '#FFFFFF' },
        style,
      ]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text style={{ color: text, fontSize: size * 0.375 }} className="font-display-extrabold">
          {initial}
        </Text>
      )}
    </View>
  );
}
