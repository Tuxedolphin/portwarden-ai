import { json } from '@sveltejs/kit';
import { sessionCookieName, validateSession } from '$lib/server/auth';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function GET(event) {
  const sid = event.cookies.get(sessionCookieName);
  const { user } = await validateSession(sid || '');
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  return json({ id: user.id, email: user.email, name: user.name });
}
