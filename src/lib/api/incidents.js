/**
 * @typedef {import('$lib/types/incident').IncidentSummary} IncidentSummary
 * @typedef {import('$lib/types/incident').IncidentStatus} IncidentStatus
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function parseResponse(response) {
	let data = null;

	try {
		data = await response.json();
	} catch {
		// Ignore JSON parse errors for empty bodies.
	}

	if (!response.ok) {
		throw { status: response.status, payload: data };
	}

	return data ?? {};
}

/**
 * Normalise an incident payload from the API into the IncidentSummary shape.
 * @param {any} item
 * @returns {IncidentSummary}
 */
function normaliseIncident(item) {
	return {
		id: item?.id,
		title: item?.title ?? '',
		description: item?.description ?? '',
		status: item?.status ?? 'open',
		created_at: item?.created_at,
		tags: Array.isArray(item?.tags) ? item.tags : []
	};
}

/**
 * Fetch a paginated list of incidents.
 * @param {{ page: number; pageSize: number }} params
 * @returns {Promise<{ results: IncidentSummary[]; total: number }>}
 */
export async function fetchIncidents(params) {
	const response = await fetch(`/api/incidents?page=${params.page}&pageSize=${params.pageSize}`);
	const data = await parseResponse(response);
	const rawResults = Array.isArray(data.results) ? data.results : [];
	const results = rawResults.map(normaliseIncident);

	return {
		results,
		total: typeof data.total === 'number' ? data.total : results.length
	};
}

/**
 * Create a new incident.
 * @param {{ title: string; description: string; tags: string[] }} payload
 * @returns {Promise<IncidentSummary | null>}
 */
export async function createIncident(payload) {
	const response = await fetch('/api/incidents', {
		method: 'POST',
		headers: JSON_HEADERS,
		body: JSON.stringify(payload)
	});

	const data = await parseResponse(response);
	const incident = data?.incident ?? data;
	return incident ? normaliseIncident(incident) : null;
}

/**
 * Update the status of an incident.
 * @param {IncidentSummary['id']} incidentId
 * @param {IncidentStatus} status
 * @returns {Promise<void>}
 */
export async function updateIncidentStatus(incidentId, status) {
	await fetchWithBody(`/api/incidents/${incidentId}`, 'PATCH', { status });
}

/**
 * Archive an incident.
 * @param {IncidentSummary['id']} incidentId
 * @returns {Promise<void>}
 */
export async function archiveIncident(incidentId) {
	await fetchWithBody(`/api/incidents/${incidentId}/archive`, 'POST');
}

/**
 * Request AI assistance for an incident.
 * @param {IncidentSummary['id']} incidentId
 * @param {'playbook' | 'escalation'} intent
 * @returns {Promise<any>}
 */
export async function requestIncidentAi(incidentId, intent) {
	const data = await fetchWithBody('/api/chatgpt', 'POST', {
		incidentId,
		intent
	});

	return data;
}

/**
 * Helper to send JSON requests.
 * @param {string} url
 * @param {'POST' | 'PATCH'} method
 * @param {Record<string, unknown>} [body]
 * @returns {Promise<any>}
 */
async function fetchWithBody(url, method, body) {
	const response = await fetch(url, {
		method,
		headers: JSON_HEADERS,
		body: body ? JSON.stringify(body) : undefined
	});

	return parseResponse(response);
}
