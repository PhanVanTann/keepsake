import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import type { UserProfileRow, UserProfileUpdate } from '@/types/database';

const AVATAR_BUCKET = 'avatars';

export type UpdateProfileInput = Partial<
  Pick<
    UserProfile,
    | 'displayName'
    | 'username'
    | 'avatarUrl'
    | 'notificationTone'
    | 'defaultPostPrivacy'
    | 'moneyMode'
    | 'nextMoneyMode'
    | 'lastMomentToggle'
    | 'cycleStartDay'
    | 'nextCycleStartDay'
    | 'onboardingCompletedAt'
  >
>;

function rowToProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.user_id,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    email: row.email ?? undefined,
    moneyMode: row.money_mode,
    nextMoneyMode: row.next_money_mode ?? undefined,
    notificationTone: row.notification_tone,
    lastMomentToggle: row.last_moment_toggle,
    defaultPostPrivacy: row.default_post_privacy,
    cycleStartDay: row.cycle_start_day,
    nextCycleStartDay: row.next_cycle_start_day ?? undefined,
    deletionRequestedAt: row.deletion_requested_at ?? undefined,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
  };
}

const UPDATE_FIELD_MAP: { [K in keyof UpdateProfileInput]-?: keyof UserProfileUpdate } = {
  displayName: 'display_name',
  username: 'username',
  avatarUrl: 'avatar_url',
  notificationTone: 'notification_tone',
  defaultPostPrivacy: 'default_post_privacy',
  moneyMode: 'money_mode',
  nextMoneyMode: 'next_money_mode',
  lastMomentToggle: 'last_moment_toggle',
  cycleStartDay: 'cycle_start_day',
  nextCycleStartDay: 'next_cycle_start_day',
  onboardingCompletedAt: 'onboarding_completed_at',
};

const NULLABLE_KEYS: Array<keyof UpdateProfileInput> = ['nextMoneyMode', 'nextCycleStartDay'];

function patchToUpdate(patch: UpdateProfileInput): UserProfileUpdate {
  const update: UserProfileUpdate = {};
  for (const key of Object.keys(patch) as Array<keyof UpdateProfileInput>) {
    const value = patch[key];
    // nextMoneyMode/nextCycleStartDay là field nullable — truyền key này với giá trị undefined
    // nghĩa là "huỷ lịch đổi" (set null thật), không phải "bỏ qua, đừng đụng field này".
    if (value === undefined && !NULLABLE_KEYS.includes(key)) continue;
    const column = UPDATE_FIELD_MAP[key];
    (update as Record<string, unknown>)[column] = value ?? null;
  }
  return update;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error('Chưa đăng nhập.');
  return data.user.id;
}

export const profileRepo = {
  async getMe(): Promise<UserProfile> {
    const userId = await requireUserId();
    const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return rowToProfile(data);
  },

  /** Tải ảnh đại diện lên bucket public `avatars`, trả về URL công khai (chưa ghi vào hồ sơ). */
  async uploadAvatar(localUri: string): Promise<string> {
    const userId = await requireUserId();
    const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  async updateProfile(patch: UpdateProfileInput): Promise<UserProfile> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .update(patchToUpdate(patch))
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  /** Ẩn tài khoản ngay — xoá vĩnh viễn sau 30 ngày nếu không đăng nhập lại. */
  async requestAccountDeletion(): Promise<UserProfile> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  /** "Đăng nhập lại trước hạn là khôi phục" — huỷ yêu cầu xoá. */
  async cancelAccountDeletion(): Promise<UserProfile> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ deletion_requested_at: null })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },
};
