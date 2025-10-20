import { json, error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { incidents } from '$lib/data/incidents.js';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';

const VALID_STATUSES = new Set(['open', 'in-progress', 'resolved']);

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeStatus(value) {
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeTags(value) {
	if (value == null) return [];
	const raw = Array.isArray(value) ? value : String(value).split(',');
	return Array.from(new Set(raw.map((tag) => tag.trim()).filter(Boolean)));
}

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function PATCH(event) {
	await requireUser(event);

	const rawId = event.params.id;
	const incidentId = Number(rawId);
	if (!Number.isFinite(incidentId) || incidentId <= 0) {
		throw error(400, 'Invalid incident ID');
	}

	const body = await event.request.json().catch(() => ({}));
	const normalizedStatus = normalizeStatus(body.status);
	const tagPayloadProvided =
		Object.prototype.hasOwnProperty.call(body, 'tagNames') ||
		Object.prototype.hasOwnProperty.call(body, 'tags');
	const normalizedTags = tagPayloadProvided ? normalizeTags(body.tagNames ?? body.tags) : null;

	if (normalizedStatus && !VALID_STATUSES.has(normalizedStatus)) {
		throw error(400, 'Invalid status');
	}

	if (!db) {
		const incident = incidents.find((inc) => String(inc.id) === String(incidentId));
		if (!incident) {
			throw error(404, 'Incident not found');
		}

		const statusToUse = normalizedStatus || incidentStatusStore.get(String(incidentId)) || 'open';
		incidentStatusStore.set(String(incidentId), statusToUse);

		return json({
			id: incident.id,
			title: incident.title,
			description: incident.summary,
			status: statusToUse,
			created_at: incident.occurredAt,
			updated_at: new Date().toISOString(),
			tags: normalizedTags ?? []
		});
	}

	try {
		const [existing] = await db
			.select({
				id: tables.incidents.id,
				status: tables.incidents.status,
				title: tables.incidents.title,
				description: tables.incidents.description,
				caseCode: tables.incidents.caseCode,
				createdAt: tables.incidents.createdAt,
				updatedAt: tables.incidents.updatedAt,
				ai_playbook: tables.incidents.ai_playbook,
				ai_escalation: tables.incidents.ai_escalation
			})
			.from(tables.incidents)
			.where(eq(tables.incidents.id, incidentId))
			.limit(1);

		if (!existing) {
			throw error(404, 'Incident not found');
		}

		const updatePayload = /** @type {{ status?: string; updatedAt?: Date }} */ ({});
		if (normalizedStatus) {
			updatePayload.status = normalizedStatus;
		}
		if (Object.keys(updatePayload).length > 0) {
			updatePayload.updatedAt = new Date();
			await db
				.update(tables.incidents)
				.set(updatePayload)
				.where(eq(tables.incidents.id, incidentId));
		}

		if (normalizedTags && Array.isArray(normalizedTags)) {
			await syncIncidentTags(incidentId, normalizedTags);
		}

		const [fresh] = await db
			.select({
				id: tables.incidents.id,
				title: tables.incidents.title,
				description: tables.incidents.description,
				status: tables.incidents.status,
				caseCode: tables.incidents.caseCode,
				createdAt: tables.incidents.createdAt,
				updatedAt: tables.incidents.updatedAt,
				ai_playbook: tables.incidents.ai_playbook,
				ai_escalation: tables.incidents.ai_escalation
			})
			.from(tables.incidents)
			.where(eq(tables.incidents.id, incidentId))
			.limit(1);

		if (!fresh) {
			throw error(404, 'Incident not found');
		}

		const tagRows = await db
			.select({ name: tables.tags.name })
			.from(tables.incidentTags)
			.innerJoin(tables.tags, eq(tables.incidentTags.tagId, tables.tags.id))
			.where(eq(tables.incidentTags.incidentId, incidentId));

		const tags = /** @type {Array<{ name: string }>} */ (tagRows).map((row) => row.name);

		const createdAt = fresh.createdAt instanceof Date ? fresh.createdAt : new Date(fresh.createdAt);
		const updatedAt = fresh.updatedAt instanceof Date ? fresh.updatedAt : new Date(fresh.updatedAt);

		return json({
			id: fresh.id,
			title: fresh.title,
			description: fresh.description,
			caseCode: fresh.caseCode,
			status: fresh.status,
			created_at: createdAt.toISOString(),
			updated_at: updatedAt.toISOString(),
			tags,
			ai_playbook: fresh.ai_playbook ?? '',
			ai_escalation: fresh.ai_escalation ?? ''
		});
	} catch (err) {
		console.error('Error updating incident:', err);
		throw error(500, 'Failed to update incident');
	}
}

export async function DELETE(event) {
	await requireUser(event);

	const rawId = event.params.id;
	const incidentId = Number(rawId);
	if (!Number.isFinite(incidentId) || incidentId <= 0) {
		throw error(400, 'Invalid incident ID');
	}

	if (!db) {
		throw error(503, 'Database not configured');
	}

	const [existing] = await db
		.select({ id: tables.incidents.id })
		.from(tables.incidents)
		.where(eq(tables.incidents.id, incidentId))
		.limit(1);

	if (!existing) {
		throw error(404, 'Incident not found');
	}

	try {
		await db.delete(tables.incidentTags).where(eq(tables.incidentTags.incidentId, incidentId));

		await db.delete(tables.incidents).where(eq(tables.incidents.id, incidentId));
	} catch (err) {
		console.error('Error deleting incident:', err);
		throw error(500, 'Failed to delete incident');
	}

	incidentStatusStore.delete(String(incidentId));

	return json({ success: true });
}

/**
 * @param {number} incidentId
 * @param {string[]} tagNames
 */
async function syncIncidentTags(incidentId, tagNames) {
	if (!db) return;

	const existingTags = await db
		.select({ id: tables.tags.id, name: tables.tags.name })
		.from(tables.tags)
		.where(inArray(tables.tags.name, tagNames));

	const existingMap = new Map(
		/** @type {Array<{ id: number; name: string }>} */ (existingTags).map((tag) => [
			tag.name,
			tag.id
		])
	);
	const missing = tagNames.filter((name) => !existingMap.has(name));

	for (const name of missing) {
		try {
			const result = await db.insert(tables.tags).values({ name });
			if ('insertId' in result && result.insertId) {
				existingMap.set(name, Number(result.insertId));
			}
		} catch (err) {
			console.warn(`Failed to insert tag ${name}:`, err);
		}
	}

	const uniqueTagIds = Array.from(
		new Set(
			tagNames.map((name) => existingMap.get(name)).filter((value) => typeof value === 'number')
		)
	);

	await db.delete(tables.incidentTags).where(eq(tables.incidentTags.incidentId, incidentId));

	if (uniqueTagIds.length === 0) return;

	const values = uniqueTagIds.map((tagId) => ({ incidentId, tagId }));
	await db.insert(tables.incidentTags).values(values);
}
