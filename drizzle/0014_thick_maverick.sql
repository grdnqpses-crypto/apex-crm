CREATE TABLE `ai_credit_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`credits` int NOT NULL,
	`wholesalePrice` int NOT NULL,
	`retailPrice` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`stripePriceId` varchar(128),
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `ai_credit_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantCompanyId` int NOT NULL,
	`userId` int,
	`type` enum('purchase','usage','refund','adjustment','allocation','expiry') NOT NULL,
	`credits` int NOT NULL,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` varchar(512),
	`featureUsed` varchar(128),
	`packageId` int,
	`stripePaymentIntentId` varchar(128),
	`pricePaidCents` int,
	`performedBy` int,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `ai_credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_ai_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantCompanyId` int NOT NULL,
	`totalCredits` int NOT NULL DEFAULT 0,
	`usedCredits` int NOT NULL DEFAULT 0,
	`reservedCredits` int NOT NULL DEFAULT 0,
	`markupPercent` int NOT NULL DEFAULT 0,
	`monthlyUserLimit` int,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `tenant_ai_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_ai_credits_tenantCompanyId_unique` UNIQUE(`tenantCompanyId`)
);
--> statement-breakpoint
CREATE TABLE `user_ai_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantCompanyId` int NOT NULL,
	`userId` int NOT NULL,
	`monthlyLimit` int NOT NULL,
	`currentMonthUsed` int NOT NULL DEFAULT 0,
	`resetDate` bigint NOT NULL,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `user_ai_allocations_id` PRIMARY KEY(`id`)
);
