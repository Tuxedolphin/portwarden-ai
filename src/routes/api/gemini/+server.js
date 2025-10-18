import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getIncidentById } from '$lib/data/incidents';
import { generateAIContext, searchKnowledgeBase } from '$lib/data/knowledgeBase.js';
import { generateTrainingContext, findSimilarCases } from '$lib/data/caseLog.js';
import { analyzeResponsePatterns, generateResponseTemplates } from '$lib/ai/trainingAnalyzer.js';
import { KnowledgeBaseTracker } from '$lib/ai/KnowledgeBaseTracker.js';
import { ValidationFramework } from '$lib/ai/ValidationFramework.js';

const DEFAULT_MODEL = 'gemini-1.5-flash';

// Initialize AI enhancement components
const kbTracker = new KnowledgeBaseTracker();
const validator = new ValidationFramework();

const SYSTEM_TEXT = `You are Portwarden AI, a maritime duty officer co-pilot. Generate concise, executable responses.
- Prefer numbered action steps with plain English labels.
- Surface SQL or API calls using fenced code blocks labelled with the artifact type (sql, bash, http, etc.).
- Reference knowledge base articles using the provided IDs (for example [KB-1749]).
- Keep tone professional and oriented to operational handover.
- Follow operational procedures and include verification steps.
- Prioritize safety considerations in all recommendations.`;

/**
 * @param {import('$lib/data/incidents').Incident} incident
 * @param {'playbook' | 'escalation'} intent
 * @param {string} sessionId
 */
function buildPrompt(incident, intent, sessionId) {
	const knowledgeSummary = incident.knowledgeBase
		.map((entry) => `- ${entry.reference}: ${entry.title} -> ${entry.summary}`)
		.join('\n');

	// Enhanced knowledge base context from provided files
	const enhancedKnowledgeContext = generateAIContext(incident.summary + ' ' + incident.title, 3);
	
	// Historical case analysis
	const historicalContext = generateTrainingContext(incident.summary + ' ' + incident.title);
	
	// Get module-specific response templates from training analysis
	const module = extractModuleFromIncident(incident);
	const templates = generateResponseTemplates();
	const moduleTemplate = templates[intent] && templates[intent][module] ? 
		templates[intent][module].template : null;

	// Track knowledge base access
	incident.knowledgeBase.forEach(entry => {
		kbTracker.trackArticleAccess(entry.title, `${intent}_generation`, sessionId);
	});

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
			? 'Produce a step-by-step remediation playbook. Include prerequisites, verification checks, and the communications note. Reference relevant knowledge base articles and similar historical cases. Finish with a short "Ready to close" checklist.'
			: 'Draft an escalation summary for leadership. Include incident snapshot, current mitigation, outstanding risks, and explicit ask. Reference similar historical patterns. Recommend bridge or next check-in time. Keep under 180 words.';

	// Add template guidance if available
	const templateGuidance = moduleTemplate ? 
		`\n\nTemplate for ${module} ${intent}:\n${moduleTemplate}` : '';

	return [
		baseContext,
		`Ingestion extraction:\n${incident.ingestion.map((item) => `- ${item.label}: ${item.value}`).join('\n')}`,
		`Correlated evidence:\n${correlationNotes}`,
		`Knowledge base:\n${knowledgeSummary}`,
		`Enhanced Knowledge Base Context:\n${enhancedKnowledgeContext}`,
		`Historical Analysis:\n${historicalContext}`,
		`Recommended actions:\n${actionSummary}`,
		`Additional guidance: ${incident.ragExtract}`,
		`Escalation posture: ${escalationContext}`,
		`Instruction: ${intentInstruction}${templateGuidance}`
	].join('\n\n');
}

/**
 * Extract module from incident data
 * @param {import('$lib/data/incidents').Incident} incident
 * @returns {string}
 */
function extractModuleFromIncident(incident) {
	const description = (incident.summary + ' ' + incident.title).toLowerCase();
	
	if (description.includes('container') || description.includes('cntr')) return 'CNTR';
	if (description.includes('edi') || description.includes('edifact')) return 'EDI';
	if (description.includes('vessel') || description.includes('vsl')) return 'VSL';
	if (description.includes('auth') || description.includes('token')) return 'AUTH';
	if (description.includes('booking')) return 'BOOKING';
	
	return 'GENERAL';
}

/**
 * Generate session ID for tracking
 * @returns {string}
 */
function generateSessionId() {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
	const sessionId = generateSessionId();
	const prompt = buildPrompt(incident, intent, sessionId);

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

	// Validate the AI response for quality and compliance
	try {
		const module = extractModuleFromIncident(incident);
		const query = `${intent} for ${incident.title}: ${incident.summary}`;
		const validation = await validator.validateResponse(query, output, module);
		
		// Track validation results but don't block response
		console.log(`Validation score: ${validation.overallScore}% for ${sessionId}`);
		
		// If validation score is very low, log for review
		if (validation.overallScore < 50) {
			console.warn(`Low quality response detected: ${sessionId}`, {
				score: validation.overallScore,
				issues: validation.results
			});
		}
	} catch (validationError) {
		console.error('Validation failed:', validationError);
		// Continue without blocking the response
	}

	return json({ 
		output,
		sessionId,
		metadata: {
			model,
			intent,
			incidentId,
			timestamp: new Date().toISOString()
		}
	});
}
