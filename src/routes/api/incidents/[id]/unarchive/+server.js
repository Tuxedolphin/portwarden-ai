import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const VALID_STATUSES = new Set(['open', 'in-progress', 'resolved']);

/**
 * Restore an archived incident back to the active queue.
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function POST(event) {
	await requireUser(event);

	const rawId = event.params.id;
	const incidentId = Number(rawId);

	if (!Number.isFinite(incidentId) || incidentId <= 0) {
		return json({ error: 'Invalid incident ID' }, { status: 400 });
	}

	if (!db) {
		return json({ error: 'Database not configured' }, { status: 503 });
	}

	const [archived] = await db
		.select({
			archiveId: tables.archivedIssues.id,
			storedStatus: tables.archivedIssues.status,
			title: tables.archivedIssues.title,
			caseCode: tables.archivedIssues.caseCode,
			description: tables.archivedIssues.description,
			summary: tables.archivedIssues.summary,
			ai_playbook: tables.archivedIssues.ai_playbook,
			ai_escalation: tables.archivedIssues.ai_escalation,
			tagsJson: tables.archivedIssues.tagsJson,
			incidentCreatedAt: tables.archivedIssues.incidentCreatedAt,
			incidentUpdatedAt: tables.archivedIssues.incidentUpdatedAt,
		})
		.from(tables.archivedIssues)
		.where(eq(tables.archivedIssues.incidentId, incidentId))
		.limit(1);

	if (!archived) {
		return json({ error: 'Archived incident not found' }, { status: 404 });
	}

	const [existingIncident] = await db
		.select({ id: tables.incidents.id })
		.from(tables.incidents)
		.where(eq(tables.incidents.id, incidentId))
		.limit(1);

	const targetStatus = VALID_STATUSES.has(archived.storedStatus ?? '')
		? archived.storedStatus
		: 'open';

	const tags = parseTagsArray(archived.tagsJson);
	const caseCode = selectCaseCode(archived.caseCode, archived.archiveId);
	const description = selectDescription(archived.description, archived.summary, caseCode);
	const title = selectTitle(archived.title, caseCode);
	const createPayloadBody = {
		caseCode,
		description,
		title,
		tags,
		status: targetStatus,
		...(existingIncident ? { regenerateForId: existingIncident.id } : {})
	};

	const createResponse = await event.fetch('/api/incidents', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(createPayloadBody)
	});
	const createPayload = await createResponse.json().catch(() => ({}));
	if (!createResponse.ok) {
		const message = typeof createPayload?.error === 'string' ? createPayload.error : 'Failed to restore incident';
		return json({ error: message }, { status: createResponse.status || 500 });
	}

	let activeIncidentId = existingIncident ? existingIncident.id : normalizeIncidentId(createPayload?.id);

	if (!existingIncident && activeIncidentId !== null) {
		const originalCreatedAt = coerceDate(archived.incidentCreatedAt) ?? new Date();
		const originalUpdatedAt = coerceDate(archived.incidentUpdatedAt) ?? new Date();
		await db
			.update(tables.incidents)
			.set({
				status: targetStatus,
				archivedAt: null,
				updatedAt: originalUpdatedAt,
				createdAt: originalCreatedAt,
				ai_playbook: archived.ai_playbook ?? null,
				ai_escalation: archived.ai_escalation ?? null
			})
			.where(eq(tables.incidents.id, activeIncidentId));
	}

	if (activeIncidentId !== null) {
		incidentStatusStore.set(String(activeIncidentId), targetStatus ?? 'open');
	}

	await db.delete(tables.archivedIssues).where(eq(tables.archivedIssues.id, archived.archiveId));

	return json({
		success: true,
		status: targetStatus ?? 'open',
		incidentId: activeIncidentId,
		recreated: !existingIncident
	});
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function parseTagsArray(raw) {
	if (!raw || typeof raw !== 'string') return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((value) => typeof value === 'string' && value.trim().length > 0)
			: [];
	} catch (error) {
		console.warn('[Unarchive] Failed to parse tags JSON:', error);
		return [];
	}
}

/**
 * @param {string | null} rawCaseCode
 * @param {number} archiveId
 */
function selectCaseCode(rawCaseCode, archiveId) {
	const value = typeof rawCaseCode === 'string' ? rawCaseCode.trim() : '';
	return value || `ARCH-${archiveId}`;
}

/**
 * @param {string | null} rawDescription
 * @param {string | null} fallback
 * @param {string} caseCode
 */
function selectDescription(rawDescription, fallback, caseCode) {
	const base = typeof rawDescription === 'string' ? rawDescription.trim() : '';
	if (base) return base;
	const summary = typeof fallback === 'string' ? fallback.trim() : '';
	if (summary) return summary;
	return `Restored incident ${caseCode}`;
}

/**
 * @param {string | null} rawTitle
 * @param {string} caseCode
 */
function selectTitle(rawTitle, caseCode) {
	const value = typeof rawTitle === 'string' ? rawTitle.trim() : '';
	return value || `Incident ${caseCode}`;
}

/**
 * @param {unknown} value
 * @returns {Date | null}
 */
function coerceDate(value) {
	if (!value) return null;
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}
	if (typeof value === 'string' || typeof value === 'number') {
		const candidate = new Date(value);
		return Number.isNaN(candidate.getTime()) ? null : candidate;
	}
	return null;
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function normalizeIncidentId(value) {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}
