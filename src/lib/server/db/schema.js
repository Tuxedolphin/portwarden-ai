import { pgTable, serial, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define enums
export const statusEnum = pgEnum('status', ['open', 'in-progress', 'resolved']);

// Users
export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 255 }).notNull(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

// Lucia sessions
export const sessions = pgTable('session', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: serial('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
});

// Tags
export const tags = pgTable('tags', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 64 }).notNull().unique()
});

// Incidents
export const incidents = pgTable('incidents', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	caseCode: varchar('case_code', { length: 64 }).notNull(),
	description: text('description').notNull(),
	status: statusEnum('status').notNull().default('open'),
	createdBy: serial('created_by')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	ai_playbook: text('ai_playbook'),
	ai_escalation: text('ai_escalation'),
	ai_escalation_likelihood: varchar('ai_escalation_likelihood', { length: 32 }).default('unknown'),
	ai_contact_category: varchar('ai_contact_category', { length: 64 }),
	ai_contact_code: varchar('ai_contact_code', { length: 32 }),
	ai_contact_name: varchar('ai_contact_name', { length: 255 }),
	ai_contact_email: varchar('ai_contact_email', { length: 255 }),
	ai_contact_role: varchar('ai_contact_role', { length: 255 }),
	ai_escalation_subject: varchar('ai_escalation_subject', { length: 255 }),
	ai_escalation_message: text('ai_escalation_message'),
	ai_escalation_reasoning: text('ai_escalation_reasoning'),
	ai_description: text('ai_description')
});

// Incident tags (many-to-many)
export const incidentTags = pgTable('incident_tags', {
	incidentId: serial('incident_id')
		.notNull()
		.references(() => incidents.id),
	tagId: serial('tag_id')
		.notNull()
		.references(() => tags.id)
});

// Archived issues
export const archivedIssues = pgTable('archived_issues', {
	id: serial('id').primaryKey(),
	incidentId: serial('incident_id'),
	title: varchar('title', { length: 255 }).notNull(),
	summary: text('summary').notNull(),
	archivedAt: timestamp('archived_at', { mode: 'date' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});
