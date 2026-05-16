import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const locales = ['uk', 'en'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'uk';

const protectedPaths = ['/dashboard', '/book'];
const adminPaths = ['/admin'];
const authPaths = ['/login', '/register'];

function detectLocale(req: NextRequest): Locale {
  const stored = req.cookies.get('NEXT_LOCALE')?.value as Locale | undefined;
  if (stored && locales.includes(stored)) return stored;
  const acceptLang = req.headers.get('accept-language') ?? '';
  if (acceptLang.toLowerCase().startsWith('uk')) return 'uk';
  return defaultLocale;
}

function getLocaleFromPathname(pathname: string): Locale | null {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale;
  }
  return null;
}

function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
    if (pathname === `/${locale}`) return '/';
  }
  return pathname;
}

async function getSessionRole(req: NextRequest): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const token =
    req.cookies.get('next-auth.session-token')?.value ??
    req.cookies.get('__Secure-next-auth.session-token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const localeInPath = getLocaleFromPathname(pathname);

  if (!localeInPath) {
    const locale = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = localeInPath;
  const pathWithoutLocale = getPathnameWithoutLocale(pathname);

  const isProtected = protectedPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isAdminPath = adminPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathWithoutLocale.startsWith(p));

  if (isProtected || isAdminPath) {
    const role = await getSessionRole(req);
    if (role === null) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
    if (isAdminPath && role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  if (isAuthPath) {
    const role = await getSessionRole(req);
    if (role !== null) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // Pass locale to next-intl via request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-next-intl-locale', locale);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next|_vercel|favicon.ico|api|.*\\..*).*)', '/'],
};
