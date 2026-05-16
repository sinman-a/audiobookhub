import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const locales = ['uk', 'en'] as const;
const defaultLocale = 'uk';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(req: NextRequest) {
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|favicon.ico|api|.*\\..*).*)'],
};
