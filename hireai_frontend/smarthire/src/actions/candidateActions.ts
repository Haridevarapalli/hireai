import { getSession } from '@/lib/auth';

const revalidatePath = (..._args: any[]) => {};

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000/api';


export async function getCandidateFullProfile() {
  const session = await getSession();
  if (!session || !session.token) return null;

  try {
    const res = await fetch(`${DJANGO_API_URL}/candidate/profile`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.warn('[Candidate] Profile fetch error:', e.message);
  }
  return null;
}

export async function updateCandidateFullProfile(payload: {
  full_name?: string;
  phone?: string;
  bio?: string;
  location?: string;
  tech_stacks?: string[];
  job_preferences?: any;
  ai_settings?: any;
  notification_settings?: any;
  resume_visibility?: string;
  parsed_resume_json?: any;
}) {
  const session = await getSession();
  if (!session || !session.token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${DJANGO_API_URL}/candidate/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      revalidatePath('/candidate/profile');
      revalidatePath('/candidate/settings');
      revalidatePath('/candidate/dashboard');
      return { success: true, profile: data };
    } else {
      const err = await res.json();
      return { error: err.detail || 'Failed to update profile' };
    }
  } catch (e: any) {
    return { error: e.message || 'Failed to update profile' };
  }
}

export async function getCandidateInterviews() {
  const session = await getSession();
  if (!session || !session.token) return [];

  try {
    const res = await fetch(`${DJANGO_API_URL}/candidate/interviews`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.warn('[Candidate] Interviews fetch error:', e.message);
  }
  return [];
}

export async function getNotifications() {
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
    console.warn('[Candidate] Notifications fetch error:', e.message);
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
      revalidatePath('/candidate/notifications');
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
      revalidatePath('/candidate/notifications');
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
      revalidatePath('/candidate/notifications');
      return { success: true };
    }
  } catch (e: any) {
    return { error: e.message };
  }
  return { success: false };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session || !session.token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${DJANGO_API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message || 'Password changed successfully' };
    } else {
      return { error: data.detail || 'Failed to change password' };
    }
  } catch (e: any) {
    return { error: e.message || 'Failed to change password' };
  }
}
