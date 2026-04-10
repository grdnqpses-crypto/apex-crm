-- External Email Accounts Schema
-- Supports Gmail, Outlook, and generic IMAP connections
-- CRITICAL: All records include tenantCompanyId for strict isolation

CREATE TABLE IF NOT EXISTS `external_email_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenantCompanyId` bigint NOT NULL,
  `userId` bigint NOT NULL,
  `email` varchar(255) NOT NULL,
  `provider` enum('gmail', 'outlook', 'imap', 'mailcow') NOT NULL DEFAULT 'imap',
  `status` enum('active', 'inactive', 'error', 'pending_verification') NOT NULL DEFAULT 'pending_verification',
  
  -- OAuth Fields (for Gmail/Outlook)
  `oauth_access_token` longtext,
  `oauth_refresh_token` longtext,
  `oauth_token_expiry` datetime,
  `oauth_scope` text,
  
  -- IMAP Configuration (for generic IMAP)
  `imap_host` varchar(255),
  `imap_port` int DEFAULT 993,
  `imap_use_ssl` boolean DEFAULT true,
  `imap_username` varchar(255),
  `imap_password_encrypted` longtext,
  
  -- SMTP Configuration (for outbound)
  `smtp_host` varchar(255),
  `smtp_port` int DEFAULT 587,
  `smtp_use_tls` boolean DEFAULT true,
  `smtp_username` varchar(255),
  `smtp_password_encrypted` longtext,
  
  -- Sync Settings
  `last_sync_at` datetime,
  `next_sync_at` datetime,
  `sync_interval_minutes` int DEFAULT 5,
  `full_sync_enabled` boolean DEFAULT false,
  `last_full_sync_at` datetime,
  
  -- Encryption Keys
  `encryption_key_id` varchar(255),
  `is_encrypted` boolean DEFAULT true,
  
  -- Metadata
  `display_name` varchar(255),
  `signature` longtext,
  `auto_reply_enabled` boolean DEFAULT false,
  `auto_reply_message` longtext,
  
  -- Error Tracking
  `last_error` text,
  `error_count` int DEFAULT 0,
  `last_error_at` datetime,
  
  -- Audit
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` bigint,
  `updatedBy` bigint,
  
  UNIQUE KEY `unique_tenant_email` (`tenantCompanyId`, `email`),
  KEY `idx_tenant_company` (`tenantCompanyId`),
  KEY `idx_user_id` (`userId`),
  KEY `idx_provider` (`provider`),
  KEY `idx_status` (`status`),
  KEY `idx_next_sync` (`next_sync_at`),
  CONSTRAINT `fk_external_email_tenant` FOREIGN KEY (`tenantCompanyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_external_email_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OAuth Provider Credentials (encrypted storage)
CREATE TABLE IF NOT EXISTS `oauth_provider_credentials` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tenantCompanyId` bigint NOT NULL,
  `provider` enum('google', 'microsoft', 'zoho', 'keap') NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `client_secret_encrypted` longtext NOT NULL,
  `redirect_uri` varchar(255) NOT NULL,
  `scope` text NOT NULL,
  `is_active` boolean DEFAULT true,
  
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY `unique_tenant_provider` (`tenantCompanyId`, `provider`),
  KEY `idx_tenant_company` (`tenantCompanyId`),
  CONSTRAINT `fk_oauth_creds_tenant` FOREIGN KEY (`tenantCompanyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auto-Discover Configuration Cache
CREATE TABLE IF NOT EXISTS `email_autodiscover_cache` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `domain` varchar(255) NOT NULL UNIQUE,
  `provider` enum('gmail', 'outlook', 'custom', 'unknown') NOT NULL,
  `imap_host` varchar(255),
  `imap_port` int,
  `imap_use_ssl` boolean,
  `smtp_host` varchar(255),
  `smtp_port` int,
  `smtp_use_tls` boolean,
  `mx_records` json,
  `srv_records` json,
  `autodiscover_url` varchar(255),
  `last_verified_at` datetime,
  `verification_status` enum('verified', 'failed', 'pending') DEFAULT 'pending',
  
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY `idx_domain` (`domain`),
  KEY `idx_provider` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Sync History (for audit and debugging)
CREATE TABLE IF NOT EXISTS `external_email_sync_history` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `externalEmailAccountId` bigint NOT NULL,
  `sync_type` enum('incremental', 'full', 'manual', 'error_recovery') NOT NULL,
  `status` enum('started', 'completed', 'failed', 'partial') NOT NULL,
  `messages_synced` int DEFAULT 0,
  `messages_failed` int DEFAULT 0,
  `duration_seconds` int,
  `error_message` text,
  `sync_token` varchar(255),
  
  `startedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` datetime,
  
  KEY `idx_external_email_account` (`externalEmailAccountId`),
  KEY `idx_status` (`status`),
  KEY `idx_started_at` (`startedAt`),
  CONSTRAINT `fk_sync_history_account` FOREIGN KEY (`externalEmailAccountId`) REFERENCES `external_email_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Encryption Keys Management
CREATE TABLE IF NOT EXISTS `encryption_keys` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `key_material_encrypted` longtext NOT NULL,
  `algorithm` varchar(50) DEFAULT 'AES-256-GCM',
  `rotation_date` datetime,
  `is_active` boolean DEFAULT true,
  
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
