-- Add AI-generated guidance fields to incidents
ALTER TABLE incidents
	ADD COLUMN ai_playbook TEXT NULL;

ALTER TABLE incidents
	ADD COLUMN ai_escalation TEXT NULL;
