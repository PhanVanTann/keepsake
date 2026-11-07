import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AmountStamp, Avatar, Receipt } from '@/components/receipt';
import { categoryIcons } from '@/lib/categoryIcons';
import { formatRelativeTime } from '@/lib/date';
import { PRIVACY_LABEL } from '@/lib/privacy';
import { colors } from '@/theme/tokens';
import type { Post } from '@/types';

type PostCardProps = {
  post: Post;
  /** Bài của chính mình: hiện "Bạn" thay vì tên, kèm quyền xem thay vì chỉ thời gian. */
  isMine?: boolean;
};

export function PostCard({ post, isMine = false }: PostCardProps) {
  const CategoryIcon = post.category ? categoryIcons[post.category.icon] : undefined;

  return (
    <Receipt zigzagTop={false} zigzagBottom contentClassName="gap-3 p-3.5">
      <View className="flex-row items-center gap-2.5">
        <Avatar name={post.author.displayName} avatarUrl={post.author.avatarUrl} size={40} />
        <View className="flex-1">
          <Text className="font-display-bold text-[15px] text-ink">{isMine ? 'Bạn' : post.author.displayName}</Text>
          <Text className="text-[12px] text-muted">
            {formatRelativeTime(post.createdAt)}
            {isMine ? ` · ${PRIVACY_LABEL[post.privacy]}` : ''}
          </Text>
        </View>
        {post.postType === 'EXPENSE' && post.amount > 0 && <AmountStamp amount={post.amount} />}
      </View>

      <View className="h-[330px] overflow-hidden rounded-receipt bg-ink">
        <Image source={{ uri: post.imageUrl }} style={{ flex: 1 }} contentFit="cover" />
      </View>

      {post.content && <Text className="text-[15px] leading-[21.75px] text-ink">{post.content}</Text>}

      {post.postType === 'EXPENSE' && (post.category || (post.showLocation && post.locationName)) && (
        <View className="flex-row flex-wrap gap-2">
          {post.category && (
            <View className="h-7 flex-row items-center gap-1.5 rounded-input bg-chip px-2.5">
              {CategoryIcon && <CategoryIcon size={14} color={colors.ink} />}
              <Text className="text-[12px] font-display-semibold text-ink">{post.category.name}</Text>
            </View>
          )}
          {post.showLocation && post.locationName && (
            <View className="h-7 flex-row items-center gap-1.5 rounded-input bg-chip px-2.5">
              <MapPin size={14} color={colors.ink} />
              <Text className="text-[12px] font-display-semibold text-ink">{post.locationName}</Text>
            </View>
          )}
        </View>
      )}

      {post.editedAt && <Text className="text-[11px] text-muted">đã sửa</Text>}
    </Receipt>
  );
}
