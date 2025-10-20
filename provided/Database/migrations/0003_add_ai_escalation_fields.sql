ALTER TABLE `incidents`
	ADD COLUMN IF NOT EXISTS `ai_playbook` TEXT NULL AFTER `updated_at`;

ALTER TABLE `incidents`
	ADD COLUMN IF NOT EXISTS `ai_escalation` TEXT NULL AFTER `ai_playbook`;

ALTER TABLE `incidents`
	ADD COLUMN IF NOT EXISTS `ai_escalation_likelihood` VARCHAR(32) NOT NULL DEFAULT 'unknown' AFTER `ai_escalation`;
