import { redirect } from '@sveltejs/kit';
import { validateSession, sessionCookieName } from '$lib/server/auth';

/**
 * Root layout server guard.
 * - Whitelists public prefixes (login, api, archive, static assets)
 * - Redirects all other requests to /login when there's no valid session
 */
export async function load(event) {
  const pathname = event.url.pathname || '/';

  // Public routes that do not require authentication
  const publicPrefixes = ['/login', '/api', '/archive', '/favicon', '/robots.txt', '/sitemap.xml', '/assets', '/_app', '/static', '/stories'];
  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    // still expose user when available so header can show login state
    const sid = event.cookies.get(sessionCookieName) || '';
    const { user } = await validateSession(sid);
    return { user };
  }

  // Protected route: require a valid session otherwise redirect to /login
  const sid = event.cookies.get(sessionCookieName) || '';
  const { user } = await validateSession(sid);
  if (!user) {
    throw redirect(302, '/login');
  }

  return { user };
}
