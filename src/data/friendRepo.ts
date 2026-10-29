import { supabase } from '@/lib/supabase';
import type { Friend, FriendRequest, User } from '@/types';
import type { PublicProfileRow } from '@/types/database';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Chưa đăng nhập.');
  return data.user.id;
}

function mapPublicProfile(row: PublicProfileRow): User {
  return { id: row.user_id, displayName: row.display_name, username: row.username, avatarUrl: row.avatar_url ?? undefined };
}

async function fetchProfilesByIds(ids: string[]): Promise<Map<string, User>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, User>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase.from('user_profiles').select('user_id, display_name, username, avatar_url').in('user_id', unique);
  if (error) throw error;
  for (const row of data) {
    map.set(row.user_id, { id: row.user_id, displayName: row.display_name, username: row.username, avatarUrl: row.avatar_url ?? undefined });
  }
  return map;
}

export const friendRepo = {
  async getFriends(): Promise<Friend[]> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id_1, user_id_2, created_at')
      .or(`user_id_1.eq.${myUserId},user_id_2.eq.${myUserId}`);
    if (error) throw error;

    const otherIds = data.map((f) => (f.user_id_1 === myUserId ? f.user_id_2 : f.user_id_1));
    const profiles = await fetchProfilesByIds(otherIds);

    return data
      .map((f) => {
        const otherId = f.user_id_1 === myUserId ? f.user_id_2 : f.user_id_1;
        const profile = profiles.get(otherId);
        return profile ? { ...profile, friendsSince: f.created_at } : undefined;
      })
      .filter((f): f is Friend => !!f);
  },

  async getIncomingRequests(): Promise<FriendRequest[]> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, sender_id, receiver_id, status, created_at, responded_at')
      .eq('receiver_id', myUserId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const profiles = await fetchProfilesByIds([...data.map((r) => r.sender_id), myUserId]);
    const resolveUser = (id: string): User => profiles.get(id) ?? { id, displayName: 'Người dùng', username: 'nguoi_dung' };

    return data.map((r) => ({
      id: r.id,
      sender: resolveUser(r.sender_id),
      receiver: resolveUser(r.receiver_id),
      status: r.status,
      createdAt: r.created_at,
      respondedAt: r.responded_at ?? undefined,
    }));
  },

  async respondToRequest(requestId: string, accept: boolean): Promise<void> {
    const { error } = await supabase.rpc('respond_to_friend_request', { p_request_id: requestId, p_accept: accept });
    if (error) throw error;
  },

  /** Tìm đúng 1 người theo SĐT hoặc email — qua RPC để không phải mở SELECT phone/email trực tiếp. */
  async searchByContact(query: string): Promise<User | undefined> {
    if (!query.trim()) return undefined;
    const { data, error } = await supabase.rpc('find_user_by_contact', { p_query: query });
    if (error) throw error;
    const row = data[0];
    return row ? mapPublicProfile(row) : undefined;
  },

  async hasSentRequest(userId: string): Promise<boolean> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', myUserId)
      .eq('receiver_id', userId)
      .eq('status', 'PENDING')
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  /** Gửi lời mời kết bạn — cần người kia đồng ý (không tự động thành bạn). */
  async sendFriendRequest(userId: string): Promise<void> {
    const myUserId = await requireUserId();
    const { error } = await supabase.from('friend_requests').insert({ sender_id: myUserId, receiver_id: userId });
    if (error) throw error;
  },

  /** Xem trước tên/avatar của người bị quét QR, trước khi bấm "Kết bạn ngay". */
  async getUserPreview(userId: string): Promise<User | undefined> {
    const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: userId });
    if (error) throw error;
    const row = data[0];
    return row ? mapPublicProfile(row) : undefined;
  },

  /** Thành bạn ngay — dùng cho quét mã QR / bấm link mời. */
  async addFriendDirect(userId: string): Promise<Friend> {
    const { error } = await supabase.rpc('add_friend_direct', { p_other_user_id: userId });
    if (error) throw error;

    const { data, error: profileError } = await supabase.rpc('get_public_profile', { p_user_id: userId });
    if (profileError) throw profileError;
    const row = data[0];
    if (!row) throw new Error('Không tìm thấy người dùng này');
    return { ...mapPublicProfile(row), friendsSince: new Date().toISOString() };
  },

  /** Xem trước ai đã gửi link mời ở /invite/[code] — gọi được cả khi chưa đăng nhập. */
  async getInvitePreview(code: string): Promise<{ inviterId: string; inviter: User; expiresAt: string } | undefined> {
    const { data: link, error: linkError } = await supabase
      .from('invite_links')
      .select('inviter_id, expires_at, used_by')
      .eq('code', code)
      .maybeSingle();
    if (linkError) throw linkError;
    if (!link) return undefined;

    const { data, error: profileError } = await supabase.rpc('get_public_profile', { p_user_id: link.inviter_id });
    if (profileError) throw profileError;
    const row = data[0];
    if (!row) return undefined;

    return { inviterId: link.inviter_id, inviter: mapPublicProfile(row), expiresAt: link.expires_at };
  },

  /** Bấm link mời sau khi đã đăng nhập — thành bạn ngay với người mời, trả về inviter_id. */
  async redeemInviteCode(code: string): Promise<string> {
    const { data, error } = await supabase.rpc('redeem_invite_link', { p_code: code });
    if (error) throw error;
    return data;
  },

  /** Tạo link mời mới (7 ngày, 1 lần dùng) — dùng cho nút "Gửi link mời". */
  async createInviteLink(): Promise<string> {
    const myUserId = await requireUserId();
    const { data, error } = await supabase.from('invite_links').insert({ inviter_id: myUserId }).select('code').single();
    if (error) throw error;
    return data.code;
  },
};
