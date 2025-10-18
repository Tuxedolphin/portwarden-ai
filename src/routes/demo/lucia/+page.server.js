import { clearSessionCookie, invalidateSession } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load = async (event) => {
	if (!event.locals.user) throw redirect(302, '/demo/lucia/login');
	return { user: event.locals.user };
};

export const actions = {
	logout: async (event) => {
		if (!event.locals.session) return fail(401);
		await invalidateSession(event.locals.session.id);
		clearSessionCookie(event);
		throw redirect(302, '/demo/lucia/login');
	}
};
