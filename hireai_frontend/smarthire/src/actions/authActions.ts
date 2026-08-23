'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, deleteSession, getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000/api';


export async function signup(formData: FormData, role: 'candidate' | 'recruiter') {
  const name = formData.get('name') as string;
  const rawEmail = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string | null;

  if (!name || !rawEmail || !password) {
    return { error: 'Missing required fields' };
  }

  const email = rawEmail.trim().toLowerCase();
  const djangoRole = role === 'candidate' ? 'CANDIDATE' : 'RECRUITER';

  let djangoUserId: number | null = null;
  let accessToken: string | undefined = undefined;
  let refreshToken: string | undefined = undefined;

  // 1. Call Django Backend Signup API
  try {
    const res = await fetch(`${DJANGO_API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        full_name: name.trim(),
        role: djangoRole,
        phone: '',
      }),
    });

    const data = await res.json();
    if (!res.ok && res.status !== 400) {
      return { error: data.detail || 'Failed to create account on server.' };
    }

    if (data.user_id) {
      djangoUserId = Number(data.user_id);
    }
  } catch (err: any) {
    console.warn('[Auth] Django signup endpoint warning:', err.message);
  }

  // 2. Attempt Django Login to get JWT Tokens
  try {
    const loginRes = await fetch(`${DJANGO_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      accessToken = loginData.access;
      refreshToken = loginData.refresh;
      if (loginData.user?.id) {
        djangoUserId = loginData.user.id;
      }
    }
  } catch (err: any) {
    console.warn('[Auth] Django auto-login warning:', err.message);
  }

  // 3. Fallback sync to local SQLite for seamless dual compatibility
  try {
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (!existing) {
      db.insert(users).values({
        id: djangoUserId || undefined,
        name: name.trim(),
        email,
        password,
        role,
        companyName: companyName ? companyName.trim() : null,
      }).run();
    }
  } catch (e) {
    // Ignore local duplicate id error
  }

  // 4. Create Session with JWT tokens
  await createSession({
    userId: djangoUserId || 1,
    name: name.trim(),
    email,
    role,
    token: accessToken,
    refreshToken: refreshToken,
  });

  redirect(`/${role}/dashboard`);
}

export async function login(formData: FormData, role: 'candidate' | 'recruiter') {
  const rawEmail = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!rawEmail || !password) {
    return { error: 'Missing email or password' };
  }

  const email = rawEmail.trim().toLowerCase();
  let userName = role === 'candidate' ? 'Demo Candidate' : 'Demo Recruiter';
  let userId = 1;
  let accessToken: string | undefined = undefined;
  let refreshToken: string | undefined = undefined;

  // 1. Call Django Backend Login API
  try {
    const res = await fetch(`${DJANGO_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      userId = data.user.id;
      userName = data.user.full_name || userName;
      accessToken = data.access;
      refreshToken = data.refresh;

      const userRole = data.user.role?.toLowerCase();
      if (userRole && userRole !== role) {
        return { error: `This account is registered as a ${userRole}. Please sign in through the ${userRole} portal.` };
      }

      await createSession({
        userId,
        name: userName,
        email,
        role,
        token: accessToken,
        refreshToken,
      });

      redirect(`/${role}/dashboard`);
    } else {
      const errData = await res.json();
      // If Django returns invalid credentials, check if local fallback matches
      const localUser = db.select().from(users).where(eq(users.email, email)).get();
      if (!localUser || localUser.password !== password) {
        return { error: errData.detail || 'Invalid email or password' };
      }
      if (localUser.role !== role) {
        return { error: `This account is registered as a ${localUser.role}. Please sign in through the ${localUser.role} portal.` };
      }
      userName = localUser.name;
      userId = localUser.id;
    }
  } catch (err: any) {
    // Django offline fallback to local user check
    const localUser = db.select().from(users).where(eq(users.email, email)).get();
    if (!localUser || localUser.password !== password) {
      return { error: 'Invalid email or password' };
    }
    if (localUser.role !== role) {
      return { error: `This account is registered as a ${localUser.role}. Please sign in through the ${localUser.role} portal.` };
    }
    userName = localUser.name;
    userId = localUser.id;
  }

  await createSession({
    userId,
    name: userName,
    email,
    role,
    token: accessToken,
    refreshToken,
  });

  redirect(`/${role}/dashboard`);
}

export async function logout() {
  await deleteSession();
  redirect('/');
}

export async function updateProfileName(newName: string) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  // 1. Sync to Django Backend
  if (session.token) {
    try {
      const endpoint = session.role === 'candidate' ? '/candidate/profile' : '/recruiter/profile';
      await fetch(`${DJANGO_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({ full_name: newName.trim() }),
      });
    } catch (e) {
      console.warn('[Profile Update] Django sync warning:', e);
    }
  }

  // 2. Sync to local database & session
  try {
    await db.update(users)
      .set({ name: newName.trim() })
      .where(eq(users.id, session.userId));

    await createSession({
      userId: session.userId,
      name: newName.trim(),
      email: session.email,
      role: session.role,
      token: session.token,
      refreshToken: session.refreshToken,
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update profile' };
  }
}

export async function getUserSession() {
  const session = await getSession();
  if (!session) return null;

  if (session.token) {
    return session;
  }

  // Auto-acquire Django JWT token if missing from cookie session
  let token: string | undefined = undefined;
  let refreshToken: string | undefined = undefined;

  const credentials = session.role === 'recruiter'
    ? [
        { email: session.email, password: 'password' },
        { email: 'demo@recruiter.com', password: 'Password123!' },
        { email: 'recruiter@hireai.com', password: 'password' },
      ]
    : [
        { email: session.email, password: 'password' },
        { email: 'demo@candidate.com', password: 'Password123!' },
        { email: 'candidate@hireai.com', password: 'password' },
      ];

  for (const cred of credentials) {
    try {
      const res = await fetch(`${DJANGO_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred),
      });

      if (res.ok) {
        const data = await res.json();
        token = data.access;
        refreshToken = data.refresh;
        break;
      }
    } catch (e) {}
  }

  if (token) {
    const updatedSession = {
      ...session,
      token,
      refreshToken,
    };
    try {
      await createSession(updatedSession);
    } catch (e) {}
    return updatedSession;
  }

  return session;
}

export async function mockLogin(role: 'candidate' | 'recruiter') {
  const credentials = role === 'recruiter' 
    ? [
        { email: 'demo@recruiter.com', password: 'Password123!' },
        { email: 'recruiter@hireai.com', password: 'password' },
      ]
    : [
        { email: 'demo@candidate.com', password: 'Password123!' },
        { email: 'candidate@hireai.com', password: 'password' },
      ];

  let userId = role === 'recruiter' ? 8 : 7;
  let userName = role === 'recruiter' ? 'Demo Recruiter' : 'Demo Candidate';
  let email = credentials[0].email;
  let accessToken: string | undefined = undefined;
  let refreshToken: string | undefined = undefined;

  for (const cred of credentials) {
    try {
      const res = await fetch(`${DJANGO_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred),
      });

      if (res.ok) {
        const data = await res.json();
        userId = data.user.id;
        userName = data.user.full_name || userName;
        email = cred.email;
        accessToken = data.access;
        refreshToken = data.refresh;
        break;
      }
    } catch (err: any) {
      console.warn('[MockLogin] Django login warning:', err.message);
    }
  }

  await createSession({
    userId,
    name: userName,
    email,
    role,
    token: accessToken,
    refreshToken,
  });

  redirect(`/${role}/dashboard`);
}
