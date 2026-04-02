/**
 * useMigrationProgress Hook
 * Real-time subscription to migration progress events
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface MigrationEventProgress {
  current: number;
  total: number;
  percentage: number;
}

export type MigrationEventStatus = 'pending' | 'running' | 'success' | 'warning' | 'error';

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

interface UseMigrationProgressOptions {
  migrationId: string;
  token?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useMigrationProgress({
  migrationId,
  token,
  onComplete,
  onError,
}: UseMigrationProgressOptions) {
  const [events, setEvents] = useState<MigrationEvent[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>();
  const [isComplete, setIsComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer to update elapsed time
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1000);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Subscribe to event stream
  useEffect(() => {
    if (!migrationId) return;

    const streamUrl = new URL('/api/migration/stream', window.location.origin);
    streamUrl.searchParams.set('migrationId', migrationId);
    if (token) {
      streamUrl.searchParams.set('token', token);
    }

    const eventSource = new EventSource(streamUrl.toString());
    eventSourceRef.current = eventSource;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'connected') {
          setIsConnected(true);
        } else if (data.type === 'stream') {
          // Update from stream snapshot
          setEvents(data.events || []);
          setOverallProgress(data.overallProgress || 0);
          setTimeElapsed(data.timeElapsed || 0);
          setEstimatedTimeRemaining(data.estimatedTimeRemaining);
          setIsComplete(data.isComplete || false);
          setHasErrors(data.hasErrors || false);

          if (data.isComplete && onComplete) {
            onComplete();
          }
        } else if (data.type === 'event') {
          // Add new event
          const event = data.event as MigrationEvent;
          setEvents(prev => [...prev, event]);

          // Update progress from event
          if (event.status === 'error') {
            setHasErrors(true);
          }
        }
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    };

    const handleError = () => {
      setIsConnected(false);
      if (onError) {
        onError(new Error('Connection lost'));
      }
    };

    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('message', handleMessage);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [migrationId, token, onComplete, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    events,
    overallProgress,
    timeElapsed,
    estimatedTimeRemaining,
    isComplete,
    hasErrors,
    isConnected,
    disconnect,
  };
}

/**
 * Format milliseconds to human-readable time
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Get status icon for event
 */
export function getStatusIcon(status: MigrationEventStatus): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'running':
      return '⏳';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'pending':
      return '⏸️';
    default:
      return '•';
  }
}

/**
 * Get status color for Tailwind
 */
export function getStatusColor(status: MigrationEventStatus): string {
  switch (status) {
    case 'success':
      return 'text-green-600';
    case 'running':
      return 'text-blue-600';
    case 'warning':
      return 'text-amber-600';
    case 'error':
      return 'text-red-600';
    case 'pending':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get status background color for Tailwind
 */
export function getStatusBgColor(status: MigrationEventStatus): string {
  switch (status) {
    case 'success':
      return 'bg-green-50';
    case 'running':
      return 'bg-blue-50';
    case 'warning':
      return 'bg-amber-50';
    case 'error':
      return 'bg-red-50';
    case 'pending':
      return 'bg-gray-50';
    default:
      return 'bg-gray-50';
  }
}
