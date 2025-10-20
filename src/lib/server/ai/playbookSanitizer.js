import {
	PRODUCT_ESCALATION_CONTACTS,
	ESCALATION_CONTACT_CATEGORIES
} from '$lib/data/escalationContacts.js';

const CONTACT_LOOKUP_BY_CATEGORY = new Map(
	PRODUCT_ESCALATION_CONTACTS.map((entry) => [entry.category.toLowerCase(), entry])
);
const CONTACT_LOOKUP_BY_CODE = new Map(
	PRODUCT_ESCALATION_CONTACTS.map((entry) => [entry.code.toLowerCase(), entry])
);
const CONTACT_LOOKUP_BY_EMAIL = new Map(
	PRODUCT_ESCALATION_CONTACTS.map((entry) => [entry.primaryContact.email.toLowerCase(), entry])
);

/**
 * @param {string} raw
 */
export function stripJsonFences(raw) {
	return raw
		.trim()
		.replace(/^```json\s*/i, '')
		.replace(/```$/i, '')
		.trim();
}

/**
 * @param {string} raw
 * @returns {{ ok: true; value: import('$lib/types/playbook').PlaybookPayload } | { ok: false; error: string }}
 */
export function parsePlaybookJson(raw) {
	const cleaned = stripJsonFences(raw);
	let data;
	try {
		data = JSON.parse(cleaned);
	} catch (error) {
		console.warn('Failed to parse playbook payload JSON:', error);
		return { ok: false, error: 'INVALID_JSON' };
	}

	return sanitizePlaybookObject(data);
}

/**
 * @param {unknown} value
 * @returns {{ ok: true; value: import('$lib/types/playbook').PlaybookPayload } | { ok: false; error: string }}
 */
export function sanitizePlaybookObject(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return { ok: false, error: 'INVALID_STRUCTURE' };
	}

	const data = /** @type {Record<string, unknown>} */ (value);

	const importantSafetyNotes = sanitizeStringArray(data.importantSafetyNotes);
	const actionSteps = sanitizeActionSteps(data.actionSteps);
	const verificationSteps = sanitizeStringArray(data.verificationSteps);
	const checklists = sanitizeChecklists(data.checklists);
	const escalationPlan = sanitizeEscalationPlan(data.escalationPlan);
	const aiDescription = normalizeNarrative(data.aiDescription ?? data.summarySynopsis ?? '');

	if (
		!importantSafetyNotes.length ||
		!actionSteps.length ||
		!verificationSteps.length ||
		!checklists.length ||
		!escalationPlan ||
		!aiDescription
	) {
		return { ok: false, error: 'MISSING_FIELDS' };
	}

	return {
		ok: true,
		value: {
			importantSafetyNotes,
			actionSteps,
			verificationSteps,
			checklists,
			escalationPlan,
			aiDescription
		}
	};
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function sanitizeStringArray(value) {
	if (!Array.isArray(value)) return [];
	return value.map((item) => normalizeNarrative(item)).filter((item) => item.length > 0);
}

/**
 * @param {unknown} value
 * @returns {Array<{ stepTitle: string; executionContext: string; procedure: string[]; checklistItems?: string[] }>}
 */
export function sanitizeActionSteps(value) {
	if (!Array.isArray(value)) return [];
	const steps = [];
	for (const entry of value) {
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
		const stepTitle = normalizeHeading(/** @type {any} */ (entry).stepTitle);
		const executionContext = normalizeNarrative(/** @type {any} */ (entry).executionContext);
		const procedure = coerceStringList(/** @type {any} */ (entry).procedure);
		const checklistItems = coerceStringList(/** @type {any} */ (entry).checklistItems);

		if (!stepTitle || !executionContext || !procedure.length) continue;

		const sanitized =
			/** @type {{ stepTitle: string; executionContext: string; procedure: string[]; checklistItems?: string[] }} */ ({
				stepTitle,
				executionContext,
				procedure
			});
		if (checklistItems.length > 0) {
			sanitized.checklistItems = checklistItems;
		}

		steps.push(sanitized);
	}
	return steps;
}

/**
 * @param {unknown} value
 * @returns {Array<{ title: string; items: string[]; relatedStep?: string }>}
 */
export function sanitizeChecklists(value) {
	if (!Array.isArray(value)) return [];
	const lists = [];
	for (const entry of value) {
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
		const title = normalizeHeading(/** @type {any} */ (entry).title);
		const items = coerceStringList(/** @type {any} */ (entry).items);
		if (!title || !items.length) continue;
		const sanitized = /** @type {{ title: string; items: string[]; relatedStep?: string }} */ ({
			title,
			items
		});
		const relatedStep = normalizeHeading(/** @type {any} */ (entry).relatedStep);
		if (relatedStep) {
			sanitized.relatedStep = relatedStep;
		}
		lists.push(sanitized);
	}
	return lists;
}

/**
 * @param {unknown} value
 * @returns {import('$lib/types/playbook').EscalationPlan | null}
 */
export function sanitizeEscalationPlan(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	const data = /** @type {Record<string, unknown>} */ (value);
	const rawCategory = normalizeHeading(data.category ?? data.categoryName);
	const rawCode = normalizeHeading(data.categoryCode ?? data.code);
	const likelihoodRaw = data.escalationLikelihood ?? data.likelihood;
	const summary = normalizeNarrative(data.summary ?? '');
	const reasoning = normalizeNarrative(data.reasoning ?? data.likelihoodReasoning ?? '');
	const subject = normalizeSubject(
		data.recommendedSubject ?? data.subject ?? data.emailSubject ?? ''
	);
	const message = normalizeEscalationMessage(
		data.recommendedMessage ?? data.message ?? data.emailBody ?? data.body ?? ''
	);
	const primaryContact = sanitizeEscalationContact(data.primaryContact);
	const alternateContacts = Array.isArray(data.alternateContacts)
		? /** @type {import('$lib/types/playbook').EscalationContact[]} */ (
				data.alternateContacts
					.map((entry) => sanitizeEscalationContact(entry))
					.filter((contact) => contact !== null)
			)
		: [];

	const rosterEntry = resolveContactRosterEntry({
		category: rawCategory,
		code: rawCode,
		email: primaryContact?.email ?? ''
	});

	const likelihood = normalizeLikelihood(likelihoodRaw);
	const finalLikelihood = likelihood === 'invalid' ? 'uncertain' : likelihood;

	const effectiveCategory = rosterEntry?.category ?? rawCategory;
	const effectiveCode = rosterEntry?.code ?? rawCode;
	const effectiveContact = rosterEntry?.primaryContact ?? primaryContact;

	if (!effectiveCategory || !effectiveCode || !effectiveContact?.email) {
		return null;
	}

	const finalSummary = summary || normalizeNarrative(message) || reasoning;
	if (!finalSummary) {
		return null;
	}

	const finalSubject = subject || `Escalation - ${effectiveCategory}`;
	const finalMessage = message || buildFallbackMessage(finalSummary, reasoning);

	return {
		category: effectiveCategory,
		categoryCode: effectiveCode,
		likelihood: finalLikelihood,
		summary: finalSummary,
		reasoning,
		recommendedSubject: finalSubject,
		recommendedMessage: finalMessage,
		primaryContact: {
			name: effectiveContact.name || rosterEntry?.primaryContact.name || '',
			email: effectiveContact.email,
			role: effectiveContact.role || rosterEntry?.primaryContact.role || ''
		},
		...(alternateContacts.length ? { alternateContacts } : {})
	};
}

/**
 * @param {unknown} value
 * @returns {import('$lib/types/playbook').EscalationContact | null}
 */
export function sanitizeEscalationContact(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}
	const record = /** @type {Record<string, unknown>} */ (value);
	const email = normalizeEmail(record.email ?? record.address ?? '');
	if (!email) {
		return null;
	}
	return {
		name: normalizeHeading(record.name ?? record.fullName ?? '') || '',
		email,
		role: normalizeHeading(record.role ?? record.title ?? '') || ''
	};
}

/**
 * @param {{ category: string; code: string; email: string }} query
 */
function resolveContactRosterEntry({ category, code, email }) {
	const emailKey = normalizeEmail(email);
	if (emailKey && CONTACT_LOOKUP_BY_EMAIL.has(emailKey)) {
		return CONTACT_LOOKUP_BY_EMAIL.get(emailKey) ?? null;
	}
	if (code) {
		const match = CONTACT_LOOKUP_BY_CODE.get(code.toLowerCase());
		if (match) return match;
	}
	if (category) {
		const match = CONTACT_LOOKUP_BY_CATEGORY.get(category.toLowerCase());
		if (match) return match;
	}
	return null;
}

/**
 * @param {unknown} value
 */
export function normalizeEmail(value) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * @param {unknown} value
 */
export function normalizeSubject(value) {
	if (typeof value !== 'string') return '';
	const subject = normalizeHeading(value);
	return subject.length > 180 ? subject.slice(0, 177) + '…' : subject;
}

/**
 * @param {unknown} value
 */
export function normalizeEscalationMessage(value) {
	if (typeof value !== 'string') return '';
	return value
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.reduce((acc, line) => {
			if (!line) {
				const prev = acc[acc.length - 1];
				if (prev !== '') acc.push('');
				return acc;
			}
			acc.push(line);
			return acc;
		}, /** @type {string[]} */ ([]))
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * @param {string} summary
 * @param {string} reasoning
 */
function buildFallbackMessage(summary, reasoning) {
	const parts = [summary];
	if (reasoning) {
		parts.push(`Reasoning: ${reasoning}`);
	}
	return parts.join('\n\n');
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function coerceStringList(value) {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeNarrative(item)).filter((item) => item.length > 0);
	}
	if (typeof value === 'string') {
		return value
			.split(/\n+/)
			.map((item) => normalizeNarrative(item))
			.filter((item) => item.length > 0);
	}
	return [];
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeNarrative(value) {
	if (typeof value !== 'string') return '';
	return value
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
		.filter((line) => line.length > 0)
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeHeading(value) {
	if (typeof value !== 'string') return '';
	return value
		.replace(/\r\n?/g, ' ')
		.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * @param {unknown} value
 * @returns {'likely' | 'unlikely' | 'uncertain' | 'invalid'}
 */
export function normalizeLikelihood(value) {
	if (typeof value !== 'string') return 'invalid';
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
	return 'uncertain';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeEscalationText(value) {
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

export const ESCALATION_CATEGORY_HINT = `Choose category from: ${ESCALATION_CONTACT_CATEGORIES.join(', ')}`;
