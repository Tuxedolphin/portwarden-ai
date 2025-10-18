import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_DEPLOYMENT = 'gpt-5-mini';
const DEFAULT_ENDPOINT = 'https://psacodesprint2025.azure-api.net/gpt-5-mini/openai';
const DEFAULT_API_VERSION = '2025-01-01-preview';

const PROJECT_ROOT = process.cwd();
const SCHEMA_DOC_PATH = join(PROJECT_ROOT, 'provided/Database/SCHEMA_OVERVIEW.md');
const KNOWLEDGE_DOC_PATH = join(PROJECT_ROOT, 'provided/Knowledge Base.md');

const JSON_SYSTEM_TEXT = `You are Portwarden AI, a maritime duty officer co-pilot.
- Respond only with valid JSON that matches the specified schema.
- Do not include markdown, explanations, or backticks.
- Use concise language while preserving operational clarity and safety emphasis.`;

/** @type {{ schema: string; knowledge: string } | null} */
let cachedDocuments = null;

async function loadDocuments() {
	if (cachedDocuments) {
		return cachedDocuments;
	}

	const [schemaDoc, knowledgeDoc] = await Promise.all([
		readFile(SCHEMA_DOC_PATH, 'utf-8'),
		readFile(KNOWLEDGE_DOC_PATH, 'utf-8')
	]);

	cachedDocuments = {
		schema: schemaDoc,
		knowledge: knowledgeDoc
	};

	return cachedDocuments;
}

function generateThreadId() {
	return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {string} schemaDoc
 * @param {string} knowledgeDoc
 */
function buildInitializationPrompt(schemaDoc, knowledgeDoc) {
	return [
		'You are Portwarden AI, a maritime duty officer co-pilot. Someone is coming to you for help.',
		'Return the response strictly as JSON using this structure:',
		'{ "notes": [], "steps": [], "code_to_be_ran": [], "checklists": [] }',
		'Each field should follow these rules:',
		'- notes: array of important safety notes (strings).',
		'- steps: array of step objects describing action steps; note where each action is executed.',
		'- code_to_be_ran: array of objects with keys "language" and "actions" (what must be executed).',
		'- checklists: array of checklist strings to confirm remediation.',
		'Leverage the provided references when assembling guidance.',
		'--- SCHEMA_OVERVIEW.md ---',
		schemaDoc,
		'--- Knowledge Base.md ---',
		knowledgeDoc,
		'Ensure the JSON is syntactically valid and free of comments.'
	].join('\n\n');
}

/**
 * @param {string | null | undefined} text
 */
function extractJsonCandidate(text) {
	if (!text) return null;

	const trimmed = text.trim();
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		return trimmed;
	}

	const match = trimmed.match(/\{[\s\S]*\}/);
	return match ? match[0] : null;
}

/** @type {import('./$types').RequestHandler} */
export async function POST() {
	if (!env.AZURE_OPENAI_KEY) {
		return json({ error: 'AZURE_OPENAI_KEY is not configured.' }, { status: 500 });
	}

	const endpoint = env.AZURE_OPENAI_ENDPOINT ?? DEFAULT_ENDPOINT;
	const deployment = env.AZURE_OPENAI_DEPLOYMENT ?? DEFAULT_DEPLOYMENT;
	const apiVersion = env.AZURE_OPENAI_API_VERSION ?? DEFAULT_API_VERSION;
	const model = env.AZURE_OPENAI_MODEL ?? deployment;

	try {
		const documents = await loadDocuments();
		const prompt = buildInitializationPrompt(documents.schema, documents.knowledge);
		const threadId = generateThreadId();

		const normalizedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
		const requestUrl = `${normalizedEndpoint}/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

		const response = await fetch(requestUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': env.AZURE_OPENAI_KEY
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: JSON_SYSTEM_TEXT },
					{ role: 'user', content: prompt }
				]
			})
		});

		const data = await response.json().catch(() => null);

		if (!response.ok) {
			return json(
				{
					error: data?.error?.message ?? 'Azure OpenAI request failed.',
					threadId
				},
				{ status: response.status }
			);
		}

		const choice = data?.choices?.[0]?.message?.content;
		const candidate = extractJsonCandidate(
			Array.isArray(choice)
				? choice.map((part) => (typeof part === 'string' ? part : (part?.text ?? ''))).join('\n')
				: choice
		);

		if (!candidate) {
			return json(
				{
					error: 'Model response did not contain JSON output.',
					threadId,
					raw: choice ?? null
				},
				{ status: 502 }
			);
		}

		let parsed;
		try {
			parsed = JSON.parse(candidate);
		} catch (parseError) {
			console.error('Failed to parse model JSON response:', parseError);
			return json(
				{
					error: 'Failed to parse model JSON response.',
					threadId,
					raw: candidate
				},
				{ status: 502 }
			);
		}

		return json({
			threadId,
			result: parsed,
			metadata: {
				model,
				deployment
			}
		});
	} catch (error) {
		console.error('Thread initialization failed:', error);
		return json({ error: 'Unexpected server error.' }, { status: 500 });
	}
}
