import { json } from '@sveltejs/kit';
import { incidents as mockIncidents } from '$lib/data/incidents.js';
import { requireUser } from '$lib/server/auth';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function POST(event) {
	await requireUser(event);
	const rawId = event.params.id;
	const incidentId = Number(rawId);
	if (!Number.isFinite(incidentId) || incidentId <= 0) {
		return json({ error: 'Invalid incident ID' }, { status: 400 });
	}

	if (!db) {
		const fallback = mockIncidents.find((inc) => String(inc.id) === String(incidentId));
		if (!fallback) {
			return json({ error: 'Not found' }, { status: 404 });
		}
		return json({ ok: true });
	}

	try {
		const [existing] = await db
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
				archivedAt: tables.incidents.archivedAt
			})
			.from(tables.incidents)
			.where(eq(tables.incidents.id, incidentId))
			.limit(1);

		if (!existing) {
			return json({ error: 'Incident not found' }, { status: 404 });
		}

		const archivedAtValue =
			existing.archivedAt instanceof Date
				? existing.archivedAt
				: existing.archivedAt
					? new Date(existing.archivedAt)
					: null;

		if (archivedAtValue && !Number.isNaN(archivedAtValue.getTime())) {
			return json({ error: 'Incident already archived' }, { status: 409 });
		}

		const tagRows = /** @type {Array<{ tagName: string }>} */ (
			await db
				.select({ tagName: tables.tags.name })
				.from(tables.incidentTags)
				.innerJoin(tables.tags, eq(tables.tags.id, tables.incidentTags.tagId))
				.where(eq(tables.incidentTags.incidentId, incidentId))
		);

		const tags = tagRows.map((row) => row.tagName);
		const tagsJson = tags.length > 0 ? JSON.stringify(tags) : null;
		const now = new Date();
		const summary = (existing.ai_escalation ?? '').trim() || existing.description.slice(0, 280);

		await db.transaction(
			/** @param {import('drizzle-orm/mysql2').MySql2Transaction<any, any>} tx */
			async (tx) => {
				await tx.insert(tables.archivedIssues).values({
					incidentId: existing.id,
					caseCode: existing.caseCode,
					title: existing.title,
					description: existing.description,
					summary,
					status: existing.status,
					ai_playbook: existing.ai_playbook ?? null,
					ai_escalation: existing.ai_escalation ?? null,
					tagsJson,
					incidentCreatedAt: existing.createdAt,
					incidentUpdatedAt: existing.updatedAt,
					archivedAt: now,
					archivedBy: null
				});

				await tx
					.update(tables.incidents)
					.set({
						status: 'resolved',
						archivedAt: now,
						updatedAt: now
					})
					.where(eq(tables.incidents.id, incidentId));
			}
		);

		incidentStatusStore.delete(String(incidentId));

		return json({ success: true });
	} catch (error) {
		console.error(`[Archive] Failed to archive incident ${incidentId}:`, error);
		return json({ error: 'Failed to archive incident' }, { status: 500 });
	}
}
