import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const locales = ['uk', 'en'] as const;
const defaultLocale = 'uk';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const protectedPaths = ['/dashboard', '/book'];
const adminPaths = ['/admin'];
const authPaths = ['/login', '/register'];

function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(locale.length + 1) || '/';
    }
  }
  return pathname;
}

function getLocaleFromPathname(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}`)) return locale;
  }
  return defaultLocale;
}

async function getSessionPayload(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const token =
    req.cookies.get('next-auth.session-token')?.value ??
    req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return payload;
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API and static assets
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const pathWithoutLocale = getPathnameWithoutLocale(pathname);
  const locale = getLocaleFromPathname(pathname);

  const isProtected = protectedPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isAdminPath = adminPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathWithoutLocale.startsWith(p));

  if (isProtected || isAdminPath) {
    const payload = await getSessionPayload(req);

    if (!payload) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    if (isAdminPath && payload.role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  if (isAuthPath) {
    const payload = await getSessionPayload(req);
    if (payload) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|favicon.ico|.*\\..*).*)'],
};
