import { json } from '@sveltejs/kit';
import { incidents } from '$lib/data/incidents.js';
import { requireUser } from '$lib/server/auth';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { count, desc, eq, inArray } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const DEFAULT_STATUS = 'open';
const DEFAULT_DEPLOYMENT = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://psacodesprint2025.azure-api.net/gpt-5-mini/openai';
const DEFAULT_API_VERSION = '2025-01-01-preview';
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

export async function GET(event) {
	const url = new URL(event.request.url);
	const page = Math.max(Number(url.searchParams.get('page') || '1'), 1);
	const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') || '10'), 1), 50);
	const offset = (page - 1) * pageSize;

	if (!db) {
		// Fallback to mock data when the database is not configured
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
		const [{ value: totalCountRaw } = { value: 0n }] = await db
			.select({ value: count() })
			.from(tables.incidents);

		const total = Number(totalCountRaw ?? 0);
		console.log('[Incidents][GET] Counted incidents', { page, pageSize, total });

		if (total === 0) {
			return json({ total: 0, results: [] });
		}

		const incidentRows =
			/** @type {Array<{ id: number; title: string; caseCode: string; description: string; status: string; createdAt: Date; updatedAt: Date; ai_playbook: string | null; ai_escalation: string | null; ai_escalation_likelihood: string | null; ai_contact_category: string | null; ai_contact_code: string | null; ai_contact_name: string | null; ai_contact_email: string | null; ai_contact_role: string | null; ai_escalation_subject: string | null; ai_escalation_message: string | null; ai_escalation_reasoning: string | null; ai_description: string | null }>} */ (
				await db
					.select({
						id: tables.incidents.id,
						title: tables.incidents.title,
						caseCode: tables.incidents.caseCode,
						description: tables.incidents.description,
						status: tables.incidents.status,
						createdAt: tables.incidents.createdAt,
						updatedAt: tables.incidents.updatedAt,
						ai_playbook: tables.incidents.ai_playbook,
						ai_escalation: tables.incidents.ai_escalation,
						ai_escalation_likelihood: tables.incidents.ai_escalation_likelihood,
						ai_contact_category: tables.incidents.ai_contact_category,
						ai_contact_code: tables.incidents.ai_contact_code,
						ai_contact_name: tables.incidents.ai_contact_name,
						ai_contact_email: tables.incidents.ai_contact_email,
						ai_contact_role: tables.incidents.ai_contact_role,
						ai_escalation_subject: tables.incidents.ai_escalation_subject,
						ai_escalation_message: tables.incidents.ai_escalation_message,
						ai_escalation_reasoning: tables.incidents.ai_escalation_reasoning,
						ai_description: tables.incidents.ai_description
					})
					.from(tables.incidents)
					.orderBy(desc(tables.incidents.createdAt))
					.limit(pageSize)
					.offset(offset)
			);

		const incidentIds = incidentRows.map((row) => row.id);
		const tagsByIncident = new Map();

		if (incidentIds.length > 0) {
			const tagRows = /** @type {Array<{ incidentId: number; tagName: string }>} */ (
				await db
					.select({
						incidentId: tables.incidentTags.incidentId,
						tagName: tables.tags.name
					})
					.from(tables.incidentTags)
					.innerJoin(tables.tags, eq(tables.tags.id, tables.incidentTags.tagId))
					.where(inArray(tables.incidentTags.incidentId, incidentIds))
			);

			for (const row of tagRows) {
				if (!tagsByIncident.has(row.incidentId)) {
					tagsByIncident.set(row.incidentId, []);
				}
				tagsByIncident.get(row.incidentId).push(row.tagName);
			}
		}

		const results = incidentRows.map((row) => {
			const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
			const updatedAt = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
			return {
				id: row.id,
				title: row.title,
				caseCode: row.caseCode,
				description: row.description,
				status: row.status,
				created_at: createdAt.toISOString(),
				updated_at: updatedAt.toISOString(),
				tags: tagsByIncident.get(row.id) ?? [],
				ai_playbook: row.ai_playbook ?? '',
				ai_escalation: row.ai_escalation ?? '',
				ai_escalation_likelihood: row.ai_escalation_likelihood ?? 'unknown',
				ai_contact_category: row.ai_contact_category ?? '',
				ai_contact_code: row.ai_contact_code ?? '',
				ai_contact_name: row.ai_contact_name ?? '',
				ai_contact_email: row.ai_contact_email ?? '',
				ai_contact_role: row.ai_contact_role ?? '',
				ai_escalation_subject: row.ai_escalation_subject ?? '',
				ai_escalation_message: row.ai_escalation_message ?? '',
				ai_escalation_reasoning: row.ai_escalation_reasoning ?? '',
				ai_description: row.ai_description ?? ''
			};
		});

		const aiStatuses = results.map((item) => ({
			id: item.id,
			hasAi: Boolean(item.ai_playbook || item.ai_escalation)
		}));
		console.log('[Incidents][GET] Retrieved incidents', { page, pageSize, total, aiStatuses });

		return json({ total, results });
	} catch (error) {
		console.error('Failed to load incidents from database:', error);
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
		title: providedTitle
	} = body || {};

	const caseCode = normalizeCaseCode(incomingCaseCode ?? code);
	const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
	const tags = normalizeTags(tagNames);
	let title = typeof providedTitle === 'string' ? providedTitle.trim() : '';

	if (!caseCode || !description) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	if (!db) {
		return json({ error: 'Database not configured' }, { status: 503 });
	}

	const now = new Date();

	try {
		const dbUserId = await ensureDbUserRecord(user);

		if (!title) {
			title = await generateIncidentTitle({ caseCode, description, tags });
		}

		if (!title) {
			title = `Incident ${caseCode}`;
		}

		const insertResult = await db.insert(tables.incidents).values({
			title,
			caseCode,
			description,
			status: DEFAULT_STATUS,
			createdBy: dbUserId,
			createdAt: now,
			updatedAt: now,
			ai_playbook: '',
			ai_escalation: '',
			ai_escalation_likelihood: 'unknown'
		});

		const insertIdRaw = extractInsertId(insertResult);
		const incidentId = normalizeInsertId(insertIdRaw);

		if (incidentId === null) {
			console.error('Insert result missing ID', insertResult);
			throw new Error('Failed to retrieve incident ID after insert');
		}

		if (tags.length > 0) {
			await persistIncidentTags(incidentId, tags);
		}

		console.log('[Incidents][POST] Persisted new incident', {
			incidentId,
			title,
			caseCode,
			tags,
			descriptionPreview: description.slice(0, 200)
		});

		incidentStatusStore.set(String(incidentId), DEFAULT_STATUS);

		const responseIncident = {
			id: incidentId,
			title,
			caseCode,
			description,
			status: DEFAULT_STATUS,
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
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

		scheduleAiGeneration({
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
async function persistIncidentTags(incidentId, tags) {
	if (!db || tags.length === 0) return;

	const existingTags = /** @type {Array<{ id: number; name: string }>} */ (
		await db
			.select({ id: tables.tags.id, name: tables.tags.name })
			.from(tables.tags)
			.where(inArray(tables.tags.name, tags))
	);

	const existingByName = new Map(existingTags.map((tag) => [tag.name, tag]));
	const missingTags = tags.filter((tag) => !existingByName.has(tag));

	for (const tag of missingTags) {
		try {
			await db.insert(tables.tags).values({ name: tag });
		} catch (error) {
			if (!isDuplicateKeyError(error)) {
				throw error;
			}
		}
	}

	const tagRecords = /** @type {Array<{ id: number; name: string }>} */ (
		await db
			.select({ id: tables.tags.id, name: tables.tags.name })
			.from(tables.tags)
			.where(inArray(tables.tags.name, tags))
	);

	if (tagRecords.length === 0) return;

	const uniqueTagIds = Array.from(new Set(tagRecords.map((tag) => tag.id)));

	const existingRelations = /** @type {Array<{ tagId: number }>} */ (
		await db
			.select({ tagId: tables.incidentTags.tagId })
			.from(tables.incidentTags)
			.where(eq(tables.incidentTags.incidentId, incidentId))
	);
	const existingRelationIds = new Set(existingRelations.map((row) => row.tagId));
	const relationValues = uniqueTagIds
		.filter((tagId) => !existingRelationIds.has(tagId))
		.map((tagId) => ({ incidentId, tagId }));

	if (relationValues.length > 0) {
		await db.insert(tables.incidentTags).values(relationValues);
	}
}

/**
 * Ensure the authenticated user has a row in the SQL users table (required for FK constraints)
 * @param {{ id: number; email: string; name?: string }} user
 */
async function ensureDbUserRecord(user) {
	if (!db) {
		throw new Error('Database not configured');
	}

	if (!user?.email) {
		throw new Error('Authenticated user is missing an email address');
	}

	const existing = await db
		.select({ id: tables.users.id })
		.from(tables.users)
		.where(eq(tables.users.email, user.email))
		.limit(1);

	if (existing.length > 0) {
		return existing[0].id;
	}

	const fallbackName = user.name || user.email.split('@')[0] || 'Operator';

	try {
		const insertResult = await db.insert(tables.users).values({
			email: user.email,
			name: fallbackName,
			passwordHash: PLACEHOLDER_PASSWORD_HASH
		});

		const newUserId = Number(insertResult.insertId);
		if (Number.isFinite(newUserId)) {
			return newUserId;
		}
	} catch (error) {
		if (isDuplicateKeyError(error)) {
			const retry = await db
				.select({ id: tables.users.id })
				.from(tables.users)
				.where(eq(tables.users.email, user.email))
				.limit(1);
			if (retry.length > 0) {
				return retry[0].id;
			}
		}
		throw error;
	}

	const finalLookup = await db
		.select({ id: tables.users.id })
		.from(tables.users)
		.where(eq(tables.users.email, user.email))
		.limit(1);

	if (finalLookup.length > 0) {
		return finalLookup[0].id;
	}

	throw new Error('Failed to create user record for incident author');
}

/**
 * @param {unknown} error
 */
function isDuplicateKeyError(error) {
	return Boolean(
		error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY'
	);
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
 * @param {unknown} result
 * @returns {unknown}
 */
function extractInsertId(result) {
	if (!result) {
		return null;
	}

	if (
		typeof result === 'object' &&
		result !== null &&
		!Array.isArray(result) &&
		'insertId' in result
	) {
		const candidate = /** @type {any} */ (result).insertId;
		return candidate ?? null;
	}

	if (Array.isArray(result)) {
		for (const entry of result) {
			const id = extractInsertId(entry);
			if (id !== null && id !== undefined) {
				return id;
			}
		}
	}

	return null;
}

/**
 * @param {unknown} value
 */
function normalizeInsertId(value) {
	if (typeof value === 'bigint') {
		return Number(value);
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) && value > 0 ? value : null;
	}

	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
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
 * @param {{ incidentId: number; title: string; caseCode: string; description: string; tags: string[] }} input
 */
function scheduleAiGeneration({ incidentId, title, caseCode, description, tags }) {
	setTimeout(() => {
		generateAndStoreAiArtifacts({ incidentId, title, caseCode, description, tags }).catch(
			(error) => {
				console.error(`AI artifact generation failed for incident ${incidentId}:`, error);
			}
		);
	}, 0);
}

/**
 * @param {{ incidentId: number; title: string; caseCode: string; description: string; tags: string[] }} input
 */
async function generateAndStoreAiArtifacts({ incidentId, title, caseCode, description, tags }) {
	if (!db) return;
	try {
		const playbookContent = await generateAIPlaybook({ title, caseCode, description, tags });
		const escalationResult = await generateAIEscalation({ title, caseCode, description, tags });

		console.log('[Incidents][AI] Generated artifacts', {
			incidentId,
			playbookPreview: typeof playbookContent === 'string' ? playbookContent.slice(0, 200) : null,
			escalationPreview: escalationResult?.summary?.slice(0, 200) ?? null,
			escalationLikelihood: escalationResult?.likelihood ?? 'unknown'
		});

		await db
			.update(tables.incidents)
			.set({
				ai_playbook: playbookContent ?? '',
				ai_escalation: composeEscalationText(
					escalationResult?.summary,
					escalationResult?.reasoning
				),
				ai_escalation_likelihood: escalationResult?.likelihood ?? 'unknown',
				updatedAt: new Date()
			})
			.where(eq(tables.incidents.id, incidentId));

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
