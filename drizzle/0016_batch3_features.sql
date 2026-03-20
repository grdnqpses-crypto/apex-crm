CREATE TABLE IF NOT EXISTS `web_forms` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenant_company_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `fields` json NOT NULL DEFAULT ('[]'),
  `settings` json NOT NULL DEFAULT ('{}'),
  `embed_code` text,
  `is_active` boolean NOT NULL DEFAULT true,
  `submission_count` int NOT NULL DEFAULT 0,
  `created_at` bigint NOT NULL,
  `updated_at` bigint NOT NULL,
  CONSTRAINT `web_forms_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `form_id` int NOT NULL,
  `tenant_company_id` int NOT NULL,
  `data` json NOT NULL DEFAULT ('{}'),
  `contact_id` int,
  `ip_address` varchar(45),
  `user_agent` text,
  `created_at` bigint NOT NULL,
  CONSTRAINT `form_submissions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `esignature_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenant_company_id` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `content` text NOT NULL,
  `status` enum('draft','sent','completed','voided','expired') NOT NULL DEFAULT 'draft',
  `deal_id` int,
  `contact_id` int,
  `created_by` int NOT NULL,
  `expires_at` bigint,
  `completed_at` bigint,
  `created_at` bigint NOT NULL,
  `updated_at` bigint NOT NULL,
  CONSTRAINT `esignature_documents_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `esignature_signers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `document_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(300) NOT NULL,
  `token` varchar(100) NOT NULL,
  `status` enum('pending','viewed','signed','declined') NOT NULL DEFAULT 'pending',
  `signed_at` bigint,
  `created_at` bigint NOT NULL,
  CONSTRAINT `esignature_signers_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `reputation_reviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenant_company_id` int NOT NULL,
  `platform` varchar(100) NOT NULL,
  `reviewer_name` varchar(200),
  `rating` tinyint,
  `review_text` text,
  `review_url` varchar(1024),
  `sentiment` enum('positive','neutral','negative') NOT NULL DEFAULT 'neutral',
  `responded` boolean NOT NULL DEFAULT false,
  `response_text` text,
  `review_date` bigint NOT NULL,
  `created_at` bigint NOT NULL,
  CONSTRAINT `reputation_reviews_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ooo_detections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tenant_company_id` int NOT NULL,
  `contact_id` int,
  `email` varchar(300) NOT NULL,
  `detected_at` bigint NOT NULL,
  `return_date` bigint,
  `ooo_message` text,
  `follow_up_scheduled` boolean NOT NULL DEFAULT false,
  `follow_up_date` bigint,
  `created_at` bigint NOT NULL,
  CONSTRAINT `ooo_detections_id` PRIMARY KEY(`id`)
);
