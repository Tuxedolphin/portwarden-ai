import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { incidents } from '$lib/data/incidents.js';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST(event) {
	await requireUser(event);
	const id = event.params.id;

	// Find the incident in our mock data
	const incident = incidents.find((inc) => inc.id === id);
	if (!incident) return json({ error: 'Not found' }, { status: 404 });

	// Mock archiving - in a real app, this would move the incident to an archive table
	// For now, we'll just return success
	return json({ ok: true });
}
