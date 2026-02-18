ALTER TABLE `users` MODIFY COLUMN `systemRole` enum('developer','super_admin','company_admin','manager','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `companies` ADD `annualFreightSpend` decimal(14,2);--> statement-breakpoint
ALTER TABLE `companies` ADD `commodity` varchar(256);--> statement-breakpoint
ALTER TABLE `contacts` ADD `freightDetails` varchar(128);--> statement-breakpoint
ALTER TABLE `contacts` ADD `shipmentLength` decimal(10,2);--> statement-breakpoint
ALTER TABLE `contacts` ADD `shipmentWidth` decimal(10,2);--> statement-breakpoint
ALTER TABLE `contacts` ADD `shipmentHeight` decimal(10,2);--> statement-breakpoint
ALTER TABLE `contacts` ADD `shipmentWeight` decimal(10,2);--> statement-breakpoint
ALTER TABLE `contacts` ADD `destinationZipCode` varchar(16);--> statement-breakpoint
ALTER TABLE `contacts` ADD `shippingOrigination` varchar(256);--> statement-breakpoint
ALTER TABLE `contacts` ADD `destination` varchar(256);--> statement-breakpoint
ALTER TABLE `contacts` ADD `additionalInformation` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `contactOwnerMeetingLink` varchar(512);--> statement-breakpoint
ALTER TABLE `contacts` ADD `personHasMoved` varchar(64);