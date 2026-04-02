/**
 * Migration Engine Events Integration
 * Hooks into the existing migration engine to emit real-time events
 */

import {
  emitAuthenticationStart,
  emitAuthenticationSuccess,
  emitDataPreparationStart,
  emitContactsDetected,
  emitCompaniesDetected,
  emitDealsDetected,
  emitCustomFieldsAnalysis,
  emitFieldMappingStart,
  emitFieldMappingProgress,
  emitFieldMappingComplete,
  emitDataImportStart,
  emitDataImportProgress,
  emitDataImportComplete,
  emitDNSConfigurationStart,
  emitDNSProviderDetected,
  emitDNSRecordCreated,
  emitDNSPropagationCheck,
  emitVerificationStart,
  emitVerificationComplete,
  emitError,
} from './migration-events';

/**
 * Wrapper functions for migration engine to emit events
 * These are called from the existing migration engine during various stages
 */

export const migrationEngineEvents = {
  // Authentication phase
  onAuthStart: (migrationId: string, platform: string) => {
    emitAuthenticationStart(migrationId, platform);
  },

  onAuthSuccess: (migrationId: string, platform: string, duration: number) => {
    emitAuthenticationSuccess(migrationId, platform, duration);
  },

  onAuthError: (migrationId: string, error: string) => {
    emitError(migrationId, 'Authentication', error);
  },

  // Data preparation phase
  onDataPrepStart: (migrationId: string) => {
    emitDataPreparationStart(migrationId);
  },

  onContactsDetected: (migrationId: string, count: number, duration: number) => {
    emitContactsDetected(migrationId, count, duration);
  },

  onCompaniesDetected: (migrationId: string, count: number, duration: number) => {
    emitCompaniesDetected(migrationId, count, duration);
  },

  onDealsDetected: (migrationId: string, count: number, duration: number) => {
    emitDealsDetected(migrationId, count, duration);
  },

  onCustomFieldsAnalyzed: (
    migrationId: string,
    contactFields: number,
    companyFields: number,
    dealFields: number,
    duration: number
  ) => {
    emitCustomFieldsAnalysis(migrationId, contactFields, companyFields, dealFields, duration);
  },

  onFieldMappingStart: (migrationId: string) => {
    emitFieldMappingStart(migrationId);
  },

  onFieldMappingProgress: (migrationId: string, mapped: number, total: number) => {
    emitFieldMappingProgress(migrationId, mapped, total);
  },

  onFieldMappingComplete: (migrationId: string, mapped: number, total: number, needsReview: number, duration: number) => {
    emitFieldMappingComplete(migrationId, mapped, total, needsReview, duration);
  },

  // Data import phase
  onDataImportStart: (migrationId: string, totalRecords: number) => {
    emitDataImportStart(migrationId, totalRecords);
  },

  onDataImportProgress: (migrationId: string, imported: number, total: number) => {
    emitDataImportProgress(migrationId, imported, total);
  },

  onDataImportComplete: (migrationId: string, imported: number, failed: number, duration: number) => {
    emitDataImportComplete(migrationId, imported, failed, duration);
  },

  onDataImportError: (migrationId: string, error: string, details?: string) => {
    emitError(migrationId, 'Data Import', error, details);
  },

  // DNS configuration phase
  onDNSConfigStart: (migrationId: string, domain: string) => {
    emitDNSConfigurationStart(migrationId, domain);
  },

  onDNSProviderDetected: (migrationId: string, provider: string, duration: number) => {
    emitDNSProviderDetected(migrationId, provider, duration);
  },

  onDNSRecordCreated: (migrationId: string, recordType: string, value: string, duration: number) => {
    emitDNSRecordCreated(migrationId, recordType, value, duration);
  },

  onDNSPropagationCheck: (
    migrationId: string,
    resolver: string,
    records: { spf: boolean; dkim: boolean; dmarc: boolean }
  ) => {
    emitDNSPropagationCheck(migrationId, resolver, records);
  },

  onDNSConfigError: (migrationId: string, error: string, details?: string) => {
    emitError(migrationId, 'Email Setup', error, details);
  },

  // Verification phase
  onVerificationStart: (migrationId: string) => {
    emitVerificationStart(migrationId);
  },

  onVerificationComplete: (migrationId: string, success: boolean, duration: number) => {
    emitVerificationComplete(migrationId, success, duration);
  },

  onVerificationError: (migrationId: string, error: string, details?: string) => {
    emitError(migrationId, 'Verification', error, details);
  },
};

/**
 * Example usage in migration engine:
 *
 * // In startMigration or runMigrationAsync:
 * const startTime = Date.now();
 * migrationEngineEvents.onAuthStart(jobId, 'HubSpot');
 *
 * try {
 *   const credentials = await authenticateWithHubSpot(apiKey);
 *   const duration = Date.now() - startTime;
 *   migrationEngineEvents.onAuthSuccess(jobId, 'HubSpot', duration);
 * } catch (error) {
 *   migrationEngineEvents.onAuthError(jobId, error.message);
 * }
 */
