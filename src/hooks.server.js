import {
	sessionCookieName,
	validateSession,
	setSessionCookie,
	clearSessionCookie
} from '$lib/server/auth';

/** @type {import('@sveltejs/kit').Handle} */
const handleAuth = async ({ event, resolve }) => {
	const sid = event.cookies.get(sessionCookieName);
	if (!sid) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}
	const { session, user } = await validateSession(sid);
	if (session && user) {
		setSessionCookie(event, session);
	} else {
		clearSessionCookie(event);
	}
	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handle = handleAuth;
