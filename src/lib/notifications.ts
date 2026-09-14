import { supabase } from '@/lib/supabase';
import { AppError, ErrorCode } from '@/lib/errors';
import type { Notification, CreateNotificationInput } from '@/types';

export async function createNotification(params: CreateNotificationInput): Promise<Notification> {
  const { data, error } = await supabase.from('notifications').insert({
    user_id: params.user_id ?? null,
    title: params.title,
    message: params.message,
    type: params.type,
    data: params.data ?? null,
  }).select().single();

  if (error) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to create notification: ${error.message}`);
  }

  return data as Notification;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to mark notification as read: ${error.message}`);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to mark all notifications as read: ${error.message}`);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to delete notification: ${error.message}`);
  }
}
