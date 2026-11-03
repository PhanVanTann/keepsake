import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/types';
import type { NotificationRow } from '@/types/database';

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export const notificationRepo = {
  async getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapNotification);
  },

  async markRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);
    if (error) throw error;
  },
};
