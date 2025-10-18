import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getIncidentById } from '$lib/data/incidents';
import { generateAIContext } from '$lib/data/knowledgeBase.js';
import { generateResponseTemplates } from '$lib/ai/trainingAnalyzer.js';
import { KnowledgeBaseTracker } from '$lib/ai/KnowledgeBaseTracker.js';
import { ValidationFramework } from '$lib/ai/ValidationFramework.js';

const DEFAULT_DEPLOYMENT = 'gpt-5-mini';
const DEFAULT_API_VERSION = '2025-01-01-preview';
const DEFAULT_ENDPOINT = 'https://psacodesprint2025.azure-api.net/gpt-5-mini/openai';

const kbTracker = new KnowledgeBaseTracker();
const validator = new ValidationFramework();

const SYSTEM_TEXT = `You are Portwarden AI, a maritime duty officer co-pilot.
- Generate numbered action steps with clear labels
- Use code blocks for SQL/API calls (label with type)
- Reference KB articles using provided IDs [KB-1749]
- Professional tone, operational focus, prioritize safety
- Include verification steps`;

/**
 * @param {import('$lib/data/incidents').Incident} incident
 * @param {'playbook' | 'escalation'} intent
 * @param {string} sessionId
 */
function buildPrompt(incident, intent, sessionId) {
	const kbRefs = incident.knowledgeBase
		.map((entry) => `[${entry.reference}] ${entry.title}`)
		.join(', ');

	try {
		incident.knowledgeBase.forEach((entry) => {
			kbTracker.trackArticleAccess(entry.title, `${intent}_generation`, sessionId);
		});
	} catch (error) {
		console.warn('Error tracking knowledge base access:', error);
	}

	const actionSummary = incident.recommendedActions
		.map((action, index) => `${index + 1}. ${action.label} (${action.cite}): ${action.explanation}`)
		.join('\n');

	const recentEvidence = incident.correlatedEvidence
		.slice(-3)
		.map((e) => `${e.source}: ${e.message.substring(0, 80)}...`)
		.join('; ');

	let aiContext = '';
	try {
		const fullContext = generateAIContext(`${incident.summary} ${incident.title}`, 2);
		aiContext = fullContext.length > 200 ? `${fullContext.substring(0, 200)}...` : fullContext;
	} catch (error) {
		console.warn('Error generating AI context:', error);
	}

	const module = extractModuleFromIncident(incident);
	let templateHint = '';
	try {
		const templates = generateResponseTemplates();
		if (templates[intent] && templates[intent][module]) {
			templateHint = `Follow ${module} ${intent} pattern.`;
		}
	} catch (error) {
		console.warn('Error generating response templates:', error);
	}

	const intentInstruction =
		intent === 'playbook'
			? 'Generate step-by-step playbook with verification checks. Reference KB articles. Include "Ready to close" checklist.'
			: 'Draft escalation summary <180 words: incident snapshot, mitigation, risks, ask, timeline.';

	return [
		`${incident.displayId}: ${incident.title} (${incident.severity})`,
		`Summary: ${incident.summary}`,
		`Channel: ${incident.channel} | Persona: ${incident.persona}`,
		`KB: ${kbRefs}`,
		aiContext ? `Context: ${aiContext}` : '',
		`Actions: ${actionSummary}`,
		recentEvidence ? `Evidence: ${recentEvidence}` : '',
		incident.escalation.required
			? `Escalation: ${incident.escalation.owner} (${incident.escalation.team})`
			: 'No escalation required',
		incident.ragExtract ? `Guidance: ${incident.ragExtract.substring(0, 150)}...` : '',
		templateHint,
		intentInstruction
	]
		.filter(Boolean)
		.join('\n\n');
}

/**
 * @param {import('$lib/data/incidents').Incident} incident
 */
function extractModuleFromIncident(incident) {
	const description = `${incident.summary} ${incident.title}`.toLowerCase();

	if (description.includes('container') || description.includes('cntr')) return 'CNTR';
	if (description.includes('edi') || description.includes('edifact')) return 'EDI';
	if (description.includes('vessel') || description.includes('vsl')) return 'VSL';
	if (description.includes('auth') || description.includes('token')) return 'AUTH';
	if (description.includes('booking')) return 'BOOKING';

	return 'GENERAL';
}

function generateSessionId() {
	return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST(event) {
	const apiKey = env.GPT_API_KEY;
	if (!apiKey) {
		return json({ error: 'GPT_API_KEY is not configured on the server.' }, { status: 500 });
	}

	const endpoint = env.GPT_API_ENDPOINT || DEFAULT_ENDPOINT;
	const deploymentId = env.GPT_DEPLOYMENT || DEFAULT_DEPLOYMENT;
	const apiVersion = env.GPT_API_VERSION || DEFAULT_API_VERSION;

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

	const sessionId = generateSessionId();
	const prompt = buildPrompt(incident, intent, sessionId);

	console.log('ChatGPT 5 Mini Request:', {
		endpoint,
		deploymentId,
		apiVersion,
		incidentId,
		intent,
		sessionId,
		systemTokensApprox: Math.ceil(SYSTEM_TEXT.length / 4),
		promptTokensApprox: Math.ceil(prompt.length / 4)
	});

	const response = await fetch(
		`${endpoint}/deployments/${deploymentId}/chat/completions?api-version=${apiVersion}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': apiKey
			},
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: SYSTEM_TEXT },
					{ role: 'user', content: prompt }
				],
				temperature: 0.3,
				top_p: 0.8,
				max_tokens: 2048
			})
		}
	);

	const data = await response.json();

	console.log('ChatGPT 5 Mini Response Status:', response.status);
	if (data?.usage) {
		console.log('Token usage:', data.usage);
	}

	if (!response.ok) {
		console.error('ChatGPT 5 Mini error:', data?.error);
		return json(
			{ error: data?.error?.message ?? 'ChatGPT 5 Mini request failed.' },
			{ status: response.status }
		);
	}

	const choice = data?.choices?.[0];
	if (!choice) {
		return json({ error: 'ChatGPT 5 Mini returned no choices.' }, { status: 502 });
	}

	if (choice.finish_reason && choice.finish_reason !== 'stop') {
		return json(
			{
				error: 'Response generation stopped unexpectedly.',
				reason: choice.finish_reason
			},
			{ status: 502 }
		);
	}

	const output = choice.message?.content?.trim?.() ?? '';
	if (!output) {
		return json({ error: 'ChatGPT 5 Mini response was empty.' }, { status: 502 });
	}

	try {
		const module = extractModuleFromIncident(incident);
		const query = `${intent} for ${incident.title}: ${incident.summary}`;
		const validation = await validator.validateResponse(query, output, module);

		console.log(`Validation score for ${sessionId}: ${validation.overallScore}%`);
		if (validation.overallScore < 50) {
			console.warn('Low quality response detected', {
				sessionId,
				score: validation.overallScore,
				issues: validation.results
			});
		}
	} catch (validationError) {
		console.error('Validation failed:', validationError);
	}

	return json({
		output,
		sessionId,
		metadata: {
			deploymentId,
			apiVersion,
			intent,
			incidentId,
			timestamp: new Date().toISOString()
		}
	});
}
