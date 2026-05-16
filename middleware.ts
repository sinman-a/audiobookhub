import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes
  if (pathname.startsWith('/api')) return NextResponse.next();

  const pathWithoutLocale = getPathnameWithoutLocale(pathname);

  const isProtected = protectedPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isAdminPath = adminPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathWithoutLocale.startsWith(p));

  if (isProtected || isAdminPath) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Extract locale from pathname
      const locale =
        locales.find((l) => pathname.startsWith(`/${l}`)) ?? defaultLocale;
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    if (isAdminPath && token.role !== 'ADMIN') {
      const locale =
        locales.find((l) => pathname.startsWith(`/${l}`)) ?? defaultLocale;
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  if (isAuthPath) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token) {
      const locale =
        locales.find((l) => pathname.startsWith(`/${l}`)) ?? defaultLocale;
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
