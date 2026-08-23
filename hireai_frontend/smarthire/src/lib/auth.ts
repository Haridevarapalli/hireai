import { SignJWT, jwtVerify } from 'jose';

const secretKey = 'super-secret-key-hireai'; // In production, this should be an env variable
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: number;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
  token?: string;
  refreshToken?: string;
}

async function getCookieStore() {
  if (typeof window !== 'undefined') {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cookies } = require('next/headers');
    return await cookies();
  } catch (e) {
    return null;
  }
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt(payload);

  const cookieStore = await getCookieStore();
  if (cookieStore) {
    cookieStore.set('session', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await getCookieStore();
  if (!cookieStore) return null;
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function deleteSession() {
  const cookieStore = await getCookieStore();
  if (cookieStore) {
    cookieStore.delete('session');
  }
}
