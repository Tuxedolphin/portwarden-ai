ALTER TABLE `incidents`
	ADD COLUMN IF NOT EXISTS `ai_contact_category` VARCHAR(64) NULL AFTER `ai_escalation_likelihood`,
	ADD COLUMN IF NOT EXISTS `ai_contact_code` VARCHAR(32) NULL AFTER `ai_contact_category`,
	ADD COLUMN IF NOT EXISTS `ai_contact_name` VARCHAR(255) NULL AFTER `ai_contact_code`,
	ADD COLUMN IF NOT EXISTS `ai_contact_email` VARCHAR(255) NULL AFTER `ai_contact_name`,
	ADD COLUMN IF NOT EXISTS `ai_contact_role` VARCHAR(255) NULL AFTER `ai_contact_email`,
	ADD COLUMN IF NOT EXISTS `ai_escalation_subject` VARCHAR(255) NULL AFTER `ai_contact_role`,
	ADD COLUMN IF NOT EXISTS `ai_escalation_message` TEXT NULL AFTER `ai_escalation_subject`,
	ADD COLUMN IF NOT EXISTS `ai_escalation_reasoning` TEXT NULL AFTER `ai_escalation_message`,
	ADD COLUMN IF NOT EXISTS `ai_description` TEXT NULL AFTER `ai_escalation_reasoning`;
