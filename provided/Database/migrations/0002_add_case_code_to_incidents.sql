ALTER TABLE `incidents`
	ADD COLUMN `case_code` varchar(64) NOT NULL AFTER `title`;
