import { requireUser } from '$lib/server/auth';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function load(event) {
	await requireUser(event);
	return {};
}
