import { json } from '@sveltejs/kit';
import { incidents } from '$lib/data/incidents.js';
import { requireUser } from '$lib/server/auth';

export async function GET(event) {
	const url = new URL(event.request.url);
	const page = Number(url.searchParams.get('page') || '1');
	const pageSize = Number(url.searchParams.get('pageSize') || '10');
	const offset = (page - 1) * pageSize;

	// Use mock data instead of database
	const total = incidents.length;
	const results = incidents.slice(offset, offset + pageSize).map((incident) => ({
		id: incident.id,
		title: incident.title,
		description: incident.summary, // Use summary as description
		status: 'open', // Default status since mock data doesn't have this
		created_at: incident.occurredAt,
		tags: [] // Mock empty tags for now
	}));

	return json({ total, results });
}

export async function POST(event) {
	const user = await requireUser(event);
	const body = await event.request.json().catch(() => ({}));
	const { title, description, tags: tagNames } = body || {};

	if (!title || !description) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	// Create a mock incident response
	const mockIncident = {
		id: `INC-${Date.now()}`,
		title,
		description,
		status: 'open',
		created_at: new Date().toISOString(),
		tags: tagNames || []
	};

	return json(mockIncident, { status: 201 });
}
