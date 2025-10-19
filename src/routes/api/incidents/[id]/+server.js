import { json, error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth.js';
import { incidents } from '$lib/data/incidents.js';
import { incidentStatusStore } from '$lib/server/incidentStore.js';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function PATCH(event) {
	await requireUser(event);

	const incidentId = event.params.id;
	if (!incidentId) {
		throw error(400, 'Invalid incident ID');
	}

	const body = await event.request.json();
	const { status, tagNames } = body;

	try {
		// Find the incident in our mock data
		const incident = incidents.find((inc) => inc.id === incidentId);

		if (!incident) {
			throw error(404, 'Incident not found');
		}

		// Store the status change in our in-memory store
		if (status) {
			incidentStatusStore.set(incidentId, status);
		}

		// Return a mock updated incident
		const updatedIncident = {
			id: incident.id,
			title: incident.title,
			description: incident.summary,
			status: status || 'open',
			created_at: incident.occurredAt,
			updated_at: new Date().toISOString(),
			tags: tagNames || []
		};

		return json(updatedIncident);
	} catch (err) {
		console.error('Error updating incident:', err);
		throw error(500, 'Failed to update incident');
	}
}
