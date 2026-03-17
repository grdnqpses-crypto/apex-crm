CREATE TABLE `bible_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`sectionId` varchar(64) NOT NULL,
	`featureId` varchar(64),
	`permission` enum('view','collaborate') NOT NULL DEFAULT 'view',
	`tenantCompanyId` int NOT NULL,
	`revokedAt` bigint,
	`revokedByUserId` int,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `bible_shares_id` PRIMARY KEY(`id`)
);
