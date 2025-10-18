import { json } from '@sveltejs/kit';
import { findUserByEmail, createUser, createSession, setSessionCookie } from '$lib/server/auth';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST(event) {
  try {
    const body = await event.request.json().catch(() => ({}));
    const { email, password, name } = body || {};
    if (!email || !password || !name) return json({ error: 'Missing fields' }, { status: 400 });
    const existing = await findUserByEmail(email);
    if (existing) return json({ error: 'Email already registered' }, { status: 409 });
    const user = await createUser({ email, name, password });
    const session = await createSession(user.id);
    setSessionCookie(event, session);
    return json({ user }, { status: 201 });
  } catch (err) {
    // Log to server console for debugging
    console.error('register endpoint error:', err);
    // In development, return the error message to the client to aid debugging
    const dev = process.env.NODE_ENV !== 'production';
    const message = dev ? String((err && typeof err === 'object' && 'message' in err ? err.message : err) || 'Unknown error') : 'Internal Error';
    return json({ error: message }, { status: 500 });
  }
}
