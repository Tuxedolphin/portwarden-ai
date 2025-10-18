import { json } from '@sveltejs/kit';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function GET(event) {
	const url = new URL(event.request.url);
	const q = url.searchParams.get('q') || '';
	const t = (url.searchParams.get('tags') || '')
		.split(',')
		.map((x) => x.trim())
		.filter(Boolean);
	const page = Number(url.searchParams.get('page') || '1');
	const pageSize = Number(url.searchParams.get('pageSize') || '10');
	const offset = (page - 1) * pageSize;

	// Mock archived incidents data
	const mockArchivedIncidents = [
		{
			id: 1,
			incidentId: 'INC-001',
			title: 'Cargo Loading System Malfunction',
			summary: 'Critical failure in automated cargo loading system causing operational delays',
			archived_at: '2024-01-15T08:30:00.000Z',
			tags: [
				{ id: 1, name: 'critical' },
				{ id: 2, name: 'equipment' }
			]
		},
		{
			id: 2,
			incidentId: 'INC-002',
			title: 'Communication Tower Outage',
			summary:
				'Primary communication tower experienced power failure affecting vessel coordination',
			archived_at: '2024-01-10T14:45:00.000Z',
			tags: [
				{ id: 3, name: 'communication' },
				{ id: 4, name: 'infrastructure' }
			]
		},
		{
			id: 3,
			incidentId: 'INC-003',
			title: 'Crane Operator Training Incident',
			summary: 'Minor safety incident during crane operator certification training',
			archived_at: '2024-01-05T11:20:00.000Z',
			tags: [
				{ id: 5, name: 'training' },
				{ id: 6, name: 'safety' }
			]
		}
	];

	// Filter by search query
	let filteredIncidents = mockArchivedIncidents;
	if (q) {
		filteredIncidents = filteredIncidents.filter(
			(incident) =>
				incident.title.toLowerCase().includes(q.toLowerCase()) ||
				incident.summary.toLowerCase().includes(q.toLowerCase())
		);
	}

	// Filter by tags if specified
	if (t.length > 0) {
		filteredIncidents = filteredIncidents.filter((incident) =>
			incident.tags.some((tag) => t.includes(tag.name))
		);
	}

	// Paginate results
	const total = filteredIncidents.length;
	const results = filteredIncidents.slice(offset, offset + pageSize);

	return json({ total, results });
}
