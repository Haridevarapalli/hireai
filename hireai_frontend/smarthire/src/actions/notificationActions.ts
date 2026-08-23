'use server';

import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000/api';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  payload: Record<string, any>;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const session = await getSession();
  if (!session || !session.token) return [];

  try {
    const res = await fetch(`${DJANGO_API_URL}/notifications/mine`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.warn('[Notifications] Fetch warning:', e.message);
  }
  return [];
}

export async function markNotificationRead(notificationId: number) {
  const session = await getSession();
  if (!session || !session.token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${DJANGO_API_URL}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.token}` },
    });
    if (res.ok) {
      return { success: true };
    }
  } catch (e: any) {
    return { error: e.message };
  }
  return { success: false };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session || !session.token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${DJANGO_API_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.token}` },
    });
    if (res.ok) {
      return { success: true };
    }
  } catch (e: any) {
    return { error: e.message };
  }
  return { success: false };
}

export async function deleteNotification(notificationId: number) {
  const session = await getSession();
  if (!session || !session.token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${DJANGO_API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.token}` },
    });
    if (res.ok) {
      return { success: true };
    }
  } catch (e: any) {
    return { error: e.message };
  }
  return { success: false };
}
