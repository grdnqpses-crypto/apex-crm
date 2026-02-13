CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int,
	`name` varchar(256) NOT NULL,
	`type` enum('subject_line','content','send_time','sender_name') NOT NULL,
	`status` enum('draft','running','completed') NOT NULL DEFAULT 'draft',
	`variants` json DEFAULT ('[]'),
	`winnerVariant` varchar(8),
	`winnerMetric` enum('open_rate','click_rate','conversion') DEFAULT 'open_rate',
	`sampleSize` int DEFAULT 20,
	`results` json DEFAULT ('{}'),
	`startedAt` bigint,
	`completedAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`type` enum('note','email','call','meeting','task','deal_created','deal_stage_changed','deal_won','deal_lost','contact_created','lifecycle_changed') NOT NULL,
	`subject` varchar(512),
	`body` text,
	`metadata` json DEFAULT ('{}'),
	`createdAt` bigint NOT NULL,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`keyHash` varchar(128) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`permissions` json DEFAULT ('[]'),
	`lastUsedAt` bigint,
	`expiresAt` bigint,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`parentId` int,
	`name` varchar(256) NOT NULL,
	`domain` varchar(256),
	`industry` varchar(128),
	`size` varchar(64),
	`revenue` varchar(64),
	`phone` varchar(64),
	`address` text,
	`city` varchar(128),
	`state` varchar(128),
	`country` varchar(128),
	`website` varchar(512),
	`description` text,
	`tags` json DEFAULT ('[]'),
	`customFields` json DEFAULT ('{}'),
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128),
	`email` varchar(320),
	`phone` varchar(64),
	`title` varchar(256),
	`lifecycleStage` enum('subscriber','lead','mql','sql','opportunity','customer','evangelist') NOT NULL DEFAULT 'lead',
	`leadScore` int NOT NULL DEFAULT 0,
	`source` varchar(128),
	`tags` json DEFAULT ('[]'),
	`customFields` json DEFAULT ('{}'),
	`avatarUrl` varchar(512),
	`address` text,
	`city` varchar(128),
	`state` varchar(128),
	`country` varchar(128),
	`lastContactedAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pipelineId` int NOT NULL,
	`stageId` int NOT NULL,
	`contactId` int,
	`companyId` int,
	`name` varchar(256) NOT NULL,
	`dealValue` bigint DEFAULT 0,
	`currency` varchar(8) DEFAULT 'USD',
	`status` enum('open','won','lost') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`expectedCloseDate` bigint,
	`closedAt` bigint,
	`lostReason` text,
	`notes` text,
	`tags` json DEFAULT ('[]'),
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `domain_health` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`domain` varchar(256) NOT NULL,
	`spfStatus` enum('pass','fail','missing','unknown') NOT NULL DEFAULT 'unknown',
	`dkimStatus` enum('pass','fail','missing','unknown') NOT NULL DEFAULT 'unknown',
	`dmarcStatus` enum('pass','fail','missing','unknown') NOT NULL DEFAULT 'unknown',
	`reputationScore` int DEFAULT 50,
	`warmupPhase` int DEFAULT 0,
	`dailySendLimit` int DEFAULT 50,
	`lastCheckedAt` bigint,
	`notes` text,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `domain_health_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int,
	`name` varchar(256) NOT NULL,
	`subject` varchar(512),
	`fromName` varchar(256),
	`fromEmail` varchar(320),
	`htmlContent` text,
	`status` enum('draft','scheduled','sending','sent','paused','cancelled') NOT NULL DEFAULT 'draft',
	`segmentId` int,
	`scheduledAt` bigint,
	`sentAt` bigint,
	`totalRecipients` int DEFAULT 0,
	`delivered` int DEFAULT 0,
	`opened` int DEFAULT 0,
	`clicked` int DEFAULT 0,
	`bounced` int DEFAULT 0,
	`unsubscribed` int DEFAULT 0,
	`spamReports` int DEFAULT 0,
	`spamScore` int,
	`abTestId` int,
	`abVariant` varchar(8),
	`tags` json DEFAULT ('[]'),
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`subject` varchar(512) NOT NULL,
	`htmlContent` text NOT NULL,
	`jsonContent` json,
	`category` varchar(128),
	`thumbnail` varchar(512),
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pipelineId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`stageOrder` int NOT NULL,
	`probability` int NOT NULL DEFAULT 0,
	`color` varchar(32) DEFAULT '#6366f1',
	CONSTRAINT `pipeline_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `pipelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`filters` json DEFAULT ('[]'),
	`contactCount` int DEFAULT 0,
	`isDynamic` boolean NOT NULL DEFAULT true,
	`lastRefreshedAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assignedTo` int,
	`contactId` int,
	`dealId` int,
	`title` varchar(512) NOT NULL,
	`description` text,
	`dueDate` bigint,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('todo','in_progress','done','cancelled') NOT NULL DEFAULT 'todo',
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` int NOT NULL,
	`event` varchar(128) NOT NULL,
	`payload` json DEFAULT ('{}'),
	`responseStatus` int,
	`responseBody` text,
	`success` boolean NOT NULL DEFAULT false,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`events` json DEFAULT ('[]'),
	`secret` varchar(256),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` bigint,
	`failureCount` int DEFAULT 0,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`triggerConfig` json DEFAULT ('{}'),
	`steps` json DEFAULT ('[]'),
	`status` enum('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
	`enrolledCount` int DEFAULT 0,
	`completedCount` int DEFAULT 0,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
