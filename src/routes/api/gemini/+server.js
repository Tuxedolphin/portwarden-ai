import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getIncidentById } from '$lib/data/incidents';
import { generateAIContext, searchKnowledgeBase } from '$lib/data/knowledgeBase.js';
import { generateTrainingContext, findSimilarCases } from '$lib/data/caseLog.js';
import { analyzeResponsePatterns, generateResponseTemplates } from '$lib/ai/trainingAnalyzer.js';
import { KnowledgeBaseTracker } from '$lib/ai/KnowledgeBaseTracker.js';
import { ValidationFramework } from '$lib/ai/ValidationFramework.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';

// Initialize AI enhancement components
const kbTracker = new KnowledgeBaseTracker();
const validator = new ValidationFramework();

const SYSTEM_TEXT = `You are Portwarden AI, a maritime duty officer co-pilot. 
- Generate numbered action steps with clear labels
- Use code blocks for SQL/API calls (labeled with type)
- Reference KB articles using provided IDs [KB-1749]
- Professional tone, operational focus, prioritize safety
- Include verification steps`;

/**
 * @param {import('$lib/data/incidents').Incident} incident
 * @param {'playbook' | 'escalation'} intent
 * @param {string} sessionId
 */
function buildPrompt(incident, intent, sessionId) {
	// Concise knowledge base references
	const kbRefs = incident.knowledgeBase
		.map((entry) => `[${entry.reference}] ${entry.title}`)
		.join(', ');

	// Track knowledge base access (with error handling)
	try {
		incident.knowledgeBase.forEach(entry => {
			kbTracker.trackArticleAccess(entry.title, `${intent}_generation`, sessionId);
		});
	} catch (error) {
		console.warn('Error tracking knowledge base access:', error);
	}

	// Summarize actions without full artifacts (to save tokens)
	const actionSummary = incident.recommendedActions
		.map((action, index) => `${index + 1}. ${action.label} (${action.cite}): ${action.explanation}`)
		.join('\n');

	// Concise evidence summary (limit to 3 most recent)
	const recentEvidence = incident.correlatedEvidence
		.slice(-3)
		.map(e => `${e.source}: ${e.message.substring(0, 80)}...`)
		.join('; ');

	// Enhanced context but limit length
	let aiContext = '';
	try {
		const fullContext = generateAIContext(incident.summary + ' ' + incident.title, 2);
		aiContext = fullContext.length > 200 ? fullContext.substring(0, 200) + '...' : fullContext;
	} catch (error) {
		console.warn('Error generating AI context:', error);
	}

	// Get concise template guidance
	const module = extractModuleFromIncident(incident);
	let templateHint = '';
	try {
		const templates = generateResponseTemplates();
		if (templates[intent] && templates[intent][module]) {
			// Extract just the key points from template, not full text
			templateHint = `Follow ${module} ${intent} pattern.`;
		}
	} catch (error) {
		console.warn('Error generating response templates:', error);
	}

	const intentInstruction = intent === 'playbook'
		? 'Generate step-by-step playbook with verification checks. Reference KB articles. Include "Ready to close" checklist.'
		: 'Draft escalation summary <180 words: incident snapshot, mitigation, risks, ask, timeline.';

	// Compact prompt structure
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
	].filter(Boolean).join('\n\n');
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

	// Debug logging for troubleshooting
	console.log('Gemini API Request Details:');
	console.log('- Model:', model);
	console.log('- Incident ID:', incidentId);
	console.log('- Intent:', intent);
	console.log('- System instruction tokens (approx):', Math.ceil(SYSTEM_TEXT.length / 4));
	console.log('- Prompt length:', prompt.length);
	console.log('- Prompt tokens (approx):', Math.ceil(prompt.length / 4));
	console.log('- Total tokens (approx):', Math.ceil((SYSTEM_TEXT.length + prompt.length) / 4));
	console.log('- Session ID:', sessionId);

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
					maxOutputTokens: 2048
				}
			})
		}
	);

	const data = await response.json();

	// Enhanced error logging for debugging
	console.log('Gemini API Response Status:', response.status);
	
	// Log token usage if available
	if (data?.usageMetadata) {
		console.log('Token Usage:', {
			promptTokens: data.usageMetadata.promptTokenCount,
			totalTokens: data.usageMetadata.totalTokenCount,
			thoughtsTokens: data.usageMetadata.thoughtsTokenCount || 0
		});
	}
	
	console.log('Gemini API Response Data:', JSON.stringify(data, null, 2));

	if (!response.ok) {
		console.error('Gemini API Error:', data?.error);
		return json(
			{ error: data?.error?.message ?? 'Gemini API request failed.' },
			{ status: response.status }
		);
	}

	// Check for blocked content or other issues
	if (data?.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
		console.error('Gemini finished with reason:', data.candidates[0].finishReason);
		const reason = data.candidates[0].finishReason;
		let errorMsg = 'Content generation stopped unexpectedly.';
		
		if (reason === 'SAFETY') {
			errorMsg = 'Content was blocked due to safety filters.';
		} else if (reason === 'RECITATION') {
			errorMsg = 'Content was blocked due to recitation concerns.';
		} else if (reason === 'MAX_TOKENS') {
			errorMsg = 'Response was truncated due to length limits.';
		}
		
		return json({ error: errorMsg, reason }, { status: 502 });
	}

	const textParts = data?.candidates?.[0]?.content?.parts;
	console.log('Text parts found:', textParts?.length || 0);
	
	const output = Array.isArray(textParts)
		? textParts
				.map((part) => part.text)
				.filter(Boolean)
				.join('\n')
				.trim()
		: '';

	console.log('Final output length:', output?.length || 0);

	if (!output) {
		console.error('Empty output detected. Full response:', JSON.stringify(data, null, 2));
		return json({ 
			error: 'Gemini response was empty.',
			debug: {
				candidates: data?.candidates?.length || 0,
				finishReason: data?.candidates?.[0]?.finishReason,
				hasContent: !!data?.candidates?.[0]?.content,
				hasParts: !!data?.candidates?.[0]?.content?.parts,
				partsCount: data?.candidates?.[0]?.content?.parts?.length || 0
			}
		}, { status: 502 });
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
