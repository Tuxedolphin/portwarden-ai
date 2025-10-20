import { json } from '@sveltejs/kit';
import { incidents } from '$lib/data/incidents.js';
import { requireUser } from '$lib/server/auth';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { supabase } from '$lib/server/db';
import { env } from '$env/dynamic/private';

const DEFAULT_STATUS = 'open';
const DEFAULT_DEPLOYMENT = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://psacodesprint2025.azure-api.net/gpt-5-mini/openai';
const DEFAULT_API_VERSION = '2025-01-01-preview';
const VALID_STATUSES = new Set(['open', 'in-progress', 'resolved']);
const PLACEHOLDER_PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$placeholder$placeholderhash';
const ESCALATION_RESPONSE_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: ['summary', 'escalationLikelihood', 'reasoning'],
	properties: {
		summary: { type: 'string', minLength: 1 },
		escalationLikelihood: {
			type: 'string',
			enum: ['likely', 'unlikely', 'uncertain']
		},
		reasoning: { type: 'string', minLength: 1 }
	}
};

/**
 * @param {{ incident_tags?: Array<Record<string, any>>; [key: string]: any }} row
 * @returns {{ id: number; title: string; caseCode: string; description: string; status: string; created_at: string; updated_at: string; tags: string[]; ai_playbook: string; ai_escalation: string; ai_escalation_likelihood: string; ai_contact_category: string; ai_contact_code: string; ai_contact_name: string; ai_contact_email: string; ai_contact_role: string; ai_escalation_subject: string; ai_escalation_message: string; ai_escalation_reasoning: string; ai_description: string }}
 */
function mapIncidentRowFromSupabase(row) {
	const tags = Array.isArray(row?.incident_tags)
		? row.incident_tags
				.map(
					/** @type {(relation: Record<string, any>) => string | null} */ (relation) => {
						if (relation && typeof relation === 'object' && 'tags' in relation) {
							const nested = relation.tags;
							if (nested && typeof nested === 'object' && 'name' in nested) {
								return String(nested.name);
							}
						}
						return null;
					}
				)
				.filter(
					/** @type {(value: string | null) => value is string} */ (value) =>
						typeof value === 'string'
				)
		: [];

	const createdAt = row?.created_at ? new Date(row.created_at) : new Date();
	const updatedAt = row?.updated_at ? new Date(row.updated_at) : createdAt;

	return {
		id: row?.id ?? 0,
		title: row?.title ?? '',
		caseCode: row?.case_code ?? '',
		description: row?.description ?? '',
		status: row?.status ?? 'open',
		created_at: createdAt.toISOString(),
		updated_at: updatedAt.toISOString(),
		tags,
		ai_playbook: row?.ai_playbook ?? '',
		ai_escalation: row?.ai_escalation ?? '',
		ai_escalation_likelihood: row?.ai_escalation_likelihood ?? 'unknown',
		ai_contact_category: row?.ai_contact_category ?? '',
		ai_contact_code: row?.ai_contact_code ?? '',
		ai_contact_name: row?.ai_contact_name ?? '',
		ai_contact_email: row?.ai_contact_email ?? '',
		ai_contact_role: row?.ai_contact_role ?? '',
		ai_escalation_subject: row?.ai_escalation_subject ?? '',
		ai_escalation_message: row?.ai_escalation_message ?? '',
		ai_escalation_reasoning: row?.ai_escalation_reasoning ?? '',
		ai_description: row?.ai_description ?? ''
	};
}

export async function GET(event) {
	const url = new URL(event.request.url);
	const page = Math.max(Number(url.searchParams.get('page') || '1'), 1);
	const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') || '10'), 1), 50);
	const offset = (page - 1) * pageSize;

	if (!supabase) {
		const total = incidents.length;
		const results = incidents.slice(offset, offset + pageSize).map((incident, index) => {
			let status = incidentStatusStore.get(incident.id);
			if (!status) {
				if (index % 3 === 1) status = 'in-progress';
				else if (index % 3 === 2) status = 'resolved';
				else status = 'open';
			}

			return {
				id: incident.id,
				title: incident.title,
				description: incident.summary,
				status,
				created_at: incident.occurredAt,
				updated_at: incident.occurredAt,
				tags: [],
				ai_playbook: '',
				ai_escalation: '',
				ai_escalation_likelihood: 'unknown',
				ai_contact_category: '',
				ai_contact_code: '',
				ai_contact_name: '',
				ai_contact_email: '',
				ai_contact_role: '',
				ai_escalation_subject: '',
				ai_escalation_message: '',
				ai_escalation_reasoning: '',
				ai_description: ''
			};
		});

		return json({ total, results });
	}

	try {
		const { count: total, error: countError } = await supabase
			.from('incidents')
			.select('*', { count: 'exact', head: true });

		if (countError) {
			throw countError;
		}

		const totalCount = total ?? 0;
		console.log('[Incidents][GET] Counted incidents', { page, pageSize, total: totalCount });

		if (totalCount === 0) {
			return json({ total: 0, results: [] });
		}

		const { data, error } = await supabase
			.from('incidents')
			.select(
				`id,
				title,
				case_code,
				description,
				status,
				created_at,
				updated_at,
				ai_playbook,
				ai_escalation,
				ai_escalation_likelihood,
				ai_contact_category,
				ai_contact_code,
				ai_contact_name,
				ai_contact_email,
				ai_contact_role,
				ai_escalation_subject,
				ai_escalation_message,
				ai_escalation_reasoning,
				ai_description,
				incident_tags ( tag_id, tags ( name ) )`
			)
			.order('created_at', { ascending: false })
			.range(offset, offset + pageSize - 1);

		if (error) {
			throw error;
		}

		const results = (data ?? []).map(mapIncidentRowFromSupabase);

		const aiStatuses = results.map(
			/** @type {(item: ReturnType<typeof mapIncidentRowFromSupabase>) => { id: number; hasAi: boolean }} */ (
				(item) => ({
					id: item.id,
					hasAi: Boolean(item.ai_playbook || item.ai_escalation)
				})
			)
		);
		console.log('[Incidents][GET] Retrieved incidents', {
			page,
			pageSize,
			total: totalCount,
			aiStatuses
		});

		return json({ total: totalCount, results });
	} catch (error) {
		console.error('Failed to load incidents from Supabase:', error);
		return json({ error: 'Failed to load incidents' }, { status: 500 });
	}
}

export async function POST(event) {
	const user = await requireUser(event);
	const body = await event.request.json().catch(() => ({}));

	const {
		code,
		caseCode: incomingCaseCode,
		description: rawDescription,
		tags: tagNames,
		title: providedTitle,
		status: requestedStatus,
		regenerateForId: rawRegenerateId
	} = body || {};

	let caseCode = normalizeCaseCode(incomingCaseCode ?? code);
	let description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
	const tags = normalizeTags(tagNames);
	let title = typeof providedTitle === 'string' ? providedTitle.trim() : '';
	const regenerateTargetId = normalizeInsertId(rawRegenerateId);
	const isRegeneration = regenerateTargetId !== null;
	const normalizedStatus =
		requestedStatus && VALID_STATUSES.has(requestedStatus) ? requestedStatus : DEFAULT_STATUS;

	if (!isRegeneration && (!caseCode || !description)) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	if (!supabase) {
		return json({ error: 'Database not configured' }, { status: 503 });
	}

	const now = new Date();
	const nowIso = now.toISOString();

	try {
		const dbUserId = await ensureDbUserRecord(supabase, user);

		if (!title) {
			title = await generateIncidentTitle({ caseCode, description, tags });
		}

		if (!title) {
			title = `Incident ${caseCode}`;
		}

		const { data: insertedIncident, error: insertError } = await supabase
			.from('incidents')
			.insert({
				title,
				case_code: caseCode,
				description,
				status: DEFAULT_STATUS,
				created_by: dbUserId,
				created_at: nowIso,
				updated_at: nowIso,
				ai_playbook: '',
				ai_escalation: '',
				ai_escalation_likelihood: 'unknown'
			})
			.select('id')
			.single();

		if (insertError || !insertedIncident) {
			throw insertError ?? new Error('Failed to create incident');
		}

		const incidentId = Number(insertedIncident.id);
		if (!Number.isFinite(incidentId)) {
			throw new Error('Invalid incident identifier returned from Supabase');
		}

		if (tags.length > 0) {
			await persistIncidentTags(supabase, incidentId, tags);
		}

		console.log('[Incidents][POST] Persisted new incident', {
			incidentId,
			title,
			caseCode,
			tags,
			descriptionPreview: description.slice(0, 200)
		});

		incidentStatusStore.set(String(incidentId), normalizedStatus);

		const responseIncident = {
			id: incidentId,
			title,
			caseCode,
			description,
			status: DEFAULT_STATUS,
			created_at: nowIso,
			updated_at: nowIso,
			tags,
			ai_playbook: '',
			ai_escalation: '',
			ai_escalation_likelihood: 'unknown',
			ai_contact_category: '',
			ai_contact_code: '',
			ai_contact_name: '',
			ai_contact_email: '',
			ai_contact_role: '',
			ai_escalation_subject: '',
			ai_escalation_message: '',
			ai_escalation_reasoning: '',
			ai_description: ''
		};

		scheduleAiGeneration(supabase, {
			incidentId,
			title,
			caseCode,
			description,
			tags
		});
		console.log('[Incidents][POST] Scheduled AI generation', { incidentId });

		return json(responseIncident, { status: 201 });
	} catch (error) {
		console.error('Error creating incident:', error);
		return json({ error: 'Failed to create incident' }, { status: 500 });
	}
}

/**
 * @param {number} incidentId
 * @param {string[]} tags
 */
/**
 * @param {any} client
 * @param {number} incidentId
 * @param {string[]} tags
 */
async function persistIncidentTags(client, incidentId, tags) {
	if (!client || tags.length === 0) return;

	const upsertPayload = tags.map((name) => ({ name }));
	const { error: upsertError } = await client
		.from('tags')
		.upsert(upsertPayload, { onConflict: 'name' });

	if (upsertError && !isDuplicateKeyError(upsertError)) {
		throw upsertError;
	}

	const { data: tagRecords, error: selectError } = await client
		.from('tags')
		.select('id, name')
		.in('name', tags);

	if (selectError) {
		throw selectError;
	}

	const uniqueTagIds = Array.from(
		new Set(
			(tagRecords ?? [])
				.map(/** @type {(tag: { id: number }) => number} */ (tag) => Number(tag.id))
				.filter(/** @type {(id: number) => boolean} */ (id) => Number.isFinite(id))
		)
	);

	const { error: deleteError } = await client
		.from('incident_tags')
		.delete()
		.eq('incident_id', incidentId);

	if (deleteError) {
		throw deleteError;
	}

	if (uniqueTagIds.length === 0) return;

	const relationValues = uniqueTagIds.map((tagId) => ({
		incident_id: incidentId,
		tag_id: tagId
	}));

	const { error: relationError } = await client.from('incident_tags').insert(relationValues);

	if (relationError) {
		throw relationError;
	}
}

/**
 * Ensure the authenticated user has a row in the SQL users table (required for FK constraints)
 * @param {{ id: number; email: string; name?: string }} user
 */
/**
 * @param {any} client
 * @param {{ id: number; email: string; name?: string }} user
 */
async function ensureDbUserRecord(client, user) {
	if (!client) {
		throw new Error('Database not configured');
	}

	if (!user?.email) {
		throw new Error('Authenticated user is missing an email address');
	}

	const {
		data: existing,
		error: existingError,
		status: existingStatus
	} = await client.from('users').select('id').eq('email', user.email).maybeSingle();

	if (existingError && existingStatus !== 406) {
		throw existingError;
	}

	if (existing?.id) {
		return existing.id;
	}

	const fallbackName = user.name || user.email.split('@')[0] || 'Operator';

	try {
		const { data: inserted, error: insertError } = await client
			.from('users')
			.insert({
				email: user.email,
				name: fallbackName,
				password_hash: PLACEHOLDER_PASSWORD_HASH
			})
			.select('id')
			.single();

		if (insertError) {
			throw insertError;
		}

		if (inserted?.id) {
			return inserted.id;
		}
	} catch (error) {
		if (isDuplicateKeyError(error)) {
			const { data: retry } = await client
				.from('users')
				.select('id')
				.eq('email', user.email)
				.maybeSingle();
			if (retry?.id) {
				return retry.id;
			}
		}
		throw error;
	}

	const { data: finalLookup } = await client
		.from('users')
		.select('id')
		.eq('email', user.email)
		.maybeSingle();

	if (finalLookup?.id) {
		return finalLookup.id;
	}

	throw new Error('Failed to create user record for incident author');
}

/**
 * @param {unknown} error
 */
function isDuplicateKeyError(error) {
	return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23505');
}

/**
 * @param {any} value
 */
function normalizeTags(value) {
	if (!value) return [];
	const raw = Array.isArray(value) ? value : String(value).split(',');
	return Array.from(new Set(raw.map((tag) => tag.trim()).filter(Boolean)));
}

/**
 * @param {unknown} value
 */
function normalizeCaseCode(value) {
	if (typeof value !== 'string') {
		return '';
	}
	return value.trim();
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function normalizeInsertId(value) {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
	}
	const parsed = Number.parseInt(String(value).trim(), 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null;
	}
	return parsed;
}

/**
 * @param {{ caseCode: string; description: string; tags: string[] }} input
 */
async function generateIncidentTitle({ caseCode, description, tags }) {
	const prompt = buildTitlePrompt({ caseCode, description, tags });
	try {
		const response = await callChatCompletion([
			{ role: 'system', content: 'You are Portwarden AI, a maritime duty officer co-pilot.' },
			{ role: 'user', content: prompt }
		]);
		if (typeof response === 'string') {
			const trimmed = response.trim().replace(/^['"]|['"]$/g, '');
			return trimmed;
		}
	} catch (error) {
		console.error('AI title generation failed:', error);
	}
	return '';
}

/**
 * @param {{ caseCode: string; description: string; tags: string[] }} input
 */
function buildTitlePrompt({ caseCode, description, tags }) {
	const tagsLine = tags.length ? `Tags: ${tags.join(', ')}` : 'Tags: none provided';
	return `Propose a concise maritime incident title (max 12 words) suitable for operational logs.

Incident Code: ${caseCode}

Description:
${description}

${tagsLine}`;
}

/**
 * @param {any} client
 * @param {{ incidentId: number; title: string; caseCode: string; description: string; tags: string[] }} payload
 */
function scheduleAiGeneration(client, payload) {
	if (!client) return;
	setTimeout(() => {
		generateAndStoreAiArtifacts(client, payload).catch((error) => {
			console.error(`AI artifact generation failed for incident ${payload.incidentId}:`, error);
		});
	}, 0);
}

/**
 * @param {any} client
 * @param {{ incidentId: number; title: string; caseCode: string; description: string; tags: string[] }} payload
 */
async function generateAndStoreAiArtifacts(client, payload) {
	if (!client) return;
	const { incidentId, title, caseCode, description, tags } = payload;
	try {
		const playbookContent = await generateAIPlaybook({ title, caseCode, description, tags });
		const escalationResult = await generateAIEscalation({ title, caseCode, description, tags });

		console.log('[Incidents][AI] Generated artifacts', {
			incidentId,
			playbookPreview: typeof playbookContent === 'string' ? playbookContent.slice(0, 200) : null,
			escalationPreview: escalationResult?.summary?.slice(0, 200) ?? null,
			escalationLikelihood: escalationResult?.likelihood ?? 'unknown'
		});

		const updatedAt = new Date().toISOString();
		const { error: updateError } = await client
			.from('incidents')
			.update({
				ai_playbook: playbookContent ?? '',
				ai_escalation: composeEscalationText(
					escalationResult?.summary,
					escalationResult?.reasoning
				),
				ai_escalation_likelihood: escalationResult?.likelihood ?? 'unknown',
				updated_at: updatedAt
			})
			.eq('id', incidentId);

		if (updateError) {
			throw updateError;
		}

		console.log('[Incidents][AI] Stored artifacts', {
			incidentId,
			hasPlaybook: Boolean(playbookContent),
			hasEscalation: Boolean(escalationResult?.summary),
			escalationLikelihood: escalationResult?.likelihood ?? 'unknown'
		});
	} catch (error) {
		console.error(`Failed to store AI artifacts for incident ${incidentId}:`, error);
	}
}

/**
 * @param {{ title: string; caseCode?: string; description: string; tags: string[] }} incident
 * @returns {Promise<string>}
 */
async function generateAIPlaybook(incident) {
	const prompt = buildPlaybookPrompt(incident);
	console.log('[Incidents][AI] Requesting playbook', {
		title: incident.title,
		caseCode: incident.caseCode,
		tagsCount: incident.tags.length
	});
	const playbookResponse = await callChatCompletion(
		[
			{ role: 'system', content: 'You are Portwarden AI, a maritime duty officer co-pilot.' },
			{ role: 'user', content: prompt }
		],
		{
			type: 'json_schema',
			json_schema: {
				name: 'playbook_schema',
				strict: true,
				schema: {
					type: 'object',
					additionalProperties: false,
					required: ['importantSafetyNotes', 'actionSteps', 'verificationSteps', 'checklists'],
					properties: {
						importantSafetyNotes: { type: 'array', items: { type: 'string' }, minItems: 1 },
						actionSteps: {
							type: 'array',
							minItems: 1,
							items: {
								type: 'object',
								additionalProperties: false,
								required: ['stepTitle', 'executionContext', 'procedure', 'checklistItems'],
								properties: {
									stepTitle: { type: 'string' },
									executionContext: { type: 'string' },
									procedure: { type: 'array', items: { type: 'string' }, minItems: 1 },
									checklistItems: { type: 'array', items: { type: 'string' }, minItems: 1 }
								}
							}
						},
						verificationSteps: {
							type: 'array',
							items: { type: 'string' },
							minItems: 1
						},
						checklists: {
							type: 'array',
							minItems: 1,
							items: {
								type: 'object',
								additionalProperties: false,
								required: ['title', 'items', 'relatedStep'],
								properties: {
									title: { type: 'string' },
									items: { type: 'array', items: { type: 'string' }, minItems: 1 },
									relatedStep: { type: 'string' }
								}
							}
						}
					}
				}
			}
		}
	);

	if (typeof playbookResponse === 'string') {
		const trimmed = playbookResponse.trim();
		console.log('[Incidents][AI] Playbook response received', {
			length: trimmed.length,
			preview: trimmed.slice(0, 200)
		});
		return trimmed;
	}

	console.warn('[Incidents][AI] Playbook response missing or invalid', {
		type: typeof playbookResponse
	});

	return '';
}

/**
 * @param {{ title: string; caseCode?: string; description: string; tags: string[] }} incident
 * @returns {Promise<{ summary: string; likelihood: 'likely' | 'unlikely' | 'uncertain' | 'unknown'; reasoning: string } | null>}
 */
async function generateAIEscalation(incident) {
	const prompt = buildEscalationPrompt(incident);
	console.log('[Incidents][AI] Requesting escalation', {
		title: incident.title,
		caseCode: incident.caseCode,
		tagsCount: incident.tags.length
	});
	const escalationResponse = await callChatCompletion(
		[
			{ role: 'system', content: 'You are Portwarden AI, a maritime duty officer co-pilot.' },
			{ role: 'user', content: prompt }
		],
		{
			type: 'json_schema',
			json_schema: {
				name: 'escalation_schema',
				strict: true,
				schema: ESCALATION_RESPONSE_SCHEMA
			}
		}
	);

	if (typeof escalationResponse !== 'string') {
		console.warn('[Incidents][AI] Escalation response missing or invalid', {
			type: typeof escalationResponse
		});
		return null;
	}

	const trimmed = escalationResponse.trim();
	console.log('[Incidents][AI] Escalation response received', {
		length: trimmed.length,
		preview: trimmed.slice(0, 200)
	});

	const parsed = parseEscalationPayload(trimmed);
	if (!parsed) {
		console.warn('[Incidents][AI] Escalation payload failed validation');
		return null;
	}

	return parsed;
}

/**
 * @param {{ title: string; caseCode?: string; description: string; tags: string[] }} incident
 */
function buildPlaybookPrompt(incident) {
	const tagsLine = incident.tags.length
		? `Tags: ${incident.tags.join(', ')}`
		: 'Tags: none provided';
	const codeLine = incident.caseCode
		? `Incident Code: ${incident.caseCode}`
		: 'Incident Code: not provided';
	return `Draft a remediation playbook for the following maritime incident.

Title: ${incident.title}

${codeLine}

Description:
${incident.description}

${tagsLine}

Respond in JSON that matches the provided schema (importantSafetyNotes, actionSteps with optional checklistItems arrays, verificationSteps rendered as checklists, and checklists with optional relatedStep mapping back to an action step title).
Keep instructions concise and operational.`;
}

/**
 * @param {{ title: string; caseCode?: string; description: string; tags: string[] }} incident
 */
function buildEscalationPrompt(incident) {
	const tagsLine = incident.tags.length
		? `Tags: ${incident.tags.join(', ')}`
		: 'Tags: none provided';
	const codeLine = incident.caseCode
		? `Incident Code: ${incident.caseCode}`
		: 'Incident Code: not provided';
	return `Write an escalation assessment for the following maritime incident.

Title: ${incident.title}

${codeLine}

Description:
${incident.description}

${tagsLine}

Respond strictly in JSON with these keys:
- summary: <180 words single paragraph.
- escalationLikelihood: one of likely, unlikely, or uncertain to indicate if escalation is required.
- reasoning: concise justification (<=80 words) for the likelihood rating.
Do not include markdown or commentary outside the JSON object.`;
}

/**
 * @param {Array<{ role: 'system' | 'user' | 'assistant'; content: string }>} messages
 * @param {Record<string, any>} [responseFormat]
 */
async function callChatCompletion(messages, responseFormat) {
	if (!env.AZURE_OPENAI_KEY) {
		console.warn('[Incidents][AI] Missing Azure OpenAI key, skipping call');
		return null;
	}

	const endpoint = env.AZURE_OPENAI_ENDPOINT ?? DEFAULT_ENDPOINT;
	const deployment = env.AZURE_OPENAI_DEPLOYMENT ?? DEFAULT_DEPLOYMENT;
	const apiVersion = env.AZURE_OPENAI_API_VERSION ?? DEFAULT_API_VERSION;
	const model = env.AZURE_OPENAI_MODEL ?? deployment;
	const normalizedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
	const requestUrl = `${normalizedEndpoint}/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

	const payload = {
		model,
		messages,
		...(responseFormat && { response_format: responseFormat })
	};

	console.log('[Incidents][AI] Calling Azure OpenAI', {
		endpoint: normalizedEndpoint,
		deployment,
		model,
		messageCount: messages.length,
		hasResponseFormat: Boolean(responseFormat)
	});

	const response = await fetch(requestUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-key': env.AZURE_OPENAI_KEY
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		console.error('Azure OpenAI API error:', response.status, await response.text());
		return null;
	}

	const data = await response.json();
	console.log('[Incidents][AI] Azure response received', {
		choices: data?.choices?.length ?? 0,
		usage: data?.usage ?? null
	});
	return data.choices?.[0]?.message?.content ?? null;
}

/**
 * @param {string} raw
 * @returns {{ summary: string; likelihood: 'likely' | 'unlikely' | 'uncertain' | 'unknown'; reasoning: string } | null}
 */
function parseEscalationPayload(raw) {
	let payload;
	try {
		payload = JSON.parse(raw);
	} catch (error) {
		console.warn('[Incidents][AI] Escalation JSON parse failed', error);
		return null;
	}

	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return null;
	}

	const summary = sanitizeEscalationText(payload.summary);
	const reasoning = sanitizeEscalationText(payload.reasoning);
	const likelihood = normaliseEscalationLikelihood(payload.escalationLikelihood);

	if (!summary) {
		return null;
	}

	return { summary, reasoning, likelihood };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeEscalationText(value) {
	if (typeof value !== 'string') return '';
	return value
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * @param {unknown} value
 * @returns {'likely' | 'unlikely' | 'uncertain' | 'unknown'}
 */
function normaliseEscalationLikelihood(value) {
	if (typeof value !== 'string') return 'unknown';
	const normalised = value.trim().toLowerCase();
	if (normalised === 'likely' || normalised === 'unlikely' || normalised === 'uncertain') {
		return normalised;
	}
	if (normalised === 'yes' || normalised === 'required' || normalised === 'needed') {
		return 'likely';
	}
	if (normalised === 'no' || normalised === 'not likely' || normalised === 'not_likely') {
		return 'unlikely';
	}
	return 'unknown';
}

/**
 * @param {string | null | undefined} summary
 * @param {string | null | undefined} reasoning
 * @returns {string}
 */
function composeEscalationText(summary, reasoning) {
	const summaryClean = sanitizeEscalationText(summary);
	const reasoningClean = sanitizeEscalationText(reasoning);
	if (summaryClean && reasoningClean) {
		return `${summaryClean}\n\nLikelihood rationale: ${reasoningClean}`;
	}
	return summaryClean || reasoningClean || '';
}
