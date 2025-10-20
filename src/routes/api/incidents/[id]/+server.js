import { json, error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { incidents } from '$lib/data/incidents.js';
import { incidentStatusStore } from '$lib/server/incidentStore.js';
import { supabase } from '$lib/server/db';

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

	if (!supabase) {
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
			tags: normalizedTags ?? [],
			ai_playbook: '',
			ai_escalation: '',
			ai_escalation_likelihood: 'unknown'
		});
	}

	try {
		const {
			data: existing,
			error: existingError,
			status: existingStatus
		} = await supabase
			.from('incidents')
			.select(
				'id, status, title, description, case_code, created_at, updated_at, ai_playbook, ai_escalation, ai_escalation_likelihood'
			)
			.eq('id', incidentId)
			.maybeSingle();

		if (existingError && existingStatus !== 406) {
			throw existingError;
		}

		if (!existing) {
			throw error(404, 'Incident not found');
		}

		const updatePayload = /** @type {{ status?: string; updated_at?: string }} */ ({});
		if (normalizedStatus) {
			updatePayload.status = normalizedStatus;
		}
		if (Object.keys(updatePayload).length > 0) {
			updatePayload.updated_at = new Date().toISOString();
			const { error: updateError } = await supabase
				.from('incidents')
				.update(updatePayload)
				.eq('id', incidentId);

			if (updateError) {
				throw updateError;
			}
		}

		if (normalizedTags && Array.isArray(normalizedTags)) {
			await syncIncidentTags(supabase, incidentId, normalizedTags);
		}

		const {
			data: fresh,
			error: freshError,
			status: freshStatus
		} = await supabase
			.from('incidents')
			.select(
				'id, title, description, status, case_code, created_at, updated_at, ai_playbook, ai_escalation, ai_escalation_likelihood'
			)
			.eq('id', incidentId)
			.maybeSingle();

		if (freshError && freshStatus !== 406) {
			throw freshError;
		}

		if (!fresh) {
			throw error(404, 'Incident not found');
		}

		const { data: tagRows, error: tagError } = await supabase
			.from('incident_tags')
			.select('tags ( name )')
			.eq('incident_id', incidentId);

		if (tagError) {
			throw tagError;
		}

		const tags = (tagRows ?? [])
			.map(
				/** @type {(row: Record<string, any>) => string | null} */ (row) => {
					if (row && typeof row === 'object' && 'tags' in row) {
						const tag = row.tags;
						if (tag && typeof tag === 'object' && 'name' in tag) {
							return String(tag.name);
						}
					}
					return null;
				}
			)
			.filter(
				/** @type {(value: string | null) => value is string} */ (value) =>
					typeof value === 'string'
			);

		const createdAt = fresh.created_at ? new Date(fresh.created_at) : new Date();
		const updatedAt = fresh.updated_at ? new Date(fresh.updated_at) : createdAt;

		return json({
			id: fresh.id,
			title: fresh.title,
			description: fresh.description,
			caseCode: fresh.case_code,
			status: fresh.status,
			created_at: createdAt.toISOString(),
			updated_at: updatedAt.toISOString(),
			tags,
			ai_playbook: fresh.ai_playbook ?? '',
			ai_escalation: fresh.ai_escalation ?? '',
			ai_escalation_likelihood: fresh.ai_escalation_likelihood ?? 'unknown'
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

	if (!supabase) {
		throw error(503, 'Database not configured');
	}

	const {
		data: existing,
		error: existingError,
		status: existingStatus
	} = await supabase.from('incidents').select('id').eq('id', incidentId).maybeSingle();

	if (existingError && existingStatus !== 406) {
		throw existingError;
	}

	if (!existing) {
		throw error(404, 'Incident not found');
	}

	try {
		const { error: deleteTagsError } = await supabase
			.from('incident_tags')
			.delete()
			.eq('incident_id', incidentId);
		if (deleteTagsError) {
			throw deleteTagsError;
		}

		const { error: deleteIncidentError } = await supabase
			.from('incidents')
			.delete()
			.eq('id', incidentId);
		if (deleteIncidentError) {
			throw deleteIncidentError;
		}
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
/**
 * @param {any} client
 * @param {number} incidentId
 * @param {string[]} tagNames
 */
async function syncIncidentTags(client, incidentId, tagNames) {
	if (!client) return;

	const normalizedNames = Array.from(
		new Set(
			tagNames
				.map((name) => (typeof name === 'string' ? name.trim() : ''))
				.filter((name) => name.length > 0)
		)
	);

	if (normalizedNames.length === 0) {
		await client.from('incident_tags').delete().eq('incident_id', incidentId);
		return;
	}

	const upsertPayload = normalizedNames.map((name) => ({ name }));
	const { error: upsertError } = await client
		.from('tags')
		.upsert(upsertPayload, { onConflict: 'name' });

	if (upsertError && !isDuplicateKeyError(upsertError)) {
		throw upsertError;
	}

	const { data: tagRecords, error: selectError } = await client
		.from('tags')
		.select('id, name')
		.in('name', normalizedNames);

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

	const values = uniqueTagIds.map((tagId) => ({ incident_id: incidentId, tag_id: tagId }));
	const { error: insertError } = await client.from('incident_tags').insert(values);
	if (insertError) {
		throw insertError;
	}
}

/**
 * @param {unknown} errorValue
 */
function isDuplicateKeyError(errorValue) {
	return Boolean(
		errorValue &&
			typeof errorValue === 'object' &&
			'code' in errorValue &&
			errorValue.code === '23505'
	);
}
