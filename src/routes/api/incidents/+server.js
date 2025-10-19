import { json } from '@sveltejs/kit';
import { incidents } from '$lib/data/incidents.js';
import { requireUser } from '$lib/server/auth';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const DEFAULT_STATUS = 'open';
const DEFAULT_DEPLOYMENT = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://psacodesprint2025.azure-api.net/gpt-5-mini/openai';
const DEFAULT_API_VERSION = '2025-01-01-preview';
const PLACEHOLDER_PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$placeholder$placeholderhash';

export async function GET(event) {
	const url = new URL(event.request.url);
	const page = Number(url.searchParams.get('page') || '1');
	const pageSize = Number(url.searchParams.get('pageSize') || '10');
	const offset = (page - 1) * pageSize;

	// Use mock data instead of database
	const total = incidents.length;
	const results = incidents.slice(offset, offset + pageSize).map((incident, index) => {
		// Check if we have a stored status, otherwise use default variety
		let status = incidentStatusStore.get(incident.id);
		if (!status) {
			// Add some variety to status based on incident index for demo purposes
			if (index % 3 === 1) status = 'in-progress';
			else if (index % 3 === 2) status = 'resolved';
			else status = 'open';
		}

		return {
			id: incident.id,
			title: incident.title,
			description: incident.summary, // Use summary as description
			status: status,
			created_at: incident.occurredAt,
			tags: [] // Mock empty tags for now
		};
	});

	return json({ total, results });
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
			ai_escalation: ''
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

		incidentStatusStore.set(String(incidentId), DEFAULT_STATUS);

		const responseIncident = {
			id: incidentId,
			title,
			caseCode,
			description,
			status: DEFAULT_STATUS,
			created_at: now.toISOString(),
			updated_at: now.toISOString(),
			tags
		};

		scheduleAiGeneration({
			incidentId,
			title,
			caseCode,
			description,
			tags
		});

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
	for (const tagId of uniqueTagIds) {
		await db.insert(tables.incidentTags).values({ incidentId, tagId });
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
		if (response) {
			return response;
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
		const [playbookContent, escalationContent] = await Promise.all([
			generateAIPlaybook({ title, caseCode, description, tags }),
			generateAIEscalation({ title, caseCode, description, tags })
		]);

		await db
			.update(tables.incidents)
			.set({
				ai_playbook: playbookContent ?? '',
				ai_escalation: escalationContent ?? '',
				updatedAt: new Date()
			})
			.where(eq(tables.incidents.id, incidentId));
	} catch (error) {
		console.error(`Failed to store AI artifacts for incident ${incidentId}:`, error);
	}
}

/**
 * @param {{ title: string; caseCode?: string; description: string; tags: string[] }} incident
 */
async function generateAIPlaybook(incident) {
	const prompt = buildPlaybookPrompt(incident);
	const playbookResponse = await callChatCompletion(
		[
			{ role: 'system', content: 'You are Portwarden AI, a maritime duty officer co-pilot.' },
			{ role: 'user', content: prompt }
		],
		{
			type: 'json_schema',
			json_schema: {
				name: 'playbook_schema',
				schema: {
					type: 'object',
					required: ['importantSafetyNotes', 'actionSteps', 'languageCommands', 'checklists'],
					properties: {
						importantSafetyNotes: { type: 'array', items: { type: 'string' }, minItems: 1 },
						actionSteps: {
							type: 'array',
							items: {
								type: 'object',
								required: ['stepTitle', 'executionContext', 'procedure'],
								properties: {
									stepTitle: { type: 'string' },
									executionContext: { type: 'string' },
									procedure: { type: 'array', items: { type: 'string' }, minItems: 1 }
								}
							}
						},
						languageCommands: {
							type: 'array',
							items: {
								type: 'object',
								required: ['language', 'command'],
								properties: {
									language: { type: 'string' },
									command: { type: 'string' }
								}
							}
						},
						checklists: {
							type: 'array',
							items: {
								type: 'object',
								required: ['title', 'items'],
								properties: {
									title: { type: 'string' },
									items: { type: 'array', items: { type: 'string' }, minItems: 1 }
								}
							}
						}
					}
				}
			}
		}
	);

	if (playbookResponse) {
		return playbookResponse;
	}

	return `AI Playbook for: ${incident.description}`;
}

/**
 * @param {{ title: string; caseCode?: string; description: string; tags: string[] }} incident
 */
async function generateAIEscalation(incident) {
	const prompt = buildEscalationPrompt(incident);
	const escalationResponse = await callChatCompletion([
		{ role: 'system', content: 'You are Portwarden AI, a maritime duty officer co-pilot.' },
		{ role: 'user', content: prompt }
	]);

	if (escalationResponse) {
		return escalationResponse;
	}

	return `AI Escalation for: ${incident.description}`;
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

Respond in JSON that matches the provided schema (importantSafetyNotes, actionSteps, languageCommands, checklists).
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
	return `Write an escalation summary (<180 words, single paragraph, no bullets) for the following maritime incident.

Title: ${incident.title}

${codeLine}

Description:
${incident.description}

${tagsLine}`;
}

/**
 * @param {Array<{ role: 'system' | 'user' | 'assistant'; content: string }>} messages
 * @param {Record<string, any>} [responseFormat]
 */
async function callChatCompletion(messages, responseFormat) {
	if (!env.AZURE_OPENAI_KEY) {
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
	return data.choices?.[0]?.message?.content ?? null;
}
