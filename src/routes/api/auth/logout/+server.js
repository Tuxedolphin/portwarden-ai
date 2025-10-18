import { json } from '@sveltejs/kit';
import { sessionCookieName, clearSessionCookie, invalidateSession } from '$lib/server/auth';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST(event) {
	const sid = event.cookies.get(sessionCookieName);
	if (sid) await invalidateSession(sid);
	clearSessionCookie(event);
	return json({ ok: true });
}
