import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getIncidentById } from '$lib/data/incidents';

const DEFAULT_MODEL = 'gemini-1.5-flash';

const SYSTEM_TEXT = `You are Portwarden AI, a maritime duty officer co-pilot. Generate concise, executable responses.
- Prefer numbered action steps with plain English labels.
- Surface SQL or API calls using fenced code blocks labelled with the artifact type (sql, bash, http, etc.).
- Reference knowledge base articles using the provided IDs (for example [KB-1749]).
- Keep tone professional and oriented to operational handover.`;

/**
 * @param {import('$lib/data/incidents').Incident} incident
 * @param {'playbook' | 'escalation'} intent
 */
function buildPrompt(incident, intent) {
	const knowledgeSummary = incident.knowledgeBase
		.map((entry) => `- ${entry.reference}: ${entry.title} -> ${entry.summary}`)
		.join('\n');

	const actionSummary = incident.recommendedActions
		.map((action, index) => {
			const prefix = `${index + 1}. ${action.label} (${action.cite})`;
			return `${prefix} -> ${action.explanation}\nArtifact (${action.artifactType}):\n${action.artifact}`;
		})
		.join('\n\n');

	const baseContext = `Incident ${incident.displayId} (${incident.title})\nChannel: ${incident.channel}\nSeverity: ${incident.severity}\nPersona: ${incident.persona}\nPrimary summary: ${incident.summary}`;

	const correlationNotes = incident.correlatedEvidence
		.map(
			(evidence) => `- ${evidence.source} @ ${evidence.timestamp ?? 'n/a'} :: ${evidence.message}`
		)
		.join('\n');

	const escalationContext = incident.escalation.required
		? `Escalation owner: ${incident.escalation.owner} (${incident.escalation.team}), channel ${incident.escalation.channel}. Summary: ${incident.escalation.summary}.`
		: `Escalation not typically required. ${incident.escalation.summary}`;

	const intentInstruction =
		intent === 'playbook'
			? 'Produce a step-by-step remediation playbook. Include prerequisites, verification checks, and the communications note. Finish with a short "Ready to close" checklist.'
			: 'Draft an escalation summary for leadership. Include incident snapshot, current mitigation, outstanding risks, and explicit ask. Recommend bridge or next check-in time. Keep under 180 words.';

	return [
		baseContext,
		`Ingestion extraction:\n${incident.ingestion.map((item) => `- ${item.label}: ${item.value}`).join('\n')}`,
		`Correlated evidence:\n${correlationNotes}`,
		`Knowledge base:\n${knowledgeSummary}`,
		`Recommended actions:\n${actionSummary}`,
		`Additional guidance: ${incident.ragExtract}`,
		`Escalation posture: ${escalationContext}`,
		`Instruction: ${intentInstruction}`
	].join('\n\n');
}

/** @type {import('./$types').RequestHandler} */
/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
	const { incidentId, intent } = await event.request.json();

	if (!incidentId || !intent) {
		return json({ error: 'incidentId and intent are required.' }, { status: 400 });
	}

	if (intent !== 'playbook' && intent !== 'escalation') {
		return json({ error: 'Unsupported intent.' }, { status: 400 });
	}

	const incident = getIncidentById(incidentId);

	if (!incident) {
		return json({ error: 'Incident not found.' }, { status: 404 });
	}

	if (!env.GEMINI_API_KEY) {
		return json({ error: 'GEMINI_API_KEY is not set on the server.' }, { status: 500 });
	}

	const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;
	const prompt = buildPrompt(incident, intent);

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				systemInstruction: {
					role: 'system',
					parts: [{ text: SYSTEM_TEXT }]
				},
				contents: [
					{
						role: 'user',
						parts: [{ text: prompt }]
					}
				],
				generationConfig: {
					temperature: 0.3,
					topP: 0.8,
					topK: 40,
					maxOutputTokens: 768
				}
			})
		}
	);

	const data = await response.json();

	if (!response.ok) {
		return json(
			{ error: data?.error?.message ?? 'Gemini API request failed.' },
			{ status: response.status }
		);
	}

	const textParts = data?.candidates?.[0]?.content?.parts;
	const output = Array.isArray(textParts)
		? textParts
				.map((part) => part.text)
				.filter(Boolean)
				.join('\n')
				.trim()
		: '';

	if (!output) {
		return json({ error: 'Gemini response was empty.' }, { status: 502 });
	}

	return json({ output });
}
