import { supabase } from '@/lib/supabase';
import type { ReportReason } from '@/types';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Chưa đăng nhập.');
  return data.user.id;
}

export const moderationRepo = {
  async reportPost(postId: string, reason: ReportReason): Promise<void> {
    const myUserId = await requireUserId();
    const { error } = await supabase.from('reports').insert({ reporter_id: myUserId, post_id: postId, reason });
    if (error) throw error;
  },

  /** Chặn 1 người — huỷ kết bạn luôn, hai bên không thấy bài và không nhắn tin được (RPC block_user). */
  async blockUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('block_user', { p_blocked_id: userId });
    if (error) throw error;
  },
};
