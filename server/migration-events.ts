/**
 * Migration Event System
 * Real-time event streaming for migration and setup progress
 */

export type MigrationEventStatus = 'pending' | 'running' | 'success' | 'warning' | 'error';

export interface MigrationEventProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface MigrationEvent {
  id: string;
  timestamp: number;
  step: string;
  action: string;
  status: MigrationEventStatus;
  message: string;
  duration?: number;
  progress?: MigrationEventProgress;
  details?: string;
  children?: MigrationEvent[];
  metadata?: Record<string, any>;
}

export interface MigrationEventStream {
  migrationId: string;
  events: MigrationEvent[];
  overallProgress: number;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
  isComplete: boolean;
  hasErrors: boolean;
}

/**
 * Event emitter for streaming migration events to clients
 */
export class MigrationEventEmitter {
  private events: Map<string, MigrationEvent[]> = new Map();
  private subscribers: Map<string, Set<(event: MigrationEvent) => void>> = new Map();
  private startTimes: Map<string, number> = new Map();

  subscribe(migrationId: string, callback: (event: MigrationEvent) => void): () => void {
    if (!this.subscribers.has(migrationId)) {
      this.subscribers.set(migrationId, new Set());
      this.events.set(migrationId, []);
      this.startTimes.set(migrationId, Date.now());
    }

    const subs = this.subscribers.get(migrationId)!;
    subs.add(callback);

    // Return unsubscribe function
    return () => {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(migrationId);
      }
    };
  }

  emit(migrationId: string, event: Omit<MigrationEvent, 'id' | 'timestamp'>): void {
    const fullEvent: MigrationEvent = {
      ...event,
      id: `${migrationId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Store event
    if (!this.events.has(migrationId)) {
      this.events.set(migrationId, []);
    }
    this.events.get(migrationId)!.push(fullEvent);

    // Notify subscribers
    const subs = this.subscribers.get(migrationId);
    if (subs) {
      subs.forEach(callback => callback(fullEvent));
    }
  }

  getEvents(migrationId: string): MigrationEvent[] {
    return this.events.get(migrationId) || [];
  }

  getStream(migrationId: string): MigrationEventStream {
    const events = this.getEvents(migrationId);
    const startTime = this.startTimes.get(migrationId) || Date.now();
    const timeElapsed = Date.now() - startTime;

    // Calculate overall progress
    const completedSteps = events.filter(e => e.status === 'success').length;
    const totalSteps = events.filter(e => e.step !== undefined).length;
    const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Check for errors
    const hasErrors = events.some(e => e.status === 'error');

    // Estimate time remaining (rough estimate based on current pace)
    let estimatedTimeRemaining: number | undefined;
    if (overallProgress > 0 && overallProgress < 100) {
      const estimatedTotal = (timeElapsed / overallProgress) * 100;
      estimatedTimeRemaining = Math.max(0, estimatedTotal - timeElapsed);
    }

    return {
      migrationId,
      events,
      overallProgress,
      timeElapsed,
      estimatedTimeRemaining,
      isComplete: overallProgress === 100 || hasErrors,
      hasErrors,
    };
  }

  clear(migrationId: string): void {
    this.events.delete(migrationId);
    this.subscribers.delete(migrationId);
    this.startTimes.delete(migrationId);
  }
}

// Global event emitter instance
export const migrationEventEmitter = new MigrationEventEmitter();

/**
 * Helper functions for emitting common events
 */

export function emitAuthenticationStart(migrationId: string, platform: string) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Authentication',
    action: `Authenticating with ${platform}`,
    status: 'running',
    message: `Initiating OAuth flow with ${platform}...`,
  });
}

export function emitAuthenticationSuccess(migrationId: string, platform: string, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Authentication',
    action: `${platform} authentication successful`,
    status: 'success',
    message: `Successfully authenticated with ${platform}`,
    duration,
  });
}

export function emitDataPreparationStart(migrationId: string) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Preparing data for import',
    status: 'running',
    message: 'Analyzing source data...',
  });
}

export function emitContactsDetected(migrationId: string, count: number, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Fetching contact count',
    status: 'success',
    message: `Found ${count} contacts`,
    duration,
  });
}

export function emitCompaniesDetected(migrationId: string, count: number, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Fetching company count',
    status: 'success',
    message: `Found ${count} companies`,
    duration,
  });
}

export function emitDealsDetected(migrationId: string, count: number, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Fetching deal count',
    status: 'success',
    message: `Found ${count} deals`,
    duration,
  });
}

export function emitCustomFieldsAnalysis(migrationId: string, contactFields: number, companyFields: number, dealFields: number, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Analyzing custom fields',
    status: 'success',
    message: `Found ${contactFields} contact, ${companyFields} company, and ${dealFields} deal custom fields`,
    duration,
    metadata: {
      contactFields,
      companyFields,
      dealFields,
    },
  });
}

export function emitFieldMappingStart(migrationId: string) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Building field mapping',
    status: 'running',
    message: 'Mapping source fields to AXIOM fields...',
  });
}

export function emitFieldMappingProgress(migrationId: string, mapped: number, total: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Building field mapping',
    status: 'running',
    message: `Mapped ${mapped}/${total} fields`,
    progress: {
      current: mapped,
      total,
      percentage: Math.round((mapped / total) * 100),
    },
  });
}

export function emitFieldMappingComplete(migrationId: string, mapped: number, total: number, needsReview: number, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Preparation',
    action: 'Field mapping complete',
    status: needsReview > 0 ? 'warning' : 'success',
    message: needsReview > 0
      ? `Mapped ${mapped}/${total} fields (${needsReview} need review)`
      : `Successfully mapped ${mapped}/${total} fields`,
    duration,
    metadata: {
      mapped,
      total,
      needsReview,
    },
  });
}

export function emitDataImportStart(migrationId: string, totalRecords: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Import',
    action: 'Starting data import',
    status: 'running',
    message: `Importing ${totalRecords} records...`,
    progress: {
      current: 0,
      total: totalRecords,
      percentage: 0,
    },
  });
}

export function emitDataImportProgress(migrationId: string, imported: number, total: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Import',
    action: 'Importing records',
    status: 'running',
    message: `Imported ${imported}/${total} records`,
    progress: {
      current: imported,
      total,
      percentage: Math.round((imported / total) * 100),
    },
  });
}

export function emitDataImportComplete(migrationId: string, imported: number, failed: number, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Data Import',
    action: 'Data import complete',
    status: failed > 0 ? 'warning' : 'success',
    message: failed > 0
      ? `Imported ${imported} records (${failed} failed)`
      : `Successfully imported ${imported} records`,
    duration,
    metadata: {
      imported,
      failed,
    },
  });
}

export function emitDNSConfigurationStart(migrationId: string, domain: string) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Email Setup',
    action: 'Setting up email domain',
    status: 'running',
    message: `Configuring DNS for ${domain}...`,
  });
}

export function emitDNSProviderDetected(migrationId: string, provider: string, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Email Setup',
    action: 'Detecting DNS provider',
    status: 'success',
    message: `Detected ${provider}`,
    duration,
  });
}

export function emitDNSRecordCreated(migrationId: string, recordType: string, value: string, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Email Setup',
    action: `Creating ${recordType} record`,
    status: 'success',
    message: `${recordType} record created`,
    duration,
    details: value,
  });
}

export function emitDNSPropagationCheck(migrationId: string, resolver: string, records: { spf: boolean; dkim: boolean; dmarc: boolean }) {
  const allPropagated = records.spf && records.dkim && records.dmarc;
  migrationEventEmitter.emit(migrationId, {
    step: 'Email Setup',
    action: `Checking DNS propagation on ${resolver}`,
    status: allPropagated ? 'success' : 'running',
    message: `${resolver}: SPF=${records.spf ? '✓' : '✗'} DKIM=${records.dkim ? '✓' : '✗'} DMARC=${records.dmarc ? '✓' : '✗'}`,
    metadata: records,
  });
}

export function emitVerificationStart(migrationId: string) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Verification',
    action: 'Starting verification',
    status: 'running',
    message: 'Verifying setup...',
  });
}

export function emitVerificationComplete(migrationId: string, success: boolean, duration: number) {
  migrationEventEmitter.emit(migrationId, {
    step: 'Verification',
    action: 'Verification complete',
    status: success ? 'success' : 'warning',
    message: success ? 'All checks passed' : 'Some checks need attention',
    duration,
  });
}

export function emitError(migrationId: string, step: string, error: string, details?: string) {
  migrationEventEmitter.emit(migrationId, {
    step,
    action: 'Error occurred',
    status: 'error',
    message: error,
    details,
  });
}
