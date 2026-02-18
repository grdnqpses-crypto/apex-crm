CREATE TABLE `company_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantCompanyId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`inviteRole` enum('company_admin','manager','user') NOT NULL DEFAULT 'user',
	`managerId` int,
	`token` varchar(128) NOT NULL,
	`invitedBy` int NOT NULL,
	`inviteStatus` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`features` json,
	`expiresAt` bigint NOT NULL,
	`acceptedAt` bigint,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `company_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `feature_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`featureKey` varchar(128) NOT NULL,
	`grantedBy` int NOT NULL,
	`tenantCompanyId` int NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `feature_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`industry` varchar(256),
	`website` varchar(512),
	`logoUrl` varchar(512),
	`address` text,
	`phone` varchar(64),
	`contactEmail` varchar(320),
	`maxUsers` int DEFAULT 25,
	`subscriptionTier` enum('trial','starter','professional','enterprise') NOT NULL DEFAULT 'trial',
	`subscriptionStatus` enum('active','suspended','cancelled','expired') NOT NULL DEFAULT 'active',
	`trialEndsAt` bigint,
	`enabledFeatures` json,
	`settings` json,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `tenant_companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_companies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `systemRole` enum('developer','company_admin','manager','user') DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tenantCompanyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `managerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `invitedBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `lastActiveAt` bigint;