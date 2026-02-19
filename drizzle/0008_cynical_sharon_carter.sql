CREATE TABLE `email_mask_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`displayName` varchar(128) NOT NULL,
	`displayEmail` varchar(256) NOT NULL,
	`replyToName` varchar(128),
	`replyToEmail` varchar(256),
	`organizationName` varchar(256),
	`isActive` boolean DEFAULT true,
	`applyTo` varchar(32) DEFAULT 'all',
	`dmarcAlignment` varchar(16) DEFAULT 'relaxed',
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `email_mask_settings_id` PRIMARY KEY(`id`)
);
