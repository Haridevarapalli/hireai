import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth'; // Ensure this uses jose for Edge compatibility

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('session')?.value;

  let session = null;
  if (sessionCookie) {
    session = await decrypt(sessionCookie);
  }

  // Recruiter route protection
  if (path.startsWith('/recruiter') && !path.startsWith('/recruiter/login') && !path.startsWith('/recruiter/signup')) {
    if (!session) {
      return NextResponse.redirect(new URL('/recruiter/login', request.url));
    }
    if (session.role !== 'recruiter') {
      return NextResponse.redirect(new URL('/candidate/dashboard', request.url));
    }
    // Redirect `/recruiter` to `/recruiter/dashboard`
    if (path === '/recruiter' || path === '/recruiter/') {
      return NextResponse.redirect(new URL('/recruiter/dashboard', request.url));
    }
  }

  // Candidate route protection (Left untouched as per requirements)

  // Root path handling
  if (path === '/') {
    if (session?.role === 'recruiter') {
      return NextResponse.redirect(new URL('/recruiter/dashboard', request.url));
    } else if (session?.role === 'candidate') {
      return NextResponse.redirect(new URL('/candidate/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
