import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';
import type { Category, Post, PostPrivacy, PostReaction, PostType, PostView, ReactionEmoji, User } from '@/types';
import type { ExpenseTransactionRow, PostRow, PostUpdate, ReactionEmojiDb } from '@/types/database';

const BUCKET = 'post-images';
const SIGNED_URL_TTL_SECONDS = 3600;

type AuthorRow = { user_id: string; display_name: string; username: string; avatar_url: string | null } | null;
type CategoryEmbedRow = { id: string; name: string; icon: string; is_default: boolean; is_active: boolean } | null;
type ReactionEmbedRow = {
  user_id: string;
  emoji: ReactionEmojiDb;
  created_at: string;
  user: { display_name: string } | null;
};
type ViewEmbedRow = { viewer_id: string; viewed_at: string; viewer: { display_name: string } | null };

type PostQueryRow = PostRow & {
  category: CategoryEmbedRow;
  author: AuthorRow;
  reactions: ReactionEmbedRow[];
  views: ViewEmbedRow[];
};

const POST_SELECT = `
  id, user_id, post_type, image_url, image_thumbnail_url, amount, content, category_id,
  latitude, longitude, location_name, show_location, privacy_type, created_at, edited_at, deleted_at,
  category:categories(id, name, icon, is_default, is_active),
  author:user_profiles!posts_user_id_fkey(user_id, display_name, username, avatar_url),
  reactions:post_reactions(user_id, emoji, created_at, user:user_profiles!post_reactions_user_id_fkey(display_name)),
  views:post_views(viewer_id, viewed_at, viewer:user_profiles!post_views_viewer_id_fkey(display_name))
`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** friendRepo vẫn mock tới đợt 3 — id bạn bè lúc đó không phải uuid thật, lọc ra để khỏi vỡ RPC/insert. */
function onlyRealUserIds(ids: string[]): string[] {
  return ids.filter((id) => UUID_RE.test(id));
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Chưa đăng nhập.');
  return data.user.id;
}

/** Author/reaction/view của người khác có thể null nếu RLS user_profiles chưa cho đọc (trước đợt 3). */
function mapUser(row: AuthorRow, fallbackId: string): User {
  if (!row) return { id: fallbackId, displayName: 'Người dùng', username: 'nguoi_dung' };
  return { id: row.user_id, displayName: row.display_name, username: row.username, avatarUrl: row.avatar_url ?? undefined };
}

function mapCategory(row: CategoryEmbedRow): Category | undefined {
  if (!row) return undefined;
  return { id: row.id, name: row.name, icon: row.icon, isDefault: row.is_default, isActive: row.is_active };
}

async function resolveImageUrls(paths: string[]): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(paths)];
  const result = new Map<string, string>();
  if (uniquePaths.length === 0) return result;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  for (const item of data) {
    if (item.path && item.signedUrl) result.set(item.path, item.signedUrl);
  }
  return result;
}

function mapPost(row: PostQueryRow, myUserId: string, imageUrl: string): Post {
  const reactions: PostReaction[] = row.reactions.map((r) => ({
    userId: r.user_id,
    userName: r.user?.display_name ?? (r.user_id === myUserId ? 'Bạn' : 'Người dùng'),
    emoji: r.emoji,
    createdAt: r.created_at,
  }));
  const views: PostView[] = row.views.map((v) => ({
    viewerId: v.viewer_id,
    viewerName: v.viewer?.display_name ?? (v.viewer_id === myUserId ? 'Bạn' : 'Người dùng'),
    viewedAt: v.viewed_at,
  }));

  return {
    id: row.id,
    author: mapUser(row.author, row.user_id),
    postType: row.post_type,
    imageUrl,
    amount: row.amount,
    content: row.content ?? undefined,
    category: mapCategory(row.category),
    locationName: row.location_name ?? undefined,
    showLocation: row.show_location,
    privacy: row.privacy_type,
    createdAt: row.created_at,
    editedAt: row.edited_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    reactions,
    myReaction: reactions.find((r) => r.userId === myUserId)?.emoji,
    views,
  };
}

async function mapPosts(rows: PostQueryRow[], myUserId: string): Promise<Post[]> {
  const urlByPath = await resolveImageUrls(rows.map((r) => r.image_url));
  return rows.map((row) => mapPost(row, myUserId, urlByPath.get(row.image_url) ?? row.image_url));
}

/** Upload ảnh local (file:// từ expo-camera) lên Storage, trả về path lưu trong posts.image_url. */
async function uploadPostImage(userId: string, localUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, decode(base64), { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

async function syncVisibility(postId: string, selectedFriendIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase.from('post_visibility').delete().eq('post_id', postId);
  if (deleteError) throw deleteError;
  const realIds = onlyRealUserIds(selectedFriendIds);
  if (realIds.length === 0) return;
  const { error: insertError } = await supabase
    .from('post_visibility')
    .insert(realIds.map((userId) => ({ post_id: postId, user_id: userId })));
  if (insertError) throw insertError;
}

export type CreatePostInput = {
  postType: PostType;
  imageUrl: string;
  amount: number;
  content?: string;
  categoryId?: string;
  locationName?: string;
  showLocation: boolean;
  privacy: PostPrivacy;
  selectedFriendIds?: string[];
};

export const postRepo = {
  async getFeed(): Promise<Post[]> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .is('deleted_at', null)
      .neq('user_id', myUserId)
      .order('created_at', { ascending: false })
      .overrideTypes<PostQueryRow[], { merge: false }>();
    if (error) throw error;
    return mapPosts(data, myUserId);
  },

  async getMyPosts(): Promise<Post[]> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('user_id', myUserId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .overrideTypes<PostQueryRow[], { merge: false }>();
    if (error) throw error;
    return mapPosts(data, myUserId);
  },

  async getPost(postId: string): Promise<Post | undefined> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('id', postId)
      .is('deleted_at', null)
      .maybeSingle()
      .overrideTypes<PostQueryRow, { merge: false }>();
    if (error) throw error;
    if (!data) return undefined;
    return (await mapPosts([data], myUserId))[0];
  },

  async createPost(input: CreatePostInput): Promise<Post> {
    const myUserId = await requireUserId();

    if (input.postType === 'EXPENSE' && !input.categoryId) {
      throw new Error('Khoản chi cần chọn danh mục');
    }

    const imagePath = await uploadPostImage(myUserId, input.imageUrl);

    const { data: created, error: rpcError } = await supabase.rpc('create_post', {
      p_post_type: input.postType,
      p_image_path: imagePath,
      p_amount: input.amount,
      p_content: input.content ?? null,
      p_category_id: input.categoryId ?? null,
      p_location_name: input.locationName ?? null,
      p_show_location: input.showLocation,
      p_privacy_type: input.privacy,
      p_selected_friend_ids: input.privacy === 'SELECTED_FRIENDS' ? onlyRealUserIds(input.selectedFriendIds ?? []) : null,
    });
    if (rpcError) throw rpcError;

    const post = await this.getPost(created.id);
    if (!post) throw new Error('Không tìm thấy bài vừa tạo.');
    return post;
  },

  /** Sửa số tiền, danh mục, nội dung, quyền xem — không đổi ảnh. */
  async updatePost(
    postId: string,
    patch: Partial<Pick<Post, 'amount' | 'content' | 'privacy' | 'selectedFriendIds'>> & { categoryId?: string }
  ): Promise<Post> {
    const postPatch: PostUpdate = { edited_at: new Date().toISOString() };
    if (patch.amount !== undefined) postPatch.amount = Math.max(0, patch.amount);
    if (patch.content !== undefined) postPatch.content = patch.content;
    if (patch.privacy !== undefined) postPatch.privacy_type = patch.privacy;
    if (patch.categoryId !== undefined) postPatch.category_id = patch.categoryId;

    const { error: updateError } = await supabase.from('posts').update(postPatch).eq('id', postId);
    if (updateError) throw updateError;

    if (patch.amount !== undefined || patch.categoryId !== undefined) {
      const txPatch: Partial<Pick<ExpenseTransactionRow, 'amount' | 'category_id'>> = {};
      if (patch.amount !== undefined) txPatch.amount = Math.max(0, patch.amount);
      if (patch.categoryId !== undefined) txPatch.category_id = patch.categoryId;
      const { error: txError } = await supabase.from('expense_transactions').update(txPatch).eq('post_id', postId);
      if (txError) throw txError;
    }

    if (patch.selectedFriendIds !== undefined) {
      await syncVisibility(postId, patch.selectedFriendIds);
    }

    const post = await this.getPost(postId);
    if (!post) throw new Error(`Không tìm thấy bài: ${postId}`);
    return post;
  },

  /** Soft delete — xoá luôn khoản chi đi kèm (CLAUDE.md: "Xoá bài → xoá luôn khoản chi đi kèm"). */
  async deletePost(postId: string): Promise<void> {
    const now = new Date().toISOString();
    const { data: postRows, error: postError } = await supabase
      .from('posts')
      .update({ deleted_at: now })
      .eq('id', postId)
      .select('id');
    if (postError) throw postError;
    // RLS chặn thì Supabase không trả lỗi, chỉ update 0 dòng — tự phát hiện để báo lỗi rõ ràng.
    if (!postRows || postRows.length === 0) {
      throw new Error('Không có quyền xoá bài này (hoặc bài không tồn tại).');
    }
    const { error: txError } = await supabase.from('expense_transactions').update({ deleted_at: now }).eq('post_id', postId);
    if (txError) throw txError;
  },

  /** Thả / đổi / bỏ cảm xúc của tôi trên một bài — mỗi người 1 cảm xúc / bài. */
  async reactToPost(postId: string, emoji: ReactionEmoji): Promise<Post> {
    const myUserId = await requireUserId();

    const { data: existing, error: fetchError } = await supabase
      .from('post_reactions')
      .select('emoji')
      .eq('post_id', postId)
      .eq('user_id', myUserId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    if (existing?.emoji === emoji) {
      const { error } = await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', myUserId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('post_reactions')
        .upsert({ post_id: postId, user_id: myUserId, emoji }, { onConflict: 'post_id,user_id' });
      if (error) throw error;
    }

    const post = await this.getPost(postId);
    if (!post) throw new Error(`Không tìm thấy bài: ${postId}`);
    return post;
  },

  async markViewed(postId: string): Promise<void> {
    const myUserId = await requireUserId();
    const { error } = await supabase
      .from('post_views')
      .upsert({ post_id: postId, viewer_id: myUserId, viewed_at: new Date().toISOString() }, { onConflict: 'post_id,viewer_id', ignoreDuplicates: true });
    if (error) throw error;
  },
};
