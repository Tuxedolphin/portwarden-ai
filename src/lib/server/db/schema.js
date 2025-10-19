import { mysqlTable, bigint, varchar, text, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Users
export const users = mysqlTable('users', {
	id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 255 }).notNull(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	createdAt: datetime('created_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

// Lucia sessions
export const sessions = mysqlTable('session', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: bigint('user_id', { mode: 'number', unsigned: true })
		.notNull()
		.references(() => users.id),
	expiresAt: datetime('expires_at', { mode: 'date' }).notNull()
});

// Tags
export const tags = mysqlTable('tags', {
	id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
	name: varchar('name', { length: 64 }).notNull().unique()
});

// Incidents
export const incidents = mysqlTable('incidents', {
	id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
	title: varchar('title', { length: 255 }).notNull(),
	caseCode: varchar('case_code', { length: 64 }).notNull(),
	description: text('description').notNull(),
	status: mysqlEnum('status', ['open', 'in-progress', 'resolved']).notNull().default('open'),
	createdBy: bigint('created_by', { mode: 'number', unsigned: true })
		.notNull()
		.references(() => users.id),
	createdAt: datetime('created_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: datetime('updated_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	ai_playbook: text('ai_playbook').default(''),
	ai_escalation: text('ai_escalation').default('')
});

// Incident tags (many-to-many)
export const incidentTags = mysqlTable('incident_tags', {
	incidentId: bigint('incident_id', { mode: 'number', unsigned: true })
		.notNull()
		.references(() => incidents.id),
	tagId: bigint('tag_id', { mode: 'number', unsigned: true })
		.notNull()
		.references(() => tags.id)
});

// Archived issues
export const archivedIssues = mysqlTable('archived_issues', {
	id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
	incidentId: bigint('incident_id', { mode: 'number', unsigned: true }),
	title: varchar('title', { length: 255 }).notNull(),
	summary: text('summary').notNull(),
	archivedAt: datetime('archived_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});
