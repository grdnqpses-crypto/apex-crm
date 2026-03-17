CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` bigint NOT NULL,
	`usedAt` bigint,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `systemRole` enum('developer','apex_owner','super_admin','company_admin','manager','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `activities` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `companies` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `contacts` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `deals` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `pipelines` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);