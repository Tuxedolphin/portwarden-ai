-- Extend archived issues to capture AI guidance and metadata
ALTER TABLE `incidents`
	MODIFY COLUMN `ai_playbook` TEXT NULL,
	MODIFY COLUMN `ai_escalation` TEXT NULL,
	ADD COLUMN `archived_at` DATETIME NULL AFTER `updated_at`;

ALTER TABLE `archived_issues`
	ADD COLUMN `case_code` VARCHAR(64) NULL AFTER `incident_id`,
	ADD COLUMN `description` TEXT NULL AFTER `title`,
	ADD COLUMN `archived_status` ENUM('open','in-progress','resolved') NOT NULL DEFAULT 'resolved' AFTER `summary`,
	ADD COLUMN `ai_playbook` TEXT NULL AFTER `archived_status`,
	ADD COLUMN `ai_escalation` TEXT NULL AFTER `ai_playbook`,
	ADD COLUMN `tags_json` TEXT NULL AFTER `ai_escalation`,
	ADD COLUMN `incident_created_at` DATETIME NULL AFTER `tags_json`,
	ADD COLUMN `incident_updated_at` DATETIME NULL AFTER `incident_created_at`,
	ADD COLUMN `archived_by` BIGINT UNSIGNED NULL AFTER `archived_at`,
	ADD CONSTRAINT `archived_issues_archived_by_users_fk`
		FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;
