import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as tables from '$lib/server/db/schema';
import { and, count, desc, like, or } from 'drizzle-orm';

/**
 * @typedef {Object} ArchiveRow
 * @property {number} id
 * @property {number | null} incidentId
 * @property {string | null} caseCode
 * @property {string} title
 * @property {string | null} description
 * @property {string} summary
 * @property {string | null} status
 * @property {string | null} ai_playbook
 * @property {string | null} ai_escalation
 * @property {string | null} tagsJson
 * @property {Date | string | null} archivedAt
 * @property {Date | string | null} incidentCreatedAt
 * @property {Date | string | null} incidentUpdatedAt
 */

const TAG_MATCH_TEMPLATE_PREFIX = '%"';
const TAG_MATCH_TEMPLATE_SUFFIX = '"%';

/** @param {import('@sveltejs/kit').RequestEvent} event */
export async function GET(event) {
	const url = new URL(event.request.url);
	const q = (url.searchParams.get('q') || '').trim();
	const requestedTags = (url.searchParams.get('tags') || '')
		.split(',')
		.map((x) => x.trim())
		.filter(Boolean);
	const page = Math.max(Number(url.searchParams.get('page') || '1'), 1);
	const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') || '10'), 1), 50);
	const offset = (page - 1) * pageSize;

	if (!db) {
		return json({ total: 0, results: [] });
	}

	const filters = [];

	if (q) {
		const likePattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
		filters.push(
			or(
				like(tables.archivedIssues.title, likePattern),
				like(tables.archivedIssues.summary, likePattern),
				like(tables.archivedIssues.description, likePattern)
			)
		);
	}

	for (const tag of requestedTags) {
		const pattern = `${TAG_MATCH_TEMPLATE_PREFIX}${tag.replace(/[%_]/g, '\\$&')}${TAG_MATCH_TEMPLATE_SUFFIX}`;
		filters.push(like(tables.archivedIssues.tagsJson, pattern));
	}

	const whereClause = filters.length === 0 ? undefined : and(...filters);

	let totalStatement = db.select({ value: count() }).from(tables.archivedIssues);
	if (whereClause) {
		totalStatement = totalStatement.where(whereClause);
	}

	const [{ value: totalRaw } = { value: 0n }] = await totalStatement;

	const total = Number(totalRaw ?? 0);

	if (total === 0) {
		return json({ total: 0, results: [] });
	}

	let rowsStatement = db
		.select({
			id: tables.archivedIssues.id,
			incidentId: tables.archivedIssues.incidentId,
			caseCode: tables.archivedIssues.caseCode,
			title: tables.archivedIssues.title,
			description: tables.archivedIssues.description,
			summary: tables.archivedIssues.summary,
			status: tables.archivedIssues.status,
			ai_playbook: tables.archivedIssues.ai_playbook,
			ai_escalation: tables.archivedIssues.ai_escalation,
			tagsJson: tables.archivedIssues.tagsJson,
			archivedAt: tables.archivedIssues.archivedAt,
			incidentCreatedAt: tables.archivedIssues.incidentCreatedAt,
			incidentUpdatedAt: tables.archivedIssues.incidentUpdatedAt
		})
		.from(tables.archivedIssues)
		.orderBy(desc(tables.archivedIssues.archivedAt))
		.limit(pageSize)
		.offset(offset);

	if (whereClause) {
		rowsStatement = rowsStatement.where(whereClause);
	}

	const rows = /** @type {ArchiveRow[]} */ (await rowsStatement);

	const results = rows.map((row) => {
		const archivedAtRaw = row.archivedAt;
		let archivedAt = null;
		if (archivedAtRaw instanceof Date) {
			archivedAt = archivedAtRaw;
		} else if (archivedAtRaw) {
			const candidate = new Date(archivedAtRaw);
			archivedAt = Number.isNaN(candidate.getTime()) ? null : candidate;
		}

		const createdAtRaw = row.incidentCreatedAt;
		let incidentCreatedAt = null;
		if (createdAtRaw instanceof Date) {
			incidentCreatedAt = createdAtRaw;
		} else if (createdAtRaw) {
			const candidate = new Date(createdAtRaw);
			incidentCreatedAt = Number.isNaN(candidate.getTime()) ? null : candidate;
		}
		const resolutionTime = formatResolutionTime(incidentCreatedAt, archivedAt);
		const tagsArray = parseTags(row.tagsJson);

		return {
			id: row.id,
			incident_id: row.incidentId,
			case_code: row.caseCode,
			title: row.title,
			description: row.description,
			summary: row.summary,
			archived_at: archivedAt?.toISOString() ?? null,
			status: row.status,
			ai_playbook: row.ai_playbook ?? null,
			ai_escalation: row.ai_escalation ?? null,
			tags: tagsArray.map((name, index) => ({ id: `${row.id}-${index}`, name })),
			resolution_time: resolutionTime
		};
	});

	return json({ total, results });
}

/**
 * @param {string | null} raw
 * @returns {string[]}
 */
function parseTags(raw) {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
	} catch (error) {
		console.warn('[Archive][parseTags] Failed to parse tags JSON:', error);
		return [];
	}
}

/**
 * @param {Date | null} created
 * @param {Date | null} archived
 */
function formatResolutionTime(created, archived) {
	if (!created || !archived) return null;
	const createdTime = created.getTime();
	const archivedTime = archived.getTime();
	if (!Number.isFinite(createdTime) || !Number.isFinite(archivedTime)) {
		return null;
	}

	const diffMinutes = Math.max(0, Math.round((archivedTime - createdTime) / 60000));
	if (diffMinutes === 0) return 'Under 1m';
	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;
	if (hours > 0 && minutes > 0) {
		return `${hours}h ${minutes}m`;
	}
	if (hours > 0) {
		return `${hours}h`;
	}
	return `${minutes}m`;
}
