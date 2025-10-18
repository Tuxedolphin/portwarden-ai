import { json } from '@sveltejs/kit';
import { findUserByEmail, verifyPassword, createSession, setSessionCookie } from '$lib/server/auth';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST(event) {
  const body = await event.request.json().catch(() => ({}));
  const { email, password } = body || {};
  if (!email || !password) return json({ error: 'Missing email or password' }, { status: 400 });
  const user = await findUserByEmail(email);
  if (!user) return json({ error: 'Invalid credentials' }, { status: 401 });
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return json({ error: 'Invalid credentials' }, { status: 401 });
  const session = await createSession(user.id);
  setSessionCookie(event, session);
  return json({ user: { id: user.id, email: user.email, name: user.name } });
}
