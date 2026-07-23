'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, deleteSession, getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData, role: 'candidate' | 'recruiter') {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string | null;

  if (!name || !email || !password) {
    return { error: 'Missing required fields' };
  }

  try {
    // Check if user exists
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return { error: 'Email already in use' };
    }

    // Insert user
    const result = db.insert(users).values({
      name,
      email,
      password, // In a real app, hash this!
      role,
      companyName,
    }).returning({ id: users.id }).get();

    // Create session
    await createSession({
      userId: result.id,
      name,
      email,
      role,
    });

  } catch (err: any) {
    return { error: err.message || 'Failed to create account' };
  }
  redirect(`/${role}/dashboard`);
}

export async function login(formData: FormData, role: 'candidate' | 'recruiter') {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Missing required fields' };
  }

  try {
    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user || user.password !== password) {
      return { error: 'Invalid credentials' };
    }

    if (user.role !== role) {
      return { error: `This account belongs to a ${user.role}. Please login through the correct portal.` };
    }

    // Create session
    await createSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'candidate' | 'recruiter',
    });

  } catch (err: any) {
    return { error: err.message || 'Failed to login' };
  }
  redirect(`/${role}/dashboard`);
}

export async function logout() {
  await deleteSession();
  redirect('/');
}

export async function updateProfileName(newName: string) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  try {
    await db.update(users)
      .set({ name: newName })
      .where(eq(users.id, session.userId));

    // Update session with new name
    await createSession({
      userId: session.userId,
      name: newName,
      email: session.email,
      role: session.role,
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update profile' };
  }
}

export async function getUserSession() {
  return await getSession();
}

export async function mockLogin(role: 'candidate' | 'recruiter') {
  await createSession({
    userId: 9999,
    name: role === 'recruiter' ? 'Demo Recruiter' : 'Demo Candidate',
    email: `demo@${role}.com`,
    role: role,
  });
  redirect(`/${role}/dashboard`);
}
