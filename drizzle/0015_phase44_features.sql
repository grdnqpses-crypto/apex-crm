CREATE TABLE `calendar_connections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `calConnProvider` enum('google','outlook') NOT NULL,
  `accessToken` text,
  `refreshToken` text,
  `tokenExpiresAt` bigint,
  `calendarId` varchar(512),
  `syncEnabled` boolean NOT NULL DEFAULT true,
  `lastSyncAt` bigint,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `calendar_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_connections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `emailConnProvider` enum('gmail','outlook') NOT NULL,
  `emailAddress` varchar(320) NOT NULL,
  `bccAddress` varchar(320),
  `accessToken` text,
  `refreshToken` text,
  `tokenExpiresAt` bigint,
  `syncEnabled` boolean NOT NULL DEFAULT true,
  `lastSyncAt` bigint,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `email_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_scheduler_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `slug` varchar(128) NOT NULL,
  `displayName` varchar(256) NOT NULL,
  `bio` text,
  `avatarUrl` varchar(512),
  `timezone` varchar(64) NOT NULL DEFAULT 'America/New_York',
  `availabilityJson` json,
  `bufferMinutes` int NOT NULL DEFAULT 15,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `meeting_scheduler_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_types` (
  `id` int AUTO_INCREMENT NOT NULL,
  `schedulerProfileId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `name` varchar(256) NOT NULL,
  `durationMinutes` int NOT NULL DEFAULT 30,
  `description` text,
  `location` varchar(512),
  `color` varchar(32) DEFAULT '#f97316',
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` bigint NOT NULL,
  CONSTRAINT `meeting_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_bookings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `meetingTypeId` int NOT NULL,
  `schedulerProfileId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `guestName` varchar(256) NOT NULL,
  `guestEmail` varchar(320) NOT NULL,
  `guestPhone` varchar(64),
  `guestNotes` text,
  `startTime` bigint NOT NULL,
  `endTime` bigint NOT NULL,
  `timezone` varchar(64) NOT NULL,
  `bookingStatus` enum('confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'confirmed',
  `contactId` int,
  `calendarEventId` varchar(512),
  `cancelToken` varchar(128),
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `meeting_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_object_types` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `name` varchar(128) NOT NULL,
  `pluralName` varchar(128) NOT NULL,
  `icon` varchar(64) DEFAULT 'box',
  `color` varchar(32) DEFAULT '#f97316',
  `slug` varchar(128) NOT NULL,
  `description` text,
  `showInNav` boolean NOT NULL DEFAULT true,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `custom_object_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `dealId` int,
  `contactId` int,
  `companyId` int,
  `createdByUserId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `proposalStatus` enum('draft','sent','viewed','signed','declined','expired') NOT NULL DEFAULT 'draft',
  `templateJson` json,
  `totalAmount` decimal(12,2),
  `currency` varchar(8) DEFAULT 'USD',
  `validUntil` bigint,
  `signatureToken` varchar(128),
  `signedAt` bigint,
  `signedByName` varchar(256),
  `signedByEmail` varchar(320),
  `signatureImageUrl` varchar(512),
  `viewedAt` bigint,
  `sentAt` bigint,
  `pdfUrl` varchar(512),
  `notes` text,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_definitions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `name` varchar(256) NOT NULL,
  `description` text,
  `workflowStatus` enum('draft','active','paused','archived') NOT NULL DEFAULT 'draft',
  `triggerType` varchar(64) NOT NULL,
  `triggerConfig` json,
  `nodesJson` json,
  `edgesJson` json,
  `runCount` int NOT NULL DEFAULT 0,
  `lastRunAt` bigint,
  `createdByUserId` int,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `workflow_definitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_runs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workflowId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `triggerRecordId` int,
  `triggerRecordType` varchar(64),
  `workflowRunStatus` enum('running','completed','failed','skipped') NOT NULL DEFAULT 'running',
  `stepsCompleted` int NOT NULL DEFAULT 0,
  `errorMessage` text,
  `startedAt` bigint NOT NULL,
  `completedAt` bigint,
  CONSTRAINT `workflow_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `createdByUserId` int NOT NULL,
  `name` varchar(256) NOT NULL,
  `description` text,
  `reportType` varchar(64) NOT NULL,
  `filtersJson` json,
  `columnsJson` json,
  `groupBy` varchar(64),
  `sortBy` varchar(64),
  `reportSortDir` enum('asc','desc') DEFAULT 'desc',
  `isShared` boolean NOT NULL DEFAULT false,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `saved_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_connectors` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `connectorKey` varchar(64) NOT NULL,
  `displayName` varchar(128) NOT NULL,
  `connectorStatus` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
  `webhookUrl` varchar(1024),
  `apiKey` text,
  `configJson` json,
  `lastTestedAt` bigint,
  `connectedAt` bigint,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `integration_connectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tenantCompanyId` int NOT NULL,
  `completedSteps` json NOT NULL DEFAULT ('[]'),
  `currentStep` varchar(64),
  `isCompleted` boolean NOT NULL DEFAULT false,
  `completedAt` bigint,
  `dismissedAt` bigint,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`)
);
